import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useQueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";
import { ApiError, apiRequest } from "@/constants/apiRequest";
import { createAuthSession, getTokenExpiry, type AuthSessionState, type SignInMode } from "./authSession";

interface AuthContextType {
  token: string | null;
  loading: boolean;
  login: (token: string, mode?: SignInMode) => Promise<void>;
  unlock: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const tokenKey = "token";
const biometricTokenKey = "biometricToken";
const biometricOptions = {
  requireAuthentication: true,
  authenticationPrompt: "Unlock GeoPunch",
};

async function validateSavedToken(token: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    await apiRequest("/geo_punch/session", { token, signal: controller.signal });
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return false;
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSessionState>({ token: null, loading: true, revision: 0 });
  const [auth] = useState(() => createAuthSession({
    storage: {
      async getToken(biometric) {
        if (Platform.OS === "web") return null;
        return biometric
          ? SecureStore.getItemAsync(biometricTokenKey, biometricOptions)
          : SecureStore.getItemAsync(tokenKey);
      },
      async setToken(token, biometric) {
        if (Platform.OS === "web") return;
        if (biometric) {
          await SecureStore.deleteItemAsync(tokenKey);
          await SecureStore.setItemAsync(biometricTokenKey, token, biometricOptions);
        } else {
          await SecureStore.deleteItemAsync(biometricTokenKey);
          await SecureStore.setItemAsync(tokenKey, token);
        }
      },
      async deleteToken() {
        if (Platform.OS === "web") return;
        const results = await Promise.allSettled([
          SecureStore.deleteItemAsync(tokenKey),
          SecureStore.deleteItemAsync(biometricTokenKey),
        ]);
        for (const result of results) {
          if (result.status === "rejected") throw result.reason;
        }
      },
    },
    onChange: setSession,
    clearCache: () => queryClient.clear(),
    validateSavedToken,
  }));
  const { token, loading, revision } = session;

  // Load token on app start
  useEffect(() => {
    void auth.restore();
  }, [auth]);

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
    <AuthContext.Provider value={{ token, login: auth.login, unlock: auth.unlock, logout, loading }}>
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
