import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import type { User, LoginCredentials, SignupCredentials, AuthResponse } from "@/types/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      // Connect socket on restore
      connectSocket(parsed._id, parsed.role);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const { data } = await api.post<AuthResponse>("/auth/login", credentials);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    connectSocket(data.user._id, data.user.role);
  };

  const signup = async (credentials: SignupCredentials) => {
    const { data } = await api.post<AuthResponse>("/auth/signup", credentials);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    connectSocket(data.user._id, data.user.role);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, signup, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
