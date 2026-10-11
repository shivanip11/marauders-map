import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisPubClient, redisSubClient } from '../config/redis.js';
import { markOnline, registerPresenceHandlers } from './presence.js';
import { registerLocationHandlers } from './location.js';

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN },
  });
  io.adapter(createAdapter(redisPubClient, redisSubClient));
  // authenticate the socket during the handshake, not after
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (!payload.sessionId || (socket.handshake.auth.sessionId && socket.handshake.auth.sessionId !== payload.sessionId)) {
        return next(new Error('Session expired. Please sign in again.'));
      }
      socket.data.userId = payload.userId;
      socket.data.sessionId = payload.sessionId;
      await markOnline(socket);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join('map:viewers');
    socket.join(`user:${socket.data.userId}`);
    registerPresenceHandlers(io, socket);
    registerLocationHandlers(io, socket);
  });

  return io;
}
