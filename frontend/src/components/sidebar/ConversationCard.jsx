import { NavLink } from 'react-router-dom';
import { Avatar } from '@/components/common/Avatar';
import { OnlineStatusDot } from '@/components/common/OnlineStatusDot';
import { formatMessageTime } from '@/utils/formatTime';
import { cn } from '@/utils/cn';

/**
 * `conversation.other_user` / `conversation.last_message` only exist once
 * the backend ships the planned enrichment (see constants/endpoints.js).
 * Until then we fall back to a generic label rather than fabricating a
 * name or message preview.
 */
export function ConversationCard({ conversation }) {
  const otherUser = conversation.other_user ?? null;
  const lastMessage = conversation.last_message ?? null;
  const displayName = otherUser?.username ?? `Conversation`;

  return (
    <NavLink
      to={`/c/${conversation.conversation_id}`}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors',
          isActive ? 'bg-surface-elevated' : 'hover:bg-surface-elevated/60'
        )
      }
    >
      <div className="relative shrink-0">
        <Avatar name={otherUser?.username ?? '?'} src={otherUser?.profile_pic} size="md" />
        <OnlineStatusDot
          isOnline={otherUser?.isOnline}
          className="absolute -bottom-0.5 -right-0.5"
        />
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
        <p className="truncate text-xs text-muted-foreground">
          {lastMessage?.content ?? 'Tap to view messages'}
        </p>
      </div>
    </NavLink>
  );
}
