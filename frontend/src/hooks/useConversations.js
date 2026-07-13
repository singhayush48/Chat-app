import { useCallback, useEffect, useState } from 'react';
import { conversationsApi } from '@/api/conversationsApi';
import { useAuth } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversation';
import { getErrorMessage } from '@/utils/errorMessage';

/**
 * The verified backend returns bare conversation rows with no participant
 * info (see CONVERSATIONS.LIST in constants/endpoints.js for the planned
 * fix). Until that ships, we can't know who a private conversation is
 * with just from this list — so each row is passed through as-is, and
 * UI components fall back to a generic label when `other_user` is absent.
 */
export function useConversations() {
  const { user } = useAuth();
  const { conversations, setConversations } = useConversation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // No setState call happens before the first `await` here — keeps this
  // safe to invoke directly from an effect (see useEffect below) without
  // triggering synchronous cascading renders.
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const rows = await conversationsApi.list();
      setConversations(rows ?? []);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your conversations.'));
    } finally {
      setIsLoading(false);
    }
  }, [user, setConversations]);

  useEffect(() => {
    async function run() {
      await fetchConversations();
    }
    run();
  }, [fetchConversations]);

  return { conversations, isLoading, error, refetch: fetchConversations };
}
