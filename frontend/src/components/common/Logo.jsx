import { cn } from '@/utils/cn';

/**
 * App brand mark: a two-tone speech-loop glyph in a gradient badge.
 * Kept as inline SVG (no image asset) so it never has a broken-image
 * flash and recolors instantly with the theme tokens.
 */
function LogoMark({ className }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="loop-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#loop-gradient)" />
      <path
        d="M9 13.5c0-2.485 2.686-4.5 6-4.5s6 2.015 6 4.5c0 2.485-2.686 4.5-6 4.5a7.2 7.2 0 0 1-1.8-.223L9.8 19.2l.55-2.53A4.02 4.02 0 0 1 9 13.5Z"
        fill="white"
        fillOpacity="0.95"
      />
      <circle cx="12.4" cy="13.5" r="1" fill="#6366f1" />
      <circle cx="15" cy="13.5" r="1" fill="#6366f1" />
      <circle cx="17.6" cy="13.5" r="1" fill="#6366f1" />
    </svg>
  );
}

const SIZES = {
  sm: { mark: 'h-8 w-8 rounded-lg', name: 'text-sm font-semibold', tagline: 'text-[11px]' },
  md: { mark: 'h-11 w-11 rounded-xl', name: 'text-lg font-semibold', tagline: 'text-xs' },
  lg: { mark: 'h-14 w-14 rounded-2xl', name: 'text-2xl font-bold', tagline: 'text-sm' },
};

export const APP_NAME = 'Loop';
export const APP_TAGLINE = 'Stay in the loop.';

/**
 * `layout="row"` (default) puts the mark beside the name — good for
 * navbars. `layout="stack"` centers the mark above the name — good for
 * auth pages.
 */
export function Logo({ size = 'md', layout = 'row', tagline = false, className }) {
  const s = SIZES[size];

  return (
    <div
      className={cn(
        'flex items-center gap-2.5',
        layout === 'stack' && 'flex-col text-center',
        className
      )}
    >
      <LogoMark className={cn('shrink-0', s.mark)} />
      <div className={cn('min-w-0', layout === 'stack' && 'mt-1')}>
        <p className={cn(s.name, 'leading-none text-foreground')}>{APP_NAME}</p>
        {tagline && (
          <p className={cn(s.tagline, 'mt-1 text-muted-foreground')}>{APP_TAGLINE}</p>
        )}
      </div>
    </div>
  );
}
