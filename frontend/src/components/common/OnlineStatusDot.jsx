import { cn } from '@/utils/cn';

/**
 * Backed by real data: `other_user.is_online` from GET /api/auth/conversations.
 */
export function OnlineStatusDot({ isOnline, className }) {
  return (
    <span
      aria-label={isOnline ? 'Online' : 'Offline'}
      title={isOnline ? 'Online' : 'Offline'}
      className={cn(
        'block h-2.5 w-2.5 rounded-full ring-2 ring-surface',
        isOnline ? 'bg-accent' : 'bg-muted-foreground/40',
        className
      )}
    />
  );
}
