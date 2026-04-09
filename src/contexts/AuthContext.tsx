import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../api/api";
import { getSocket } from "../lib/socket";
const socket = getSocket();

socket.on("connect", () => {
  console.log("Connected");
});

interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "faculty" | "student";
  assignedClub?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    studentId: string;
  }) => Promise<any>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // LOAD FROM STORAGE
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (storedUser && token) {
        const parsed = JSON.parse(storedUser);
        if (parsed?._id) {
          setUser(parsed);
        }
      }
    } catch (err) {
      console.error("Auth load error:", err);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  // SOCKET CONNECT
  useEffect(() => {
    if (user && user._id) {
      if (!socket.connected) {
        socket.connect();
      }

      socket.emit("register", {
        userId: user._id,
        role: user.role,
      });
    }

    return () => {
      socket.off("connect");
    };
  }, [user]);

  // LOGIN
  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.post("/auth/login", credentials);

    if (!res?.data?.user || !res?.data?.token) {
      throw new Error("Invalid login response");
    }

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    setUser(res.data.user);
  };

  // SIGNUP
  const signup = async (data: {
    name: string;
    email: string;
    password: string;
    studentId: string;
  }) => {
    const res = await api.post("/auth/register", data);
    return res.data;
  };

  // VERIFY OTP
  const verifyOtp = async (email: string, otp: string) => {
    const res = await api.post("/auth/verify-otp", { email, otp });

    if (!res?.data?.user || !res?.data?.token) {
      throw new Error("OTP failed");
    }

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    setUser(res.data.user);
  };

  // LOGOUT
  const logout = () => {
    socket.disconnect();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, verifyOtp, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};