import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { apiFetch, tokenStore } from "../../lib/api";
import type { User } from "../../lib/types";

interface AuthContextValue {
  user: User | null;
  status: "loading" | "authenticated" | "anonymous";
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    username: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  useEffect(() => {
    const boot = async () => {
      if (!tokenStore.access() && !tokenStore.refresh()) {
        setStatus("anonymous");
        return;
      }
      try {
        const me = await apiFetch<User>("/auth/users/me/");
        setUser(me);
        setStatus("authenticated");
      } catch {
        tokenStore.clear();
        setStatus("anonymous");
      }
    };
    void boot();
  }, []);

  const login: AuthContextValue["login"] = async (email, password) => {
    const tokens = await apiFetch<{ access: string; refresh: string }>(
      "/auth/jwt/create/",
      { method: "POST", body: { email, password }, auth: false },
    );
    tokenStore.set(tokens.access, tokens.refresh);
    const me = await apiFetch<User>("/auth/users/me/");
    setUser(me);
    setStatus("authenticated");
  };

  const register: AuthContextValue["register"] = async (payload) => {
    await apiFetch("/auth/users/", { method: "POST", body: payload, auth: false });
    await login(payload.email, payload.password);
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
    setStatus("anonymous");
  };

  const value = useMemo(
    () => ({ user, status, login, register, logout }),
    [user, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
