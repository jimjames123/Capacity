const TOKEN_KEY = "cs_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// When built for GitHub Pages there is no backend, so requests are served by
// an in-browser localStorage store that mirrors the API.
const STATIC_MODE = import.meta.env.VITE_STATIC === "true";

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (STATIC_MODE) {
    const { handle } = await import("./staticStore");
    const body = options.body ? JSON.parse(options.body as string) : undefined;
    try {
      return (await handle(options.method ?? "GET", path, body)) as T;
    } catch (err) {
      const e = err as { status?: number; error?: string };
      throw new ApiError(e.error ?? "Something went wrong", e.status ?? 500);
    }
  }

  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new ApiError(data.error ?? "Something went wrong", res.status);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
};
