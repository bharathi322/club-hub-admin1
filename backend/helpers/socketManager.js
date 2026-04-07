/**
 * Socket.IO manager - singleton for emitting events from anywhere.
 */
let io = null;

function setIO(socketIO) {
  io = socketIO;
}

function getIO() {
  return io;
}

function emitToAll(event, data) {
  if (io) io.emit(event, data);
}

function emitToUser(userId, event, data) {
  if (io) io.to(`user:${userId}`).emit(event, data);
}

function emitToRole(role, event, data) {
  if (io) io.to(`role:${role}`).emit(event, data);
}

module.exports = { setIO, getIO, emitToAll, emitToUser, emitToRole };
