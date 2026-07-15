import { cn } from '@/utils/cn';

/**
 * Backed by real data: `other_user.is_online` from GET /api/auth/conversations.
 */
export function OnlineStatusDot({ isOnline, className }) {
  return (
    <span className={cn('relative flex h-2.5 w-2.5', className)}>
      {isOnline && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
      )}
      <span
        aria-label={isOnline ? 'Online' : 'Offline'}
        title={isOnline ? 'Online' : 'Offline'}
        className={cn(
          'relative block h-2.5 w-2.5 rounded-full ring-2 ring-surface',
          isOnline ? 'bg-accent' : 'bg-muted-foreground/40'
        )}
      />
    </span>
  );
}
