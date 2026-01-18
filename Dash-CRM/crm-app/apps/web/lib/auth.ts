export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const LEGACY_TOKEN_KEY = "ateliux.tokens";
const TOKEN_KEY = "ateliux.tokens.v2";

const isTokenExpired = (token: string) => {
  const parts = token.split(".");
  if (parts.length < 2) return false;
  try {
    const payload = JSON.parse(atob(parts[1])) as { exp?: number };
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return false;
  }
};

export const getTokens = (): AuthTokens | null => {
  if (typeof window === "undefined") return null;
  if (window.localStorage.getItem(LEGACY_TOKEN_KEY)) {
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  }
  const raw = window.localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthTokens;
    if (isTokenExpired(parsed.accessToken)) {
      window.localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const setTokens = (tokens: AuthTokens) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
};

export const clearTokens = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
};