/**
 * Socket.IO client — single shared instance for the whole app.
 *
 * Connection lifecycle is owned by SocketProvider (see
 * context/SocketContext.jsx): it calls `getSocket().connect()` once the
 * user is authenticated and `disconnectSocket()` on logout. Nothing else
 * should call `.connect()` directly — always go through the provider /
 * `useSocket()` so there's exactly one connection per session.
 *
 * Auth: the server's Socket.IO middleware (see backend/sockets/socket.js)
 * verifies a JWT sent in the handshake `auth` payload — the SAME Bearer
 * token used for REST requests (see src/api/axiosInstance.js), not a
 * cookie. `auth` is passed here as a function rather than a plain object
 * so it's re-evaluated on every (re)connection attempt, always reading
 * whatever token is currently in storage rather than a stale one
 * captured at socket-creation time.
 */
import { io } from 'socket.io-client';
import { getToken } from '@/utils/tokenStorage';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false, // caller (SocketProvider) decides when to connect
      auth: (callback) => callback({ token: getToken() }),
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
