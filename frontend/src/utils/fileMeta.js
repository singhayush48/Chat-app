/**
 * Client-side mirror of the backend's allowed-mimetype list
 * (see backend/middleware/chatUpload.js). Kept in sync so we can reject
 * unsupported files before spending an upload round trip on them, and
 * show a friendly error instead of the server's generic 400/500.
 */
export const ALLOWED_MEDIA_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',

  'video/mp4',
  'video/webm',
  'video/quicktime',

  'application/pdf',

  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

  'application/zip',

  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
];

// Matches backend/middleware/chatUpload.js's 50 MB limit.
export const MAX_MEDIA_FILE_SIZE = 50 * 1024 * 1024;

/** Accept attribute for the hidden <input type="file">. */
export const MEDIA_FILE_INPUT_ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  '.pdf',
  '.doc',
  '.docx',
  '.zip',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
].join(',');

/** "2.4 MB" / "310 KB" / "18 B" */
export function formatFileSize(bytes) {
  if (bytes == null || Number.isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[unitIndex]}`;
}

/** "report.final.pdf" -> "PDF" */
export function getFileExtension(name) {
  if (!name) return '';
  const parts = name.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toUpperCase();
}

/**
 * Buckets a file into a broad display "kind" from its mimetype (falling
 * back to extension, since drag-and-drop and some OS file pickers don't
 * always populate `file.type` reliably for e.g. .docx).
 */
export function getFileKind(mimeType, name) {
  const mime = mimeType || '';
  const ext = getFileExtension(name).toLowerCase();

  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (
    mime === 'application/msword' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'doc' ||
    ext === 'docx'
  ) {
    return 'word';
  }
  if (mime === 'application/zip' || ext === 'zip') return 'zip';
  return 'document';
}

/** Human label shown on file cards, e.g. "PDF document", "ZIP archive". */
export function getFileKindLabel(kind) {
  switch (kind) {
    case 'pdf':
      return 'PDF document';
    case 'word':
      return 'Word document';
    case 'zip':
      return 'ZIP archive';
    default:
      return 'Document';
  }
}

/** Validates a picked/dropped file against the backend's constraints. */
export function validateMediaFile(file) {
  if (!file) return { ok: false, reason: 'No file selected.' };
  if (file.size > MAX_MEDIA_FILE_SIZE) {
    return { ok: false, reason: `"${file.name}" is larger than 50MB.` };
  }
  if (file.type && !ALLOWED_MEDIA_MIME_TYPES.includes(file.type)) {
    return { ok: false, reason: `"${file.name}" isn't a supported file type.` };
  }
  return { ok: true, reason: null };
}
