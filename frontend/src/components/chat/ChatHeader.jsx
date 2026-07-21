import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { OnlineStatusDot } from '@/components/common/OnlineStatusDot';
import { UserProfileDrawer } from '@/components/common/UserProfileDrawer';
import { useConversation } from '@/hooks/useConversation';
import { formatLastSeen } from '@/utils/formatTime';
import { cn } from '@/utils/cn';

export function ChatHeader({ searchOpen, onToggleSearch }) {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { conversations } = useConversation();
  const [profileOpen, setProfileOpen] = useState(false);

  const conversation = conversations.find(
    (c) => String(c.conversation_id) === String(conversationId)
  );
  const otherUser = conversation?.other_user ?? null;
  const displayName = otherUser?.username ?? 'Conversation';
  const isOnline = Boolean(otherUser?.is_online);
  const statusText = isOnline ? 'Online' : formatLastSeen(otherUser?.last_seen);

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border bg-surface/60 px-4 py-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Back to conversations"
          className="rounded-md p-1 text-muted-foreground hover:bg-surface-elevated hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => otherUser && setProfileOpen(true)}
          disabled={!otherUser}
          aria-label={otherUser ? `View ${displayName}'s profile` : undefined}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 pl-1 pr-2 text-left transition-colors hover:bg-surface-elevated disabled:cursor-default disabled:hover:bg-transparent"
        >
          <div className="relative shrink-0">
            <Avatar name={otherUser?.username ?? '?'} src={otherUser?.profile_pic} size="sm" />
            <OnlineStatusDot isOnline={isOnline} className="absolute -bottom-0.5 -right-0.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
            {statusText && (
              <p
                className={cn(
                  'truncate text-xs',
                  isOnline ? 'text-accent' : 'text-muted-foreground'
                )}
              >
                {statusText}
              </p>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={onToggleSearch}
          aria-label={searchOpen ? 'Close search' : 'Search this conversation'}
          aria-pressed={searchOpen}
          className={cn(
            'shrink-0 rounded-md p-1.5 transition-colors hover:bg-surface-elevated hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            searchOpen ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <UserProfileDrawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={otherUser}
      />
    </>
  );
}
