import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: any) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stored = await SecureStore.getItemAsync("token");
      setToken(stored);
      setLoading(false);
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

  return (
    <AuthContext.Provider value={{ token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);