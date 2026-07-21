import { useEffect, useRef } from 'react';
import { getSocket, disconnectSocket } from '@/services/socket';
import { conversationsApi } from '@/api/conversationsApi';
import { useAuth } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversation';
import { SocketContext } from './socket-context';

/**
 * Owns the single Socket.IO connection for the whole app and the
 * app-wide (not-tied-to-one-open-conversation) events:
 *
 *   - presence:online_contacts / user:online / user:offline
 *       -> keep each conversation's `other_user.is_online` / `last_seen`
 *          live in ConversationContext, so the sidebar's dots update
 *          instantly without a refetch.
 *   - conversation:created
 *       -> a contact started a brand-new conversation with us; refetch
 *          the list so it appears without a page reload.
 *   - message:new
 *       -> refresh that conversation's sidebar preview (content + time),
 *          bump it to the top, increment its unread badge if it's not
 *          the conversation currently open, and acknowledge delivery for
 *          conversations that AREN'T open (useMessages() handles the ack
 *          itself for whichever one is open, so this skips that case to
 *          avoid emitting it twice).
 *
 * Per-conversation concerns (joining a conversation's room, live message
 * edits/deletes, typing indicators, read receipts) are handled by
 * useMessages() instead — those only matter while that conversation is
 * actually open on screen.
 */
export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const { setConversations, activeConversationId } = useConversation();
  // Read inside listeners via a ref so the effect that registers them
  // doesn't need to re-run (and thus re-subscribe) every time the open
  // conversation changes.
  const activeConversationIdRef = useRef(activeConversationId);
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);


  useEffect(() => {
    if (!activeConversationId) return;

    setConversations((prev) =>
        prev.map((conversation) =>
            String(conversation.conversation_id) === String(activeConversationId)
                ? {
                      ...conversation,
                      unread_count: 0,
                  }
                : conversation
        )
    );
}, [activeConversationId, setConversations]);
  // getSocket() just returns/creates the singleton (autoConnect: false),
  // so calling it during render has no side effects — it's connect()
  // below, inside the effect, that actually opens the connection.
  const socket = getSocket();

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    socket.connect();

    const setUserPresence = (userId, patch) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.other_user && String(c.other_user.user_id) === String(userId)
            ? { ...c, other_user: { ...c.other_user, ...patch } }
            : c
        )
      );
    };

    const handleOnlineContacts = ({ userIds = [] } = {}) => {
      const online = new Set(userIds.map(String));
      setConversations((prev) =>
        prev.map((c) =>
          c.other_user
            ? { ...c, other_user: { ...c.other_user, is_online: online.has(String(c.other_user.user_id)) } }
            : c
        )
      );
    };

    const handleUserOnline = ({ userId } = {}) => {
      if (!userId) return;
      setUserPresence(userId, { is_online: true });
    };

    const handleUserOffline = ({ userId, lastSeen } = {}) => {
      if (!userId) return;
      setUserPresence(userId, { is_online: false, last_seen: lastSeen });
    };

    const handleConversationCreated = async () => {
      try {
        const rows = await conversationsApi.list();
        setConversations(rows ?? []);
      } catch {
        // Best-effort — the conversation will still show up next time the
        // sidebar refetches (e.g. on next navigation or reload).
      }
    };

    const handleMessageNew = ({ conversationId, message } = {}) => {
      console.log("NEW MESSAGE RECEIVED");
      if (!conversationId || !message) return;
      const isViewingThisConversation =
        String(activeConversationIdRef.current) === String(conversationId);
      const isOwnMessage = String(message.sender_id) === String(user?.user_id);

      // useMessages() already acks delivery for the conversation that's
      // actually open — this covers every other conversation, now that
      // the backend auto-joins the socket to all of them on connect.
      if (!isOwnMessage) {
  socket.emit("message:delivered", {
    messageId: message.message_id ?? message.id,
    conversationId,
  });
}

      setConversations((prev) => {
        const index = prev.findIndex((c) => String(c.conversation_id) === String(conversationId));
        if (index === -1) return prev; // unknown conversation — conversation:created will resync it

        const updated = {
          ...prev[index],
          last_message: {
  ...prev[index].last_message,
  ...message,
},
          updated_at: message.created_at,
          unread_count:
            !isOwnMessage && !isViewingThisConversation
              ? (prev[index].unread_count ?? 0) + 1
              : prev[index].unread_count ?? 0,
        };

        // Bump the conversation with the newest activity to the top of
        // the list, like every chat app does.
        const rest = prev.filter((_, i) => i !== index);
        return [updated, ...rest];
      });
    };

    socket.on('presence:online_contacts', handleOnlineContacts);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('conversation:created', handleConversationCreated);
    socket.on("message:statusUpdated", (data) => {
    console.log("STATUS UPDATED RECEIVED", data);
});
    const handleMessageStatusUpdated = ({ messageId, status } = {}) => {
  if (!messageId || !status) return;

  // This provider manages only the conversation list/sidebar.
  // The actual messages are managed by useMessages().
  // So we simply forward the event to the active chat.

  window.dispatchEvent(
    new CustomEvent("message:statusUpdated", {
      detail: {
        messageId,
        status,
      },
    })
  );
};
    socket.on("message:statusUpdated", (data) => {
    console.log("STATUS UPDATE RECEIVED:", data);
});
    return () => {
      socket.off('presence:online_contacts', handleOnlineContacts);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
      socket.off('conversation:created', handleConversationCreated);
      socket.off('message:new', handleMessageNew);
      socket.off("message:statusUpdated", handleMessageStatusUpdated);
     
    };
  }, [isAuthenticated, user?.user_id, setConversations, socket]);

  // Disconnect on unmount too (e.g. hot reload in dev, or the provider
  // ever being removed from the tree).
  useEffect(() => () => disconnectSocket(), []);

  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>;
}
