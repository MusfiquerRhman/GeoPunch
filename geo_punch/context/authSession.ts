import { jwtDecode } from "jwt-decode";

export interface AuthSessionState {
  token: string | null;
  loading: boolean;
  revision: number;
}

export type SignInMode = "temporary" | "remembered" | "biometric";

interface SessionOptions {
  storage: {
    getToken: (biometric?: boolean) => Promise<string | null>;
    setToken: (token: string, biometric?: boolean) => Promise<void>;
    deleteToken: () => Promise<void>;
  };
  onChange: (state: AuthSessionState) => void;
  clearCache: () => void;
  validateSavedToken?: (token: string) => Promise<boolean>;
}

export function getTokenExpiry(token: string): number | null {
  try {
    const { exp } = jwtDecode<{ exp?: unknown }>(token);
    return typeof exp === "number" && Number.isFinite(exp) ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function createAuthSession({ storage, onChange, clearCache, validateSavedToken }: SessionOptions) {
  let revision = 0;
  let storageQueue = Promise.resolve();

  // Secure-store changes must finish in order, even during logout/login overlap.
  const withStorage = <T>(operation: () => Promise<T>) => {
    const pending = storageQueue.then(operation);
    storageQueue = pending.then(() => {}, () => {});
    return pending;
  };
  const publish = (token: string | null) => onChange({ token, loading: false, revision });
  const savedTokenIsValid = async (token: string) =>
    (getTokenExpiry(token) ?? 0) > Date.now() && (await validateSavedToken?.(token) ?? true);

  const logout = async (expectedRevision: number) => {
    // A response or timer from an old session cannot clear a newer login.
    if (expectedRevision !== revision) return;
    revision += 1;
    publish(null);
    clearCache();
    try {
      await withStorage(storage.deleteToken);
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
      try {
        if (saved !== null && !await savedTokenIsValid(saved)) {
          await logout(expectedRevision);
          return;
        }
      } catch {
        // A temporary network failure should not delete the saved session.
        if (expectedRevision === revision) publish(null);
        return;
      }
      if (expectedRevision === revision) publish(saved);
    },
    async unlock() {
      const expectedRevision = revision;
      const saved = await withStorage(() => storage.getToken(true));
      if (expectedRevision !== revision || saved === null) return false;
      if (!await savedTokenIsValid(saved)) {
        await logout(expectedRevision);
        return false;
      }
      if (expectedRevision !== revision) return false;
      revision += 1;
      clearCache();
      publish(saved);
      return true;
    },
    async login(token: string, mode: SignInMode = "remembered") {
      if (!token || (getTokenExpiry(token) ?? 0) <= Date.now()) {
        throw new Error("The server did not return a valid sign-in token. Please try again.");
      }

      const expectedRevision = ++revision;
      clearCache();
      try {
        await withStorage(() => mode === "temporary"
          ? storage.deleteToken()
          : storage.setToken(token, mode === "biometric"));
      } catch (error) {
        await logout(expectedRevision);
        throw error;
      }
      if (expectedRevision === revision) publish(token);
    },
  };
}
