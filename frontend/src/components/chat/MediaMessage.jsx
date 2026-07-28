import { useState } from 'react';
import { FileAttachmentCard } from '@/components/chat/FileAttachmentCard';
import { ImageViewerModal } from '@/components/chat/ImageViewerModal';
import { resolveMediaUrl } from '@/utils/resolveUrl';
import { cn } from '@/utils/cn';

/**
 * Dispatches on `message.message_type` (set by the backend from the
 * upload's mimetype — see backend/controllers/sendMediaMessage.js's
 * getMessageType). PDFs/Word docs/ZIPs all come back as "DOCUMENT"; the
 * FileAttachmentCard figures out which icon to show from the mimetype.
 */
export function MediaMessage({ message, isOwn }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const url = resolveMediaUrl(message.media_url);
  const name = message.media_name ?? 'Attachment';
  const size = message.media_size;
  const mimeType = message.media_mime_type;

  if (!url) return null;

  switch (message.message_type) {
    case 'IMAGE':
      return (
        <>
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            className="block max-w-[260px] overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`View image ${name}`}
          >
            <img
              src={url}
              alt={name}
              loading="lazy"
              className="max-h-80 w-full rounded-xl object-cover transition-transform duration-200 hover:scale-[1.02]"
            />
          </button>
          <ImageViewerModal
            open={viewerOpen}
            src={url}
            alt={name}
            onClose={() => setViewerOpen(false)}
          />
        </>
      );

    case 'VIDEO':
      return (
        <video
          src={url}
          controls
          preload="metadata"
          className="max-h-80 max-w-[260px] rounded-xl bg-black"
        >
          Your browser doesn&apos;t support embedded video.
        </video>
      );

    case 'AUDIO':
      return (
        <div
          className={cn(
            'flex w-64 flex-col gap-1.5 rounded-xl border p-3',
            isOwn ? 'border-primary-foreground/20 bg-black/10' : 'border-border bg-surface'
          )}
        >
          <p className={cn('truncate text-xs font-medium', isOwn ? 'text-primary-foreground/90' : 'text-foreground')}>
            {name}
          </p>
          {/*
            TODO(priority-8): swap for a lightweight custom waveform
            player (play/pause, seek, duration, speed). Native controls
            keep this shippable now without pulling in an audio lib.
          */}
          <audio src={url} controls preload="metadata" className="h-9 w-full" />
        </div>
      );

    case 'DOCUMENT':
    default:
      return <FileAttachmentCard name={name} size={size} mimeType={mimeType} url={url} />;
  }
}
