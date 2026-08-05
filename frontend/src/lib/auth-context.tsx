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
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem("lumina-user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("lumina-token");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("lumina-token");
    if (stored) {
      api
        .get<User>("/auth/me")
        .then((u) => {
          setUser(u);
          setToken(stored);
          localStorage.setItem("lumina-user", JSON.stringify(u));
        })
        .catch((err) => {
          const msg = err instanceof Error ? err.message : "";
          if (/401|403|unauthorized|invalid token|no token|user not found/i.test(msg)) {
            localStorage.removeItem("lumina-token");
            localStorage.removeItem("lumina-user");
            setUser(null);
            setToken(null);
          }
        })
        .finally(() => setLoading(false));
    } else {
      localStorage.removeItem("lumina-user");
      setUser(null);
      setToken(null);
      setLoading(false);
    }
  }, []);

  const setAuth = (u: User, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem("lumina-token", t);
    localStorage.setItem("lumina-user", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("lumina-token");
    localStorage.removeItem("lumina-user");
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
