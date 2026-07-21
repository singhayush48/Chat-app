/**
 * Shown in the open conversation while the other participant is typing.
 * Driven by useMessages()'s `isOtherTyping`, which listens for the
 * backend's "typing:start" / "typing:stop" Socket.IO events scoped to
 * this conversation (see sockets/socket.js).
 */
export function TypingIndicator({ name }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground animate-fade-in">
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
      </span>
      {name ? `${name} is typing…` : 'Typing…'}
    </div>
  );
}
