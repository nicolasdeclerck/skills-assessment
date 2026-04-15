/**
 * Lightweight typed fetch wrapper. Handles JWT refresh transparently.
 */

const ACCESS_KEY = "sp_access";
const REFRESH_KEY = "sp_refresh";

export const tokenStore = {
  access(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  refresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  setAccess(access: string) {
    localStorage.setItem(ACCESS_KEY, access);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export { ApiError };

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.refresh();
  if (!refresh) return null;
  const resp = await fetch(`${API_BASE}/auth/jwt/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!resp.ok) {
    tokenStore.clear();
    return null;
  }
  const data = (await resp.json()) as { access: string };
  tokenStore.setAccess(data.access);
  return data.access;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const buildHeaders = (token: string | null): HeadersInit => {
    const h: Record<string, string> = {};
    if (body !== undefined) h["Content-Type"] = "application/json";
    if (auth && token) h["Authorization"] = `Bearer ${token}`;
    return h;
  };

  const doRequest = async (token: string | null) =>
    fetch(`${API_BASE}${path}`, {
      method,
      headers: buildHeaders(token),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let token = auth ? tokenStore.access() : null;
  let resp = await doRequest(token);

  if (resp.status === 401 && auth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      resp = await doRequest(newToken);
    }
  }

  if (resp.status === 204) {
    return undefined as T;
  }

  const contentType = resp.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await resp.json() : await resp.text();

  if (!resp.ok) {
    throw new ApiError(
      typeof payload === "string" ? payload : JSON.stringify(payload),
      resp.status,
      payload,
    );
  }

  return payload as T;
}
