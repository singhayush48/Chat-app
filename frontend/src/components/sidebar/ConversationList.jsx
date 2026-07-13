import { Inbox } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { ConversationCard } from '@/components/sidebar/ConversationCard';
import { ConversationListSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorScreen } from '@/components/common/ErrorScreen';

export function ConversationList() {
  const { conversations, isLoading, error, refetch } = useConversations();
  const safeConversations = Array.isArray(conversations) ? conversations : [];

  if (isLoading) return <ConversationListSkeleton />;

  if (error) {
    return <ErrorScreen title="Couldn't load chats" message={error} onRetry={refetch} />;
  }

  if (safeConversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
        <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          No conversations yet. Search for someone to start chatting.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex-1 space-y-0.5 overflow-y-auto p-2" aria-label="Conversations">
      {safeConversations.map((conversation) => (
        <li key={conversation.conversation_id}>
          <ConversationCard conversation={conversation} />
        </li>
      ))}
    </ul>
  );
}
