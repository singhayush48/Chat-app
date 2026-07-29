const express = require('express');
const app = express();
const port = 3000;
const server = require('http').createServer(app);
const { initSocket } = require('./sockets/socket');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoute');
const messagesRoutes = require('./routes/messageRoute.js');
const userProfileRoutes = require('./routes/userProfileRoutes');
const cors = require('cors');
const allowedOrigins = require('./config/allowedOrigins');

// Render terminates TLS at its edge and forwards to this app over plain
// HTTP internally. Without `trust proxy`, Express has no way to know the
// original request was actually HTTPS. Kept as standard practice for any
// Express app behind a reverse proxy, even though auth no longer depends
// on cookie `secure` flags.
app.set('trust proxy', 1);

app.use(cors({
  origin(origin, callback) {
    // Allow requests without an Origin header (Postman, curl, health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  // No longer strictly required now that auth is a Bearer header instead
  // of a cookie, but left on since it's harmless and some future feature
  // might still want a cookie-based concern (e.g. a refresh token).
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serves uploaded avatar files (see middleware/uploadMiddleware.js) at
// e.g. http://localhost:3000/uploads/7-169...jpg
app.use('/uploads', express.static('uploads'));

app.use('/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', messagesRoutes);
app.use('/api/users', userProfileRoutes);

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Socket.IO is attached to the same HTTP server Express uses, so both
// share one port. See sockets/socket.js for everything event-related
// (auth, presence, conversation rooms, typing indicators, etc).
initSocket(server);

// Last-resort safety net: must be registered after all routes. Without
// this, an error that reaches Express's own default handler gets logged
// as `err.stack || err.toString()` — for a plain (non-Error) object,
// that's just "[object Object]" with no useful information — and the
// response sent back is an HTML error page instead of the JSON the
// frontend expects.
app.use((err, req, res, next) => {
  const message = err?.message || (typeof err === 'string' ? err : 'Internal server error');
  console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, message);
  if (err?.stack) console.error(err.stack);
  else console.error(err);

  res.status(err?.status || 500).json({ success: false, message });
});


server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
