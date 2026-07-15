import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Circle } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { usersApi } from '@/api/usersApi';
import { formatLastSeen } from '@/utils/formatTime';
import { getErrorMessage } from '@/utils/errorMessage';
import { cn } from '@/utils/cn';

/**
 * Side drawer showing a user's profile. `user` should at minimum carry
 * { user_id, username, profile_pic, is_online, last_seen } — that's what
 * both the conversation list and AuthContext already provide, so the
 * drawer renders instantly with no loading flash. It then quietly fetches
 * the fuller public profile (bio, email) in the background and fills
 * those fields in once they arrive.
 */
export function UserProfileDrawer({ open, onClose, user }) {
  const [details, setDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open || !user?.user_id) return;

    let isMounted = true;

    async function run() {
      await Promise.resolve();
      if (!isMounted) return;
      setDetails(null);
      setDetailsError(null);
      setIsLoadingDetails(true);

      try {
        const fullUser = await usersApi.getById(user.user_id);
        if (isMounted) setDetails(fullUser);
      } catch (err) {
        if (isMounted) setDetailsError(getErrorMessage(err, "Couldn't load full profile."));
      } finally {
        if (isMounted) setIsLoadingDetails(false);
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, [open, user?.user_id]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !user) return null;

  const merged = { ...user, ...details };
  const isOnline = Boolean(merged.is_online);
  const statusText = isOnline ? 'Online' : formatLastSeen(merged.last_seen);

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-drawer-title"
        tabIndex={-1}
        className="relative flex h-full w-full max-w-sm flex-col border-l border-border bg-surface shadow-2xl focus:outline-none animate-slide-in-right"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="profile-drawer-title" className="text-sm font-semibold text-foreground">
            Profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <Avatar name={merged.username} src={merged.profile_pic} size="xl" />
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-surface',
                  isOnline ? 'bg-accent' : 'bg-muted-foreground/40'
                )}
                aria-hidden="true"
              />
            </div>
            <p className="mt-4 text-lg font-semibold text-foreground">{merged.username}</p>
            {statusText && (
              <p
                className={cn(
                  'mt-1 flex items-center gap-1.5 text-xs',
                  isOnline ? 'text-accent' : 'text-muted-foreground'
                )}
              >
                <Circle
                  className={cn('h-2 w-2', isOnline ? 'fill-accent text-accent' : 'fill-muted-foreground text-muted-foreground')}
                  aria-hidden="true"
                />
                {statusText}
              </p>
            )}
          </div>

          <div className="mt-8 space-y-4">
            <div className="rounded-xl border border-border bg-surface-elevated/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Bio
              </p>
              {isLoadingDetails ? (
                <div className="mt-2 h-3.5 w-3/4 animate-pulse rounded bg-surface-elevated" />
              ) : (
                <p className="mt-1.5 text-sm text-foreground">
                  {merged.bio || 'No bio yet.'}
                </p>
              )}
            </div>

            {(merged.email || isLoadingDetails) && (
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-elevated/60 p-4">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                {isLoadingDetails ? (
                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-surface-elevated" />
                ) : (
                  <span className="truncate text-sm text-foreground">{merged.email}</span>
                )}
              </div>
            )}

            {detailsError && (
              <p className="text-center text-xs text-muted-foreground">{detailsError}</p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
