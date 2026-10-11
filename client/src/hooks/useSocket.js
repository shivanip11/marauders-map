import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket(token, sessionId) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const connection = io(import.meta.env.VITE_API_URL || window.location.origin, {
      auth: { token, sessionId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    setSocket(connection);
    connection.on('connect', () => {
      setConnected(true);
      setError('');
    });
    connection.on('disconnect', () => setConnected(false));
    connection.on('connect_error', (err) => {
      setConnected(false);
      setError(err.message === 'Unauthorized' ? 'Please refresh and sign in again.' : err.message);
    });
    const heartbeat = setInterval(() => {
      if (connection.connected) connection.emit('heartbeat');
    }, 10000);
    return () => {
      clearInterval(heartbeat);
      connection.disconnect();
      setConnected(false);
    };
  }, [token, sessionId]);

  return { socket, connected, error };
}
