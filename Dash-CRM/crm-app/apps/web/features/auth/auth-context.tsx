"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { UserDTO } from "@ateliux/shared";
import { apiFetch } from "../../lib/api";
import { clearTokens, getTokens, setTokens } from "../../lib/auth";

type AuthContextValue = {
  user: UserDTO | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  login: (
    email: string,
    password: string,
    twoFactorCode?: string,
  ) => Promise<{ requiresTwoFactor?: boolean; requiresTwoFactorSetup?: boolean }>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    orgName: string;
  }) => Promise<{ requiresTwoFactorSetup?: boolean }>;
  acceptInvite: (payload: { token: string; name: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const tokens = getTokens();
    if (!tokens) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch<{ user: UserDTO }>("/auth/me");
      setUser(data.user);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string, twoFactorCode?: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, twoFactorCode }),
      },
    );

    if (response.status === 403) {
      const data = (await response.json().catch(() => ({}))) as { requiresTwoFactor?: boolean };
      return { requiresTwoFactor: data.requiresTwoFactor ?? true };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message ?? "Falha ao entrar");
    }

    const data = (await response.json()) as {
      user: UserDTO;
      accessToken: string;
      refreshToken: string;
      requiresTwoFactorSetup?: boolean;
    };
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setUser(data.user);
    return { requiresTwoFactorSetup: data.requiresTwoFactorSetup };
  }, []);

  const register = useCallback(async (payload: { name: string; email: string; password: string; orgName: string }) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message ?? "Falha ao criar a conta");
    }

    const data = (await response.json()) as {
      user: UserDTO;
      accessToken: string;
      refreshToken: string;
      requiresTwoFactorSetup?: boolean;
    };
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setUser(data.user);
    return { requiresTwoFactorSetup: data.requiresTwoFactorSetup };
  }, []);

  const acceptInvite = useCallback(async (payload: { token: string; name: string; password: string }) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/invites/accept`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message ?? "Falha ao aceitar convite");
    }

    const data = (await response.json()) as { user: UserDTO; accessToken: string; refreshToken: string };
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setUser(data.user);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: UserDTO }>("/auth/me");
      setUser(data.user);
    } catch {
      clearTokens();
      setUser(null);
    }
  }, []);

  const logout = useCallback(async () => {
    const tokens = getTokens();
    try {
      if (tokens?.refreshToken) {
        await apiFetch("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
      }
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, refreshUser, login, register, acceptInvite, logout }),
    [user, loading, refreshUser, login, register, acceptInvite, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
};
