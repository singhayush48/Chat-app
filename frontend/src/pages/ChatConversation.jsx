import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { MessageSearchBar } from '@/components/chat/MessageSearchBar';
import { TypingIndicator } from '@/components/common/TypingIndicator';
import { useMessages } from '@/hooks/useMessages';
import { useConversation } from '@/hooks/useConversation';
import { useMessageSearch } from '@/hooks/useMessageSearch';

export default function ChatConversation() {
  const { conversationId } = useParams();
  const { conversations, setConversations, setActiveConversationId } = useConversation();
  const {
    messages,
    isLoading,
    error,
    isSending,
    sendMessage,
    editMessage,
    deleteMessage,
    refetch,
    isOtherTyping,
    startTyping,
    stopTyping,
  } = useMessages(conversationId);

  const [searchOpen, setSearchOpen] = useState(false);
  const search = useMessageSearch(messages);
  const activeSearchMessageId = search.activeMessage
    ? (search.activeMessage.message_id ?? search.activeMessage.id)
    : null;

  const conversation = conversations.find(
    (c) => String(c.conversation_id) === String(conversationId)
  );
  const otherUsername = conversation?.other_user?.username;

  // Track which conversation is open (SocketProvider uses this to decide
  // whether an incoming message:new should bump the unread badge), and
  // clear that conversation's badge now that it's actually being viewed.
  useEffect(() => {
    setActiveConversationId(conversationId ?? null);
    if (conversationId) {
      setConversations((prev) =>
        prev.map((c) =>
          String(c.conversation_id) === String(conversationId) ? { ...c, unread_count: 0 } : c
        )
      );
    }
    return () => setActiveConversationId(null);
  }, [conversationId, setActiveConversationId, setConversations]);

  // Leaving search open across a conversation switch would show stale
  // results from the previous chat for a beat before re-filtering.
  useEffect(() => {
    let isMounted = true;
    async function reset() {
      await Promise.resolve();
      if (!isMounted) return;
      setSearchOpen(false);
      search.clear();
    }
    reset();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const closeSearch = () => {
    setSearchOpen(false);
    search.clear();
  };

  return (
    <div key={conversationId} className="flex h-full flex-col animate-fade-in">
      <ChatHeader searchOpen={searchOpen} onToggleSearch={() => setSearchOpen((prev) => !prev)} />
      {searchOpen && (
        <MessageSearchBar
          query={search.query}
          onQueryChange={search.setQuery}
          matchCount={search.matchCount}
          activeMatchNumber={search.activeMatchNumber}
          onNext={search.goNext}
          onPrev={search.goPrev}
          onClose={closeSearch}
        />
      )}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        onEditMessage={editMessage}
        onDeleteMessage={deleteMessage}
        activeSearchMessageId={activeSearchMessageId}
      />
      {isOtherTyping && <TypingIndicator name={otherUsername} />}
      <MessageInput
        onSend={sendMessage}
        isSending={isSending}
        onTypingStart={startTyping}
        onTypingStop={stopTyping}
      />
    </div>
  );
}
