import { jwtDecode } from "jwt-decode";

export interface AuthSessionState {
  token: string | null;
  loading: boolean;
  revision: number;
}

interface SessionOptions {
  storage: {
    getToken: () => Promise<string | null>;
    setToken: (token: string) => Promise<void>;
    deleteToken: () => Promise<void>;
  };
  onChange: (state: AuthSessionState) => void;
  clearCache: () => void;
}

export function getTokenExpiry(token: string): number | null {
  try {
    const { exp } = jwtDecode<{ exp?: unknown }>(token);
    return typeof exp === "number" && Number.isFinite(exp) ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function createAuthSession({ storage, onChange, clearCache }: SessionOptions) {
  let revision = 0;
  let storageQueue = Promise.resolve();

  // Secure-store writes must finish in order, even during logout/login overlap.
  const persist = (operation: () => Promise<void>) => {
    const pending = storageQueue.catch(() => {}).then(operation);
    storageQueue = pending;
    return pending;
  };
  const publish = (token: string | null) => onChange({ token, loading: false, revision });

  const logout = async (expectedRevision: number) => {
    // A response or timer from an old session cannot clear a newer login.
    if (expectedRevision !== revision) return;
    revision += 1;
    publish(null);
    clearCache();
    try {
      await persist(storage.deleteToken);
    } catch {
      // The in-memory session is still cleared if secure storage is unavailable.
    }
  };

  return {
    logout,
    async restore() {
      const expectedRevision = revision;
      const saved = await storage.getToken().catch(() => null);
      if (expectedRevision !== revision) return;
      if (saved !== null && (getTokenExpiry(saved) ?? 0) <= Date.now()) {
        await logout(expectedRevision);
        return;
      }
      publish(saved);
    },
    async login(token: string) {
      if (!token || (getTokenExpiry(token) ?? 0) <= Date.now()) {
        throw new Error("The server did not return a valid sign-in token. Please try again.");
      }

      const expectedRevision = ++revision;
      clearCache();
      try {
        await persist(() => storage.setToken(token));
      } catch (error) {
        await logout(expectedRevision);
        throw error;
      }
      if (expectedRevision === revision) publish(token);
    },
  };
}
