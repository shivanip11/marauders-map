import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { registerPresenceHandlers } from './presence.js';
import { registerLocationHandlers } from './location.js';

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN },
  });

  // authenticate the socket during the handshake, not after
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    registerPresenceHandlers(io, socket);
    registerLocationHandlers(io, socket);
  });

  return io;
}