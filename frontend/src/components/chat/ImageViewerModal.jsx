import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, X, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * Fullscreen image viewer opened by clicking an image message.
 * Click-to-toggle zoom (1x / 2x), ESC or backdrop click to close.
 *
 * NOTE: pan-while-zoomed and prev/next navigation between a
 * conversation's images are not implemented yet — this is a single-image
 * viewer. TODO(priority-5): add gallery navigation once media messages
 * carry a way to look up conversation-siblings by type.
 */
export function ImageViewerModal({ open, src, alt, onClose }) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) setZoomed(false);
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      isMounted = false;
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col animate-fade-in bg-black/90 backdrop-blur-sm">
      <div className="flex items-center justify-end gap-1 p-3">
        <button
          type="button"
          onClick={() => setZoomed((prev) => !prev)}
          aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
          className="rounded-md p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          {zoomed ? <ZoomOut className="h-5 w-5" aria-hidden="true" /> : <ZoomIn className="h-5 w-5" aria-hidden="true" />}
        </button>
        <a
          href={src}
          download
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download image"
          className="rounded-md p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Download className="h-5 w-5" aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-md p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div
        className="flex flex-1 items-center justify-center overflow-auto p-4"
        onClick={onClose}
      >
        <img
          src={src}
          alt={alt ?? 'Full-size attachment'}
          onClick={(e) => {
            e.stopPropagation();
            setZoomed((prev) => !prev);
          }}
          className={
            zoomed
              ? 'max-w-none cursor-zoom-out transition-transform duration-200'
              : 'max-h-full max-w-full cursor-zoom-in rounded-md object-contain transition-transform duration-200'
          }
          style={zoomed ? { width: 'auto', height: 'auto', transform: 'scale(1.8)' } : undefined}
        />
      </div>
    </div>,
    document.body
  );
}
