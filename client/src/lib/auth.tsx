import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getToken, setToken } from "./api";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  loading: boolean;
  signin: (email: string, password: string) => Promise<User>;
  signup: (input: {
    name: string;
    email: string;
    password: string;
    profession?: string;
  }) => Promise<User>;
  updateProfile: (patch: Partial<User>) => Promise<User>;
  signout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

interface AuthResponse {
  token: string;
  user: User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<{ user: User }>("/auth/me")
      .then((r) => setUser(r.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const signin = useCallback(async (email: string, password: string) => {
    const r = await api.post<AuthResponse>("/auth/signin", { email, password });
    setToken(r.token);
    setUser(r.user);
    return r.user;
  }, []);

  const signup = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      profession?: string;
    }) => {
      const r = await api.post<AuthResponse>("/auth/signup", input);
      setToken(r.token);
      setUser(r.user);
      return r.user;
    },
    [],
  );

  const updateProfile = useCallback(async (patch: Partial<User>) => {
    const r = await api.patch<{ user: User }>("/auth/me", patch);
    setUser(r.user);
    return r.user;
  }, []);

  const signout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signin, signup, updateProfile, signout }),
    [user, loading, signin, signup, updateProfile, signout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
