const keys = { token: "gitventureToken", collapsed: "gitventureCollapsed" } as const;

export const storage = {
  async token() { return (await chrome.storage.local.get(keys.token))[keys.token] as string | undefined; },
  async setToken(token: string) { await chrome.storage.local.set({ [keys.token]: token }); },
  async clearToken() { await chrome.storage.local.remove(keys.token); },
  async collapsed() { return Boolean((await chrome.storage.local.get(keys.collapsed))[keys.collapsed]); },
  async setCollapsed(value: boolean) { await chrome.storage.local.set({ [keys.collapsed]: value }); },
};
