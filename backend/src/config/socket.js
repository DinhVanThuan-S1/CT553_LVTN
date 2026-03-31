/**
 * Socket.IO Configuration
 * Real-time messaging giữa sinh viên và nhà tuyển dụng
 */
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./env');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware — verify JWT before socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`🔌 Socket connected: ${userId}`);

    // Join personal room (for private messages & notifications)
    socket.join(`user:${userId}`);

    // Join a conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    // Leave a conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Typing indicator
    socket.on('typing', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('user_typing', {
        userId,
        conversationId,
      });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('user_stop_typing', {
        userId,
        conversationId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${userId}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

module.exports = { initSocket, getIO };
