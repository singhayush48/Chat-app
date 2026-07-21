import { cn } from '@/utils/cn';

const SIZES = {
  sm: { mark: 'h-8 w-auto', name: 'text-sm font-semibold', tagline: 'text-[11px]' },
  md: { mark: 'h-11 w-auto', name: 'text-lg font-semibold', tagline: 'text-xs' },
  lg: { mark: 'h-20 w-auto', name: 'text-2xl font-bold', tagline: 'text-sm' },
};

export const APP_NAME = 'Vaani';
export const APP_TAGLINE = 'Chat. Connect. Simplify.';

/**
 * `layout="row"` (default) puts the mark beside the name — good for
 * navbars. `layout="stack"` centers the mark above the name — good for
 * auth pages.
 *
 * The mark itself is the supplied brand artwork (public/vaani-mark.png —
 * background chroma-keyed transparent, tightly cropped), not hand-coded
 * SVG, so it always matches the provided design exactly. The wordmark and
 * tagline stay as real text (not baked into the image) so they stay crisp
 * at every size and restyle with the theme.
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
      <img src="/vaani-mark.png" alt="" className={cn('shrink-0 object-contain', s.mark)} />
      <div className={cn('min-w-0', layout === 'stack' && 'mt-1')}>
        <p className={cn(s.name, 'leading-none text-foreground')}>{APP_NAME}</p>
        {tagline && (
          <p
            className={cn(
              s.tagline,
              'mt-1 bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text font-medium text-transparent'
            )}
          >
            {APP_TAGLINE}
          </p>
        )}
      </div>
    </div>
  );
}
