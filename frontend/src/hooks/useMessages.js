import { useCallback, useEffect, useRef, useState } from 'react';
import { messagesApi } from '@/api/messagesApi';
import { getErrorMessage } from '@/utils/errorMessage';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { normalizeMessageStatus } from '@/utils/messageStatus';

// Stable reference (not a new `[]` literal every render) so effects that
// depend on `messages` don't re-run just because the conversation is
// still loading.
const EMPTY_MESSAGES = [];

/**
 * Result is keyed by the conversationId it was fetched for, so switching
 * conversations derives `isLoading` from a simple comparison instead of
 * needing a separate effect-driven "reset to loading" state update (which
 * would fire a setState synchronously inside the effect on every switch).
 *
 * Also owns everything real-time for whichever conversation is open:
 * joining/leaving its Socket.IO room, merging in live message:new /
 * message:edited / message:deleted events, typing indicators, and the
 * sent/delivered/seen status ticks (see "message:delivered" /
 * "message:seen" / "message:statusUpdated" in backend/sockets/socket.js).
 */
export function useMessages(conversationId) {
  const socket = useSocket();
  const { user } = useAuth();
  const [result, setResult] = useState({ conversationId: null, messages: [], error: null });
  const [isSending, setIsSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const rows = await messagesApi.getByConversation(conversationId);
      setResult({ conversationId, messages: rows ?? [], error: null });
    } catch (err) {
      setResult({
        conversationId,
        messages: [],
        error: getErrorMessage(err, 'Could not load this conversation.'),
      });
    }
  }, [conversationId]);

  useEffect(() => {
    async function run() {
      await fetchMessages();
    }
    run();
  }, [fetchMessages]);

  // Reset transient real-time state when switching conversations so it
  // doesn't leak stale typing status from the previous chat.
  useEffect(() => {
    let isMounted = true;
    async function reset() {
      await Promise.resolve();
      if (!isMounted) return;
      setIsOtherTyping(false);
    }
    reset();
    return () => {
      isMounted = false;
    };
  }, [conversationId]);

  // Join this conversation's Socket.IO room while it's open, and wire up
  // every event scoped to it. Re-runs on conversation switch.
  useEffect(() => {
    if (!conversationId) return;

    socket.emit('conversation:join', { conversationId });

    const isThisConversation = (cId) => String(cId) === String(conversationId);

    const handleNewMessage = ({ conversationId: cId, message } = {}) => {
      if (!isThisConversation(cId) || !message) return;
      setResult((prev) => {
        if (prev.conversationId !== conversationId) return prev;
        const messageId = message.message_id ?? message.id;
        // Our own messages are already in state from sendMessage()'s
        // optimistic append — this event just confirms them.
        const alreadyExists = prev.messages.some((m) => (m.message_id ?? m.id) === messageId);
        if (alreadyExists) return prev;
        return { ...prev, messages: [...prev.messages, message] };
      });

      // We're the recipient of someone else's message and we're looking
      // right at this conversation — acknowledge delivery immediately.
      // (SocketProvider does the same for conversations that aren't
      // open, via room auto-join on connect; this covers the "open"
      // case too so delivery fires the instant it lands, not on a delay.)
      if (String(message.sender_id) !== String(user?.user_id)) {
        socket.emit('message:delivered', { messageId: message.message_id ?? message.id, conversationId });
      }
    };

    const handleEdited = ({ conversationId: cId, messageId, content } = {}) => {
      if (!isThisConversation(cId)) return;
      setResult((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          (m.message_id ?? m.id) === messageId
            ? { ...m, content, updated_at: new Date().toISOString() }
            : m
        ),
      }));
    };

    const handleDeleted = ({ conversationId: cId, messageId } = {}) => {
      if (!isThisConversation(cId)) return;
      setResult((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          (m.message_id ?? m.id) === messageId ? { ...m, is_deleted: true, content: '' } : m
        ),
      }));
    };

    const handleTypingStart = ({ conversationId: cId } = {}) => {
      if (isThisConversation(cId)) setIsOtherTyping(true);
    };

    const handleTypingStop = ({ conversationId: cId } = {}) => {
      if (isThisConversation(cId)) setIsOtherTyping(false);
    };

    // "message:statusUpdated" comes in two shapes from the backend:
    //   - delivered: { messageId, status: "DELIVERED" } — one specific message
    //   - seen:      { conversationId, status: "SEEN" }  — everything we've
    //     sent in this conversation, since markMessagesAsSeen() flips every
    //     unseen message from the other side's read in one go.
    const handleStatusUpdated = ({ conversationId: cId, messageId, status } = {}) => {
      const normalized = normalizeMessageStatus(status);
      if (messageId) {
        setResult((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            (m.message_id ?? m.id) === messageId ? { ...m, status: normalized } : m
          ),
        }));
        return;
      }
      if (isThisConversation(cId) && normalized === 'seen') {
        setResult((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            String(m.sender_id) === String(user?.user_id) ? { ...m, status: 'seen' } : m
          ),
        }));
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:edited', handleEdited);
    socket.on('message:deleted', handleDeleted);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('message:statusUpdated', handleStatusUpdated);

    return () => {
      socket.emit('conversation:leave', { conversationId });
      socket.off('message:new', handleNewMessage);
      socket.off('message:edited', handleEdited);
      socket.off('message:deleted', handleDeleted);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('message:statusUpdated', handleStatusUpdated);
    };
  }, [conversationId, socket, user?.user_id]);

  const isLoading = result.conversationId !== conversationId;
  const messages = isLoading ? EMPTY_MESSAGES : result.messages;
  const error = isLoading ? null : result.error;

  // Tell the backend we've seen everything in this conversation. Fires
  // whenever the message list changes while it's open (covers both "just
  // opened it" and "a new message arrived while already looking at it").
  // The backend only actually updates rows that aren't already seen, so
  // this re-firing harmlessly is cheap.
  useEffect(() => {
    if (isLoading || messages.length === 0) return;
    socket.emit('message:seen', { conversationId });
  }, [isLoading, messages, conversationId, socket]);

  const sendMessage = useCallback(
    async (content) => {
      setIsSending(true);
      try {
        const newMessage = await messagesApi.send({ conversationId, content });
        // Optimistically append rather than refetching the whole list —
        // keeps sending snappy on slower connections. The matching
        // message:new socket event (see handleNewMessage above) can
        // legitimately arrive BEFORE this REST response resolves (the
        // socket is already open, so the broadcast often beats the HTTP
        // round trip), so guard against appending the same message twice.
        setResult((prev) => {
          const messageId = newMessage.message_id ?? newMessage.id;
          const alreadyExists = prev.messages.some((m) => (m.message_id ?? m.id) === messageId);
          if (alreadyExists) return prev;
          return { ...prev, messages: [...prev.messages, newMessage] };
        });
        return newMessage;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId]
  );

  const editMessage = useCallback(async (messageId, content) => {
    // Optimistic: flip the bubble to the new content immediately, roll
    // back if the request fails.
    let previous;
    setResult((prev) => {
      previous = prev.messages;
      return {
        ...prev,
        messages: prev.messages.map((m) =>
          (m.message_id ?? m.id) === messageId
            ? { ...m, content, updated_at: new Date().toISOString() }
            : m
        ),
      };
    });
    try {
      await messagesApi.edit(messageId, content);
    } catch (err) {
      setResult((prev) => ({ ...prev, messages: previous }));
      throw err;
    }
  }, []);

  const deleteMessage = useCallback(async (messageId) => {
    let previous;
    setResult((prev) => {
      previous = prev.messages;
      return {
        ...prev,
        messages: prev.messages.map((m) =>
          (m.message_id ?? m.id) === messageId
            ? { ...m, is_deleted: true, content: '' }
            : m
        ),
      };
    });
    try {
      await messagesApi.remove(messageId);
    } catch (err) {
      setResult((prev) => ({ ...prev, messages: previous }));
      throw err;
    }
  }, []);

  const startTyping = useCallback(() => {
    if (!conversationId) return;
    socket.emit('typing:start', { conversationId });
    // Auto-stop after a pause in typing, in case the user never presses
    // send or deletes everything (no keyup-triggered stop otherwise).
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId });
    }, 2000);
  }, [conversationId, socket]);

  const stopTyping = useCallback(() => {
    if (!conversationId) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing:stop', { conversationId });
  }, [conversationId, socket]);

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    },
    []
  );

  return {
    messages,
    isLoading,
    error,
    isSending,
    sendMessage,
    editMessage,
    deleteMessage,
    refetch: fetchMessages,
    isOtherTyping,
    startTyping,
    stopTyping,
  };
}
