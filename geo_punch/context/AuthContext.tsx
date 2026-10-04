import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import { useQueryClient } from "@tanstack/react-query";

interface JwtPayload {
  exp?: number;
}

interface AuthContextType {
  token: string | null;
  loading: boolean;
  login: (t: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token on app start
  useEffect(() => {
    const load = async () => {
      try {
        setToken(await SecureStore.getItemAsync("token"));
      } catch {
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const login = useCallback(async (t: string) => {
    if (!t) throw new Error("The server did not return a sign-in token.");
    await queryClient.clear();
    await SecureStore.setItemAsync("token", t);
    setToken(t);
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync("token");
    } catch {
      // Clear the in-memory session even if the platform secure store is unavailable.
    } finally {
      setToken(null);
      await queryClient.clear();
    }
  }, [queryClient]);

  // Auto logout on expiry
  useEffect(() => {
    if (!token) return;

    let timer: ReturnType<typeof setTimeout>;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (!Number.isFinite(decoded.exp)) {
        void logout();
        return;
      }

      const expiryTime = decoded.exp! * 1000;
      const timeout = expiryTime - Date.now();

      if (timeout <= 0) {
        void logout();
        return;
      }

      timer = setTimeout(() => {
        void logout();
      }, timeout);
    } catch {
      void logout();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [logout, token]);

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
