import { Download, Eye, FileArchive, FileSpreadsheet, FileText, File as FileIcon } from 'lucide-react';
import { formatFileSize, getFileExtension, getFileKind, getFileKindLabel } from '@/utils/fileMeta';
import { cn } from '@/utils/cn';

const KIND_STYLES = {
  pdf: { Icon: FileText, className: 'bg-red-500/15 text-red-400' },
  word: { Icon: FileText, className: 'bg-blue-500/15 text-blue-400' },
  zip: { Icon: FileArchive, className: 'bg-amber-500/15 text-amber-400' },
  document: { Icon: FileIcon, className: 'bg-muted-foreground/15 text-muted-foreground' },
};

/**
 * Modern "file card" for documents/zips/etc — used both in the pre-send
 * attachment preview and inside a sent message bubble. `onDownload` is
 * only relevant for the sent-message case (pre-send previews don't need
 * it, there's nothing hosted yet).
 */
export function FileAttachmentCard({ name, size, mimeType, url, className }) {
  const kind = getFileKind(mimeType, name);
  const { Icon, className: iconClassName } = KIND_STYLES[kind] ?? KIND_STYLES.document;
  const extension = getFileExtension(name);
  // Browsers can render PDFs inline, so clicking one should open/view it
  // in a new tab. Word docs/zips/etc aren't viewable in-browser, so those
  // still trigger a download.
  const isViewable = kind === 'pdf';

  const content = (
    <div
      className={cn(
        'group/file flex w-64 items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-primary/40 hover:bg-surface-elevated',
        className
      )}
    >
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', iconClassName)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">
          {extension && <span>{extension}</span>}
          {extension && size != null && <span> · </span>}
          {size != null && <span>{formatFileSize(size)}</span>}
          {!extension && size == null && <span>{getFileKindLabel(kind)}</span>}
        </p>
      </div>
      {url && (
        isViewable ? (
          <Eye
            className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover/file:text-primary"
            aria-hidden="true"
          />
        ) : (
          <Download
            className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover/file:text-primary"
            aria-hidden="true"
          />
        )
      )}
    </div>
  );

  if (!url) return content;

  return (
    <a
      href={url}
      download={isViewable ? undefined : name}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={isViewable ? `View ${name}` : `Download ${name}`}
      className="block"
    >
      {content}
    </a>
  );
}

// Re-exported so other components (e.g. audio player, spreadsheet icon
// callers) can reuse the same kind → icon mapping without duplicating it.
export { FileSpreadsheet };
