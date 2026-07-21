import { useContext } from 'react';
import { SocketContext } from '@/context/socket-context';

/** Returns the shared, already-connected Socket.IO client instance. */
export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context.socket;
}
