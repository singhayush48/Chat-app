/**
 * PLACEHOLDER per project spec. There is no "user is typing" signal from
 * the backend (would need the Socket.IO connection, which is
 * intentionally not turned on yet — see services/socket.js). This
 * component is ready to drop in once that event exists; nothing renders
 * it today.
 */
export function TypingIndicator({ name }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
      </span>
      {name ? `${name} is typing…` : 'Typing…'}
    </div>
  );
}
