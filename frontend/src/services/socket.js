/**
 * Socket.IO client scaffold.
 *
 * Per project spec: keep the structure ready, but do NOT connect or emit
 * anything until explicitly requested. `getSocket()` is intentionally not
 * called anywhere yet.
 */
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false, // caller decides when to connect
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
