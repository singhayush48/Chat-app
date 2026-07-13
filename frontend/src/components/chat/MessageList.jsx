import { useEffect, useRef } from 'react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageListSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorScreen } from '@/components/common/ErrorScreen';
import { useAuth } from '@/hooks/useAuth';

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
    <div className="flex-1 space-y-2 overflow-y-auto p-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.message_id ?? message.id ?? `${message.sender_id}-${message.created_at}`}
          message={message}
          isOwn={String(message.sender_id) === String(user?.user_id)}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
