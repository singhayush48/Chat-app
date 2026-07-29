/**
 * config/allowedOrigins.js
 * ------------------------
 * Single source of truth for which origins are allowed to make
 * requests to this API — used by BOTH the Express `cors` middleware
 * (index.js) and the Socket.IO CORS config (sockets/socket.js), so they
 * can never drift out of sync with each other.
 *
 * Configure extra static origins via the FRONTEND_URL env var
 * (comma-separated), set in Render's dashboard -> Environment:
 *   FRONTEND_URL=https://vaani-chat-app-delta.vercel.app
 *
 * PREVIEW DEPLOYMENTS: Vercel gives every preview deployment (i.e. every
 * push that isn't to the production branch) its own unique, one-off
 * subdomain, e.g.:
 *   https://vaani-chat-8es6sobr4-ayush-singhs-projects-ecd0cbb1.vercel.app
 * There's a new one on every push, so listing them individually is
 * impossible. VERCEL_PREVIEW_PATTERN instead matches any preview URL
 * that belongs to THIS project + team (same "vaani-chat-...-ayush-singhs-
 * projects-ecd0cbb1.vercel.app" shape), so preview links work for
 * testing without opening CORS up to unrelated sites. If your Vercel
 * team slug ever changes, update the regex below to match.
 */
const dotenv = require("dotenv");
dotenv.config();

const STATIC_ORIGINS = [
    "https://vaani-chat-app-delta.vercel.app", // production
    "http://localhost:5173", // local dev
];

const extraOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((o) => o.trim()).filter(Boolean)
    : [];

const allowedOrigins = [...new Set([...STATIC_ORIGINS, ...extraOrigins])];

const VERCEL_PREVIEW_PATTERN =
    /^https:\/\/vaani-chat-[a-z0-9]+-ayush-singhs-projects-ecd0cbb1\.vercel\.app$/;

/**
 * Checks whether a given `Origin` header value is allowed. Used by both
 * the Express CORS middleware and Socket.IO's CORS config.
 * `origin` is undefined/null for non-browser requests (curl, Postman,
 * Render health checks) — those are always allowed since there's no
 * browser same-origin policy to enforce for them.
 */
function isOriginAllowed(origin) {
    if (!origin) return true;
    if (allowedOrigins.includes(origin)) return true;
    return VERCEL_PREVIEW_PATTERN.test(origin);
}

module.exports = { allowedOrigins, isOriginAllowed };
