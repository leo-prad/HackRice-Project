import { storage } from "./storage";

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await storage.token();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body as T;
}
