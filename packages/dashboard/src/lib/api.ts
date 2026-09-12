export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";
const TOKEN_KEY = "questlineToken";
export const session = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => {
    document.dispatchEvent(new Event("questline:sign-out"));
    localStorage.removeItem(TOKEN_KEY);
  },
};

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = session.get();
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body as T;
}
