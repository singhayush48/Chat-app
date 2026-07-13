import { getInitials } from '@/utils/initials';
import { getAvatarColor } from '@/utils/avatarColor';
import { cn } from '@/utils/cn';

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

/**
 * `profile_pic` comes from the `users` table when the backend sets it
 * (see USERS.UPDATE_AVATAR in constants/endpoints.js — not implemented
 * server-side yet, so this will render initials for every user today).
 */
export function Avatar({ name, src, size = 'md', className }) {
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name || 'user');

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('shrink-0 rounded-full object-cover', SIZES[size], className)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={name}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-medium text-white',
        SIZES[size],
        className
      )}
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  );
}
