import { useParams } from 'react-router-dom';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { useMessages } from '@/hooks/useMessages';

export default function ChatConversation() {
  const { conversationId } = useParams();
  const { messages, isLoading, error, isSending, sendMessage, editMessage, deleteMessage, refetch } =
    useMessages(conversationId);

  return (
    <div key={conversationId} className="flex h-full flex-col animate-fade-in">
      <ChatHeader />
      <MessageList
        messages={messages}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        onEditMessage={editMessage}
        onDeleteMessage={deleteMessage}
      />
      <MessageInput onSend={sendMessage} isSending={isSending} />
    </div>
  );
}
