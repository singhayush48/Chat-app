import { useEffect, useRef } from 'react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageListSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorScreen } from '@/components/common/ErrorScreen';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

export function MessageList({
  messages,
  isLoading,
  error,
  onRetry,
  onEditMessage,
  onDeleteMessage,
  activeSearchMessageId,
}) {
  const { user } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    // Search takes over scroll position while it's active — don't fight
    // it by also auto-scrolling to the bottom on every message change.
    if (activeSearchMessageId) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeSearchMessageId]);

  useEffect(() => {
    if (!activeSearchMessageId) return;
    document
      .getElementById(`message-${activeSearchMessageId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeSearchMessageId]);

  if (isLoading) return <MessageListSkeleton />;

  if (error) {
    return <ErrorScreen title="Couldn't load messages" message={error} onRetry={onRetry} />;
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No messages yet. Say hello to start the conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {messages.map((message, index) => {
        const prevMessage = messages[index - 1];
        // Tighter spacing between consecutive messages from the same
        // sender (a "burst"); more breathing room when the sender changes.
        const isSameSenderAsPrev = prevMessage && String(prevMessage.sender_id) === String(message.sender_id);
        const messageKey = message.message_id ?? message.id;
        const isActiveSearchResult =
          activeSearchMessageId != null && messageKey === activeSearchMessageId;

        return (
          <div
            key={messageKey ?? `${message.sender_id}-${message.created_at}`}
            id={messageKey != null ? `message-${messageKey}` : undefined}
            className={cn(
              isSameSenderAsPrev ? 'mt-1' : 'mt-4',
              index === 0 && 'mt-0',
              isActiveSearchResult && 'rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-background transition-all'
            )}
          >
            <MessageBubble
              message={message}
              isOwn={String(message.sender_id) === String(user?.user_id)}
              onEdit={onEditMessage}
              onDelete={onDeleteMessage}
            />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
