import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket(token, sessionId) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token, sessionId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    const heartbeat = setInterval(() => socket.emit('heartbeat'), 10000);

    socketRef.current = socket;
    return () => {
      clearInterval(heartbeat);
      socket.disconnect();
    };
  }, [token, sessionId]);

  return { socket: socketRef.current, connected };
}