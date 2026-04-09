import { getIo } from "./socket.js";

const userSocketMap = new Map();

export function registerSocketUser(userId, socketId) {
  userSocketMap.set(userId, socketId);
}

export function unregisterSocket(socketId) {
  for (const [userId, id] of userSocketMap.entries()) {
    if (id === socketId) {
      userSocketMap.delete(userId);
      break;
    }
  }
}

export function emitToUser(userId, event, data) {
  const io = getIo();
  const socketId = userSocketMap.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
}

export function emitToRole(role, event, data) {
  const io = getIo();
  io.to(role).emit(event, data);
}