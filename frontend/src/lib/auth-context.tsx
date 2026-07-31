import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api } from "./api";

interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("lumina-token");
    if (stored) {
      api
        .get<User>("/auth/me")
        .then((u) => {
          setUser(u);
          setToken(stored);
        })
        .catch(() => localStorage.removeItem("lumina-token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const setAuth = (u: User, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem("lumina-token", t);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("lumina-token");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
