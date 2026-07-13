import { useState } from 'react';
import { ConversationContext } from './conversation-context';

/**
 * Scaffold only for now. Conversation fetching (Phase 3) and message
 * fetching/sending (Phase 4) will populate this further. Kept here at the
 * app-shell level (rather than invented later) so the provider tree and
 * routing structure don't need to change shape in later phases.
 */
export function ConversationProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const value = {
    conversations,
    setConversations,
    activeConversationId,
    setActiveConversationId,
  };

  return (
    <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>
  );
}
