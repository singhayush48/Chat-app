const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * `profile_pic` comes back from the backend as a server-relative path
 * (e.g. "/uploads/7-1720999999999.jpg") since avatars are served as
 * static files from the API server, not the Vite dev server. Used
 * directly as an <img src>, it would resolve against the frontend's own
 * origin and 404. This resolves it against the API origin instead.
 * Already-absolute URLs (e.g. a future S3/Cloudinary URL) pass through
 * unchanged.
 */
export function resolveMediaUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
