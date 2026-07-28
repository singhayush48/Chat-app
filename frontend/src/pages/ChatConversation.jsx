import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Paperclip } from 'lucide-react';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { MessageSearchBar } from '@/components/chat/MessageSearchBar';
import { TypingIndicator } from '@/components/common/TypingIndicator';
import { useMessages } from '@/hooks/useMessages';
import { useConversation } from '@/hooks/useConversation';
import { useMessageSearch } from '@/hooks/useMessageSearch';
import { useMediaAttachment } from '@/hooks/useMediaAttachment';

export default function ChatConversation() {
  const { conversationId } = useParams();
  const { conversations, setConversations, setActiveConversationId } = useConversation();
  const {
    messages,
    isLoading,
    error,
    isSending,
    sendMessage,
    sendMedia,
    editMessage,
    deleteMessage,
    refetch,
    isOtherTyping,
    startTyping,
    stopTyping,
  } = useMessages(conversationId);

  const attachment = useMediaAttachment(sendMedia);

  const [searchOpen, setSearchOpen] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounterRef = useRef(0);
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

  // Dropping a file mid-upload/edit into a different conversation would be
  // confusing — clear any pending attachment on conversation switch.
  useEffect(() => {
    let isMounted = true;
    async function reset() {
      await Promise.resolve();
      if (!isMounted) return;
      attachment.clear();
      dragCounterRef.current = 0;
      setIsDraggingFile(false);
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

  // Drag-and-drop: counts enter/leave events (rather than just using
  // dragleave directly) because dragging over child elements fires
  // enter/leave pairs for each of them, which would otherwise flicker
  // the highlight on and off as the cursor crosses child boundaries.
  const handleDragEnter = (e) => {
    e.preventDefault();
    if (!e.dataTransfer?.types?.includes('Files')) return;
    dragCounterRef.current += 1;
    setIsDraggingFile(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) setIsDraggingFile(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingFile(false);
    if (e.dataTransfer?.files?.length) attachment.pickFiles(e.dataTransfer.files);
  };

  return (
    <div
      key={conversationId}
      className="relative flex h-full flex-col animate-fade-in"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
        attachment={attachment}
      />

      {isDraggingFile && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center border-2 border-dashed border-primary bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col items-center gap-2 text-primary">
            <Paperclip className="h-8 w-8" aria-hidden="true" />
            <p className="text-sm font-medium">Drop file to send</p>
          </div>
        </div>
      )}
    </div>
  );
}
