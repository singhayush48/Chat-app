/**
 * config/allowedOrigins.js
 * ------------------------
 * Single source of truth for which origins are allowed to make
 * credentialed (cookie-carrying) requests to this API — used by BOTH
 * the Express `cors` middleware (index.js) and the Socket.IO CORS config
 * (sockets/socket.js).
 *
 * Previously these were configured in two different places and had
 * drifted apart: index.js pointed at the real Vercel frontend, while
 * sockets/socket.js was still hardcoded to `http://localhost:5173`. That
 * meant every Socket.IO connection attempt from the deployed frontend
 * was being rejected at the CORS/handshake level in production.
 *
 * Configure via the FRONTEND_URL env var (comma-separated if you need
 * more than one, e.g. a Vercel preview URL + the production URL):
 *   FRONTEND_URL=https://vaani-chat-app-delta.vercel.app
 * Set this in Render's dashboard -> Environment.
 */
const dotenv = require("dotenv");
dotenv.config();

const DEFAULT_ORIGINS = [
    "https://vaani-chat-app-delta.vercel.app",
    "http://localhost:5173",
];

const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((o) => o.trim()).filter(Boolean)
    : DEFAULT_ORIGINS;

module.exports = allowedOrigins;
