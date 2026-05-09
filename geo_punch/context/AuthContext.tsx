import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  exp: number;
}

interface AuthContextType {
  token: string | null;
  loading: boolean;
  login: (t: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token on app start
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await SecureStore.getItemAsync("token");
        setToken(stored);
      } catch (err) {
        console.log("Failed to load token", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const login = async (t: string) => {
    await SecureStore.setItemAsync("token", t);
    setToken(t);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("token");
    setToken(null);
  };

  // Auto logout on expiry
  useEffect(() => {
    if (!token) return;

    let timer: ReturnType<typeof setTimeout>;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const expiryTime = decoded.exp * 1000;
      const timeout = expiryTime - Date.now();

      if (timeout <= 0) {
        logout();
        return;
      }

      timer = setTimeout(() => {
        logout();
      }, timeout);
    } catch (err) {
      console.log("Invalid token, logging out");
      logout();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook with safety
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};