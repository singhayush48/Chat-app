import { useCallback, useEffect, useState } from 'react';
import { messagesApi } from '@/api/messagesApi';
import { getErrorMessage } from '@/utils/errorMessage';

/**
 * Result is keyed by the conversationId it was fetched for, so switching
 * conversations derives `isLoading` from a simple comparison instead of
 * needing a separate effect-driven "reset to loading" state update (which
 * would fire a setState synchronously inside the effect on every switch).
 */
export function useMessages(conversationId) {
  const [result, setResult] = useState({ conversationId: null, messages: [], error: null });
  const [isSending, setIsSending] = useState(false);

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

  const isLoading = result.conversationId !== conversationId;
  const messages = isLoading ? [] : result.messages;
  const error = isLoading ? null : result.error;

  const sendMessage = useCallback(
    async (content) => {
      setIsSending(true);
      try {
        const newMessage = await messagesApi.send({ conversationId, content });
        // Optimistically append rather than refetching the whole list —
        // keeps sending snappy on slower connections.
        setResult((prev) => ({ ...prev, messages: [...prev.messages, newMessage] }));
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

  return {
    messages,
    isLoading,
    error,
    isSending,
    sendMessage,
    editMessage,
    deleteMessage,
    refetch: fetchMessages,
  };
}
