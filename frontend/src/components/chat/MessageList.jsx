import { useEffect, useRef } from 'react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageListSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorScreen } from '@/components/common/ErrorScreen';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

export function MessageList({ messages, isLoading, error, onRetry }) {
  const { user } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

        return (
          <div key={message.message_id ?? message.id ?? `${message.sender_id}-${message.created_at}`}
            className={cn(isSameSenderAsPrev ? 'mt-1' : 'mt-4', index === 0 && 'mt-0')}
          >
            <MessageBubble
              message={message}
              isOwn={String(message.sender_id) === String(user?.user_id)}
            />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
