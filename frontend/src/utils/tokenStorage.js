/**
 * Auth is now Bearer-token based instead of cookie based (see
 * backend/controllers/authController.js for why: Safari and mobile
 * Chrome block third-party cookies outright, which broke session
 * persistence on every mobile browser regardless of cookie attributes).
 *
 * The token lives in localStorage so it survives page reloads and
 * browser restarts, and is read by:
 *   - src/api/axiosInstance.js (attaches it as an Authorization header)
 *   - src/services/socket.js (sends it in the Socket.IO handshake `auth`)
 *
 * Trade-off: unlike an httpOnly cookie, this token is readable by any JS
 * running on the page, so it's a bit more exposed if the app ever has an
 * XSS vulnerability. This is the standard, expected trade-off for an SPA
 * and API that live on two different domains.
 */
const TOKEN_KEY = 'vaani_auth_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    // Safari private browsing (and similar) can throw on localStorage
    // access rather than just no-op — treat that the same as "no token".
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Best-effort — if storage isn't available, the user just won't stay
    // logged in across a reload, but the app itself keeps working.
  }
}

export function clearToken() {
  setToken(null);
}
