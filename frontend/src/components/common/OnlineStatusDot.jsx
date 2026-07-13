import { cn } from '@/utils/cn';

/**
 * PLACEHOLDER per project spec. The backend has no presence/online field
 * on users at all, so `isOnline` will always be `undefined`/`false` in
 * practice today — we render the dot honestly (gray/hidden) rather than
 * fabricating online status. Wire this up once presence exists (likely
 * via the Socket.IO connection once it's turned on).
 */
export function OnlineStatusDot({ isOnline, className }) {
  return (
    <span
      aria-label={isOnline ? 'Online' : 'Offline'}
      className={cn(
        'block h-2.5 w-2.5 rounded-full ring-2 ring-surface',
        isOnline ? 'bg-accent' : 'bg-muted-foreground/40',
        className
      )}
    />
  );
}
