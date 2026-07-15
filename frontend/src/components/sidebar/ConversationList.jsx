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
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center animate-fade-in">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-elevated">
          <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">No conversations yet</p>
          <p className="mt-1 max-w-[15rem] text-xs text-muted-foreground">
            Search for someone above to start your first chat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex-1 space-y-0.5 overflow-y-auto p-2 animate-fade-in" aria-label="Conversations">
      {safeConversations.map((conversation) => (
        <li key={conversation.conversation_id}>
          <ConversationCard conversation={conversation} />
        </li>
      ))}
    </ul>
  );
}
