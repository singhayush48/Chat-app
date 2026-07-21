/**
 * Socket.IO client — single shared instance for the whole app.
 *
 * Connection lifecycle is owned by SocketProvider (see
 * context/SocketContext.jsx): it calls `getSocket().connect()` once the
 * user is authenticated and `disconnectSocket()` on logout. Nothing else
 * should call `.connect()` directly — always go through the provider /
 * `useSocket()` so there's exactly one connection per session.
 *
 * Auth: the server's Socket.IO middleware reads the same httpOnly "token"
 * cookie as REST requests (see backend/sockets/socket.js), so
 * `withCredentials: true` here is what makes that cookie ride along on
 * the handshake — no manual token wiring needed.
 */
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false, // caller (SocketProvider) decides when to connect
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
