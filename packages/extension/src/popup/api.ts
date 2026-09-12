const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

export const popupStorage = {
  async token() {
    const result = await chrome.storage.local.get("questlineToken");
    return result.questlineToken as string | undefined;
  },
  async setToken(token: string) {
    await chrome.storage.local.set({ questlineToken: token });
  },
  async clearToken() {
    await chrome.storage.local.remove("questlineToken");
  },
};

export async function popupApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await popupStorage.token();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body as T;
}
