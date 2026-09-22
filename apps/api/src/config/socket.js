// ====================================================================
// Socket.io Server — JWT-authenticated real-time gateway
// ====================================================================

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
];

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ALLOWED_ORIGINS,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // JWT handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.sub;
      socket.userRole = decoded.role;
      socket.userName = decoded.name || 'User';
      next();
    } catch (err) {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.userName} (${socket.userId})`);

    socket.join(`user:${socket.userId}`);

    socket.on('chat:join', (roomId) => {
      if (typeof roomId === 'string' && roomId.length > 0) {
        socket.join(`chat:${roomId}`);
      }
    });

    socket.on('chat:leave', (roomId) => {
      if (typeof roomId === 'string') {
        socket.leave(`chat:${roomId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.userName}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

const emitToUser = (userId, event, data) => {
  if (!io || !userId) return;
  io.to(`user:${userId.toString()}`).emit(event, data);
};

const emitToRoom = (roomId, event, data) => {
  if (!io || !roomId) return;
  const room = roomId.startsWith('room:') || roomId.startsWith('chat:') ? roomId : `chat:${roomId}`;
  io.to(room).to(roomId).emit(event, data);
};

const emitToAll = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToRoom,
  emitToAll,
};
