import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { LoginInput, PublicUser } from "../../shared/auth";
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
} from "../lib/api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

interface AuthContextValue {
  status: AuthStatus;
  user: PublicUser | null;
  login: (input: LoginInput) => Promise<PublicUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<PublicUser | null>(null);

  const loadSession = useCallback(async (signal?: AbortSignal) => {
    setStatus("loading");
    try {
      const currentUser = await getCurrentUser(signal);
      setUser(currentUser);
      setStatus(currentUser ? "authenticated" : "unauthenticated");
    } catch (error) {
      if (signal?.aborted) return;
      setUser(null);
      setStatus("error");
      throw error;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadSession(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [loadSession]);

  const login = useCallback(async (input: LoginInput) => {
    const authenticatedUser = await loginRequest(input);
    setUser(authenticatedUser);
    setStatus("authenticated");
    return authenticatedUser;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const refresh = useCallback(() => loadSession(), [loadSession]);
  const value = useMemo(
    () => ({ status, user, login, logout, refresh }),
    [status, user, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus digunakan di dalam AuthProvider.");
  return context;
}
