import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useQueryClient } from "@tanstack/react-query";
import { AppState } from "react-native";
import { createAuthSession, getTokenExpiry, type AuthSessionState } from "./authSession";

interface AuthContextType {
  token: string | null;
  loading: boolean;
  login: (t: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSessionState>({ token: null, loading: true, revision: 0 });
  const [auth] = useState(() => createAuthSession({
    storage: {
      getToken: () => SecureStore.getItemAsync("token"),
      setToken: (token) => SecureStore.setItemAsync("token", token),
      deleteToken: () => SecureStore.deleteItemAsync("token"),
    },
    onChange: setSession,
    clearCache: () => queryClient.clear(),
  }));
  const { token, loading, revision } = session;

  // Load token on app start
  useEffect(() => {
    void auth.restore();
  }, [auth]);

  const login = auth.login;
  const logout = useCallback(() => auth.logout(revision), [auth, revision]);

  // Auto logout on expiry
  useEffect(() => {
    if (!token) return;

    const expiryTime = getTokenExpiry(token) ?? 0;
    const timeout = expiryTime - Date.now();
    if (timeout <= 0) {
      void logout();
      return;
    }

    const timer = setTimeout(() => void logout(), timeout);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && expiryTime <= Date.now()) void logout();
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
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
