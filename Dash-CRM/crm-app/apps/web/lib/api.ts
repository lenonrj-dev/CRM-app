import { clearTokens, getTokens, setTokens, type AuthTokens } from "./auth";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

export type ApiFetchOptions = RequestInit & {
  skipAuth?: boolean;
};

type ApiFetchError = Error & { status?: number; code?: string };

const isDev = process.env.NODE_ENV !== "production";

const buildUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

const createApiError = (status: number, message: string, code?: string) => {
  const error = new Error(message) as ApiFetchError;
  error.status = status;
  if (code) error.code = code;
  return error;
};

const parseError = async (response: Response) => {
  const data = (await response.json().catch(() => ({}))) as { message?: string; code?: string };
  return {
    message: data.message ?? "Falha na requisicao",
    code: data.code,
  };
};

const refreshTokens = async (refreshToken: string): Promise<AuthTokens> => {
  const response = await fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    credentials: "include",
  });

  if (!response.ok) {
    clearTokens();
    throw createApiError(response.status, "Sessao expirada");
  }

  const data = (await response.json()) as AuthTokens;
  setTokens(data);
  return data;
};

export const apiFetch = async <T>(path: string, options: ApiFetchOptions = {}): Promise<T> => {
  const tokens = getTokens();
  const headers = new Headers(options.headers ?? {});
  headers.set("Accept", headers.get("Accept") ?? "application/json");

  if (!options.skipAuth && tokens?.accessToken) {
    headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }

  if (!options.skipAuth && !tokens?.accessToken) {
    throw createApiError(401, "Nao autenticado");
  }

  if (!(options.body instanceof FormData) && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const requestInit: RequestInit = {
    ...options,
    headers,
    credentials: options.credentials ?? "include",
  };

  let response: Response;
  try {
    response = await fetch(buildUrl(path), requestInit);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    if (isDev) {
      // eslint-disable-next-line no-console
      console.warn("[apiFetch] Falha de conexao", { path });
    }
    throw createApiError(0, "API offline / Falha de conexao");
  }

  if (response.status === 401 && tokens?.refreshToken && !options.skipAuth) {
    try {
      const refreshed = await refreshTokens(tokens.refreshToken);
      const retryHeaders = new Headers(headers);
      retryHeaders.set("Authorization", `Bearer ${refreshed.accessToken}`);
      const retryResponse = await fetch(buildUrl(path), {
        ...requestInit,
        headers: retryHeaders,
      });

      if (!retryResponse.ok) {
        const errorData = await parseError(retryResponse);
        if (isDev) {
          // eslint-disable-next-line no-console
          console.warn("[apiFetch] Erro", { path, status: retryResponse.status, message: errorData.message });
        }
        throw createApiError(retryResponse.status, errorData.message, errorData.code);
      }

      return (await retryResponse.json()) as T;
    } catch (error) {
      clearTokens();
      throw error;
    }
  }

  if (!response.ok) {
    const errorData = await parseError(response);
    if (isDev) {
      // eslint-disable-next-line no-console
      console.warn("[apiFetch] Erro", { path, status: response.status, message: errorData.message });
    }
    throw createApiError(response.status, errorData.message, errorData.code);
  }

  return (await response.json()) as T;
};