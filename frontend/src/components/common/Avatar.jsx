import { useState } from 'react';
import { getInitials } from '@/utils/initials';
import { getAvatarColor } from '@/utils/avatarColor';
import { resolveMediaUrl } from '@/utils/resolveUrl';
import { cn } from '@/utils/cn';

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-2xl',
};

/**
 * `src` is a `profile_pic` value straight from the API — a server-relative
 * path like "/uploads/xyz.jpg" — resolved here against the API origin.
 * Falls back to a deterministic initials avatar if there's no picture, or
 * if the image fails to load (e.g. a stale/broken path).
 */
export function Avatar({ name, src, size = 'md', className }) {
  const [failed, setFailed] = useState(false);
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name || 'user');
  const resolvedSrc = resolveMediaUrl(src);

  if (resolvedSrc && !failed) {
    return (
      <img
        src={resolvedSrc}
        alt={name}
        onError={() => setFailed(true)}
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
