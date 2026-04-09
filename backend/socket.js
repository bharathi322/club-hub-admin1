import { Server } from "socket.io";

let io;
const users = new Map(); // userId -> socketId

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("disconnect", () => {
      unregisterSocket(socket.id);
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
}

export function getIo() {
  if (!io) {
    throw new Error("Socket not initialized");
  }
  return io;
}

// Register user
export function registerSocketUser(userId, socketId) {
  users.set(userId, socketId);
}

// Remove socket
export function unregisterSocket(socketId) {
  for (const [userId, id] of users.entries()) {
    if (id === socketId) {
      users.delete(userId);
      break;
    }
  }
}

// Emit to specific user
export function emitToUser(userId, event, data) {
  const socketId = users.get(userId);
  if (socketId && io) {
    io.to(socketId).emit(event, data);
  }
}

// Emit to role (room)
export function emitToRole(role, event, data) {
  if (io) {
    io.to(role).emit(event, data);
  }
}