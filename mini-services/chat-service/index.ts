import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

// ==================== Configuration ====================

const JWT_SECRET = 'nexus-platform-secret-key-2024';
const PORT = 3003;

// ==================== Types ====================

interface JwtPayload {
  userId: string;
  email: string;
  username?: string;
}

interface AuthenticatedSocket {
  userId: string;
  username: string;
  email: string;
}

// ==================== Server Setup ====================

const httpServer = createServer();

const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ==================== JWT Verification ====================

function verifyJwtToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ==================== In-memory Online Users ====================

const onlineUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>

function addOnlineUser(userId: string, socketId: string) {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId)!.add(socketId);
}

function removeOnlineUser(userId: string, socketId: string) {
  const sockets = onlineUsers.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      onlineUsers.delete(userId);
    }
  }
}

function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;
}

// ==================== Connection Middleware ====================

io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    return next(new Error('Authentication required: no token provided'));
  }

  const decoded = verifyJwtToken(token);

  if (!decoded) {
    return next(new Error('Authentication failed: invalid or expired token'));
  }

  // Attach user info to socket
  (socket.data as AuthenticatedSocket).userId = decoded.userId;
  (socket.data as AuthenticatedSocket).email = decoded.email;
  (socket.data as AuthenticatedSocket).username = decoded.username || decoded.email.split('@')[0];

  next();
});

// ==================== Connection Handler ====================

io.on('connection', (socket) => {
  const { userId, username, email } = socket.data as AuthenticatedSocket;

  console.log(`[Chat] User connected: ${username} (${userId}) [socket=${socket.id}]`);

  // Join personal room for direct notifications
  socket.join(`user:${userId}`);

  // Track online user
  addOnlineUser(userId, socket.id);

  // Broadcast user online status to all connected clients
  io.emit('user:online', {
    userId,
    username,
    timestamp: new Date().toISOString(),
  });

  // ==================== join:chat ====================

  socket.on('join:chat', (data: { chatId: string }) => {
    const { chatId } = data;

    if (!chatId) {
      socket.emit('error', { message: 'chatId is required' });
      return;
    }

    socket.join(`chat:${chatId}`);
    console.log(`[Chat] ${username} joined chat room: ${chatId}`);

    socket.emit('chat:joined', {
      chatId,
      userId,
      username,
      timestamp: new Date().toISOString(),
    });
  });

  // ==================== send:message ====================

  socket.on('send:message', (data: { chatId: string; content: string; messageType: string; mediaUrl?: string }) => {
    const { chatId, content, messageType, mediaUrl } = data;

    if (!chatId || !content) {
      socket.emit('error', { message: 'chatId and content are required' });
      return;
    }

    const messagePayload = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      chatId,
      senderId: userId,
      senderName: username,
      content,
      messageType: messageType || 'text',
      mediaUrl: mediaUrl || null,
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    // Broadcast to chat room
    io.to(`chat:${chatId}`).emit('receive:message', messagePayload);

    // Also emit to recipient's personal room for real-time notification
    // (We don't know the recipient's userId from the event data,
    //  so we broadcast to the room which already includes both participants)

    console.log(`[Chat] Message from ${username} in ${chatId}: ${content.substring(0, 50)}`);
  });

  // ==================== message:delivered ====================

  socket.on('message:delivered', (data: { messageId: string; chatId: string }) => {
    const { messageId, chatId } = data;

    if (!messageId || !chatId) {
      socket.emit('error', { message: 'messageId and chatId are required' });
      return;
    }

    const deliveredPayload = {
      messageId,
      chatId,
      deliveredBy: userId,
      deliveredAt: new Date().toISOString(),
    };

    // Emit to the sender's personal room
    io.to(`chat:${chatId}`).emit('message:delivered:confirm', deliveredPayload);

    console.log(`[Chat] Message ${messageId} delivered in chat ${chatId} by ${username}`);
  });

  // ==================== message:seen ====================

  socket.on('message:seen', (data: { messageId: string; chatId: string }) => {
    const { messageId, chatId } = data;

    if (!messageId || !chatId) {
      socket.emit('error', { message: 'messageId and chatId are required' });
      return;
    }

    const seenPayload = {
      messageId,
      chatId,
      seenBy: userId,
      seenAt: new Date().toISOString(),
    };

    // Emit to the chat room (sender will see it)
    io.to(`chat:${chatId}`).emit('message:seen:confirm', seenPayload);

    console.log(`[Chat] Message ${messageId} seen in chat ${chatId} by ${username}`);
  });

  // ==================== user:typing ====================

  socket.on('user:typing', (data: { chatId: string; isTyping: boolean }) => {
    const { chatId, isTyping } = data;

    if (!chatId) {
      return;
    }

    const typingPayload = {
      chatId,
      userId,
      username,
      isTyping,
      timestamp: new Date().toISOString(),
    };

    // Emit to chat room (excluding sender)
    socket.to(`chat:${chatId}`).emit('user:typing:status', typingPayload);
  });

  // ==================== nuclear:block ====================

  socket.on('nuclear:block', (data: { chatId: string }) => {
    const { chatId } = data;

    if (!chatId) {
      socket.emit('error', { message: 'chatId is required' });
      return;
    }

    const blockPayload = {
      chatId,
      blockedBy: userId,
      blockedByName: username,
      timestamp: new Date().toISOString(),
    };

    // Emit to chat room
    io.to(`chat:${chatId}`).emit('nuclear:block:notify', blockPayload);

    // Make all participants leave the chat room
    const socketsInRoom = io.sockets.adapter.rooms.get(`chat:${chatId}`);
    if (socketsInRoom) {
      for (const socketId of socketsInRoom) {
        const s = io.sockets.sockets.get(socketId);
        if (s) {
          s.leave(`chat:${chatId}`);
        }
      }
    }

    console.log(`[Chat] Nuclear block by ${username} in chat ${chatId}`);
  });

  // ==================== Disconnect ====================

  socket.on('disconnect', (reason) => {
    console.log(`[Chat] User disconnected: ${username} (${userId}) [socket=${socket.id}] reason=${reason}`);

    // Remove from online tracking
    removeOnlineUser(userId, socket.id);

    // If no more sockets for this user, broadcast offline status
    if (!isUserOnline(userId)) {
      io.emit('user:offline', {
        userId,
        username,
        timestamp: new Date().toISOString(),
      });

      console.log(`[Chat] User fully offline: ${username} (${userId})`);
    }

    // Leave all chat rooms
    const rooms = Array.from(socket.rooms);
    for (const room of rooms) {
      if (room.startsWith('chat:')) {
        // Notify room that user left
        socket.to(room).emit('user:left:chat', {
          chatId: room.replace('chat:', ''),
          userId,
          username,
          timestamp: new Date().toISOString(),
        });
      }
    }
  });

  // ==================== Error Handler ====================

  socket.on('error', (error) => {
    console.error(`[Chat] Socket error (${socket.id}):`, error);
  });
});

// ==================== Start Server ====================

httpServer.listen(PORT, () => {
  console.log(`[Chat] Socket.IO chat service running on port ${PORT}`);
  console.log(`[Chat] JWT authentication enabled`);
  console.log(`[Chat] Path: / (for Caddy gateway forwarding)`);
});

// ==================== Graceful Shutdown ====================

function gracefulShutdown(signal: string) {
  console.log(`[Chat] Received ${signal}, shutting down chat service...`);
  io.disconnectSockets(true);
  httpServer.close(() => {
    console.log('[Chat] Chat service closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
