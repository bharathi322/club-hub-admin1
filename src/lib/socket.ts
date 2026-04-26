import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:5000";

// rename to avoid conflict
let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socketInstance;
}

export function connectSocket(userId: string, role: string) {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
s.emit("register", { userId, role });
  }
  return s;
}

export function disconnectSocket() {
  if (socketInstance?.connected) {
    socketInstance.disconnect();
  }
}

// ✅ THIS LINE IS REQUIRED
export const socket = getSocket();