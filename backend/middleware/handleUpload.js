/**
 * Wraps a multer upload middleware (e.g. uploadMedia.single('media')) so
 * errors thrown during the upload — a rejected file type, a file over
 * the size limit, or a Cloudinary-side failure (bad credentials, quota,
 * network issue) — are turned into a clean JSON error response instead
 * of falling through to Express's default HTML error page.
 *
 * Without this, an error from Cloudinary's SDK (which isn't always a
 * proper Error instance with a .stack) hits Express's default handler,
 * which falls back to `err.toString()` — for a plain object that just
 * prints "[object Object]" in the terminal, with no useful information
 * about what actually went wrong.
 */
function handleUpload(multerMiddleware) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (!err) return next();

      const message =
        err.message || (typeof err === 'string' ? err : 'Upload failed');

      console.error(`Upload error on ${req.method} ${req.originalUrl}:`, message);
      if (err.stack) console.error(err.stack);
      else console.error(err); // logs the object's actual shape instead of just its name

      // MulterError has a `.code` (e.g. LIMIT_FILE_SIZE); anything else
      // (Cloudinary auth/config problems, etc.) falls back to 400 since
      // it's almost always something about the request/setup, not a
      // server crash.
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ success: false, message });
    });
  };
}

module.exports = handleUpload;
