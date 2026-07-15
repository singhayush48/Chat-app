import { NavLink } from 'react-router-dom';
import { Avatar } from '@/components/common/Avatar';
import { OnlineStatusDot } from '@/components/common/OnlineStatusDot';
import { formatMessageTime, formatLastSeen } from '@/utils/formatTime';
import { cn } from '@/utils/cn';

/**
 * `conversation.other_user` / `conversation.last_message` come from the
 * backend's enriched GET /api/auth/conversations. `other_user` can still
 * be null for an edge case (e.g. the other member left), so we fall back
 * to a generic label rather than crashing or fabricating a name.
 */
export function ConversationCard({ conversation }) {
  const otherUser = conversation.other_user ?? null;
  const lastMessage = conversation.last_message ?? null;
  const displayName = otherUser?.username ?? 'Conversation';
  const isOnline = Boolean(otherUser?.is_online);
  const lastSeenText = !isOnline ? formatLastSeen(otherUser?.last_seen) : null;
  const lastMessagePreview = lastMessage?.is_deleted
    ? 'This message was deleted.'
    : (lastMessage?.content ?? (isOnline ? 'Online' : lastSeenText) ?? 'Tap to view messages');

  // UI-only placeholder: the backend doesn't send an unread count today,
  // so this only ever renders once `conversation.unread_count` exists.
  const unreadCount = conversation.unread_count ?? 0;

  return (
    <NavLink
      to={`/c/${conversation.conversation_id}`}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-2.5 py-3 transition-colors duration-150',
          isActive ? 'bg-surface-elevated' : 'hover:bg-surface-elevated/60'
        )
      }
    >
      <div className="relative shrink-0">
        <Avatar name={otherUser?.username ?? '?'} src={otherUser?.profile_pic} size="md" />
        <OnlineStatusDot isOnline={isOnline} className="absolute -bottom-0.5 -right-0.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
          {lastMessage?.created_at && (
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {formatMessageTime(lastMessage.created_at)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground">{lastMessagePreview}</p>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </NavLink>
  );
}
