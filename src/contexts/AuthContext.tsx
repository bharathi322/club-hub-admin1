import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/api/api";
import { socket } from "@/lib/socket";
import { checkTokenExpiry } from "@/utils/auth";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "faculty" | "student";
  assignedClub?: string | null;
  profileImage?: string; // ✅ added
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
  setUser: (user: User | null) => void;   // ✅ ADD THIS
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null); // ✅ FIXED
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      const valid = checkTokenExpiry();

      if (storedUser && token && valid) {
        const parsed = JSON.parse(storedUser);
        if (parsed?._id) {
          setUser(parsed);
        }
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } catch (err) {
      console.error("Auth error:", err);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const valid = checkTokenExpiry();

      if (!valid) {
        socket.disconnect();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user && user._id) {
      if (!socket.connected) socket.connect();

      socket.emit("register", {
        userId: user._id,
        role: user.role,
      });
    }

    return () => {
      socket.off("connect");
    };
  }, [user]);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.post("/auth/login", credentials);

    if (!res?.data?.user || !res?.data?.token) {
      throw new Error("Invalid response from server");
    }

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    setUser(res.data.user);
  };

  const signup = async (data: any) => {
    const res = await api.post("/auth/signup", data);
    localStorage.setItem("token", res.data.token);
    return res.data;
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await api.post("/auth/verify-otp", { email, otp });

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    setUser(res.data.user);
  };

  const logout = () => {
    socket.disconnect();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, signup, verifyOtp, logout }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};