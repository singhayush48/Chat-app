import { AlertCircle, FileArchive, FileText, File as FileIcon, Music, RotateCcw, X } from 'lucide-react';
import { formatFileSize, getFileExtension, getFileKind } from '@/utils/fileMeta';
import { cn } from '@/utils/cn';

const KIND_ICONS = {
  pdf: FileText,
  word: FileText,
  zip: FileArchive,
  audio: Music,
  document: FileIcon,
};

function AttachmentCard({ item, onRemove, onCancel, onRetry }) {
  const { file, previewUrl, isUploading, progress, error } = item;
  const kind = getFileKind(file.type, file.name);
  const Icon = KIND_ICONS[kind] ?? FileIcon;

  return (
    <div className="relative inline-flex w-40 shrink-0 flex-col gap-1.5 rounded-xl border border-border bg-surface p-2 animate-scale-in">
      <div className="relative h-24 w-full overflow-hidden rounded-lg bg-surface-elevated">
        {kind === 'image' && previewUrl ? (
          <img src={previewUrl} alt={file.name} className="h-full w-full object-cover" />
        ) : kind === 'video' && previewUrl ? (
          <video src={previewUrl} className="h-full w-full object-cover" muted />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Icon className="h-7 w-7" aria-hidden="true" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/85 p-1 text-center">
            <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-1 rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-medium text-foreground hover:bg-surface-elevated"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Retry
            </button>
          </div>
        )}

        {isUploading && !error && (
          <div className="absolute inset-x-0 bottom-0 bg-black/50 px-1.5 py-1">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="mt-0.5 block text-[9px] tabular-nums text-white/90">{progress}%</span>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-foreground">{file.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {getFileExtension(file.name)} · {formatFileSize(file.size)}
        </p>
      </div>

      <button
        type="button"
        onClick={isUploading ? onCancel : onRemove}
        aria-label={isUploading ? 'Cancel upload' : 'Remove attachment'}
        className={cn(
          'absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full',
          'bg-surface-elevated text-muted-foreground shadow-sm ring-1 ring-border transition-colors',
          'hover:bg-destructive hover:text-white hover:ring-destructive'
        )}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Horizontally-scrollable strip of pending attachments shown above the
 * input row once one or more files have been picked or dropped, before
 * they're sent. `onRetry` re-fires the whole batch (see MessageInput —
 * sendAll skips any item that isn't in an error state, so a retry only
 * re-uploads the ones that failed).
 */
export function AttachmentPreview({ items, onRemove, onCancel, onRetry }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="border-t border-border bg-surface/60 p-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => (
          <AttachmentCard
            key={item.id}
            item={item}
            onRemove={() => onRemove(item.id)}
            onCancel={() => onCancel(item.id)}
            onRetry={onRetry}
          />
        ))}
      </div>
    </div>
  );
}
