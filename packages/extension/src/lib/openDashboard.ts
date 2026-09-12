import { DASHBOARD_URL, dashboardPath } from "./config";
import type { DashboardRoute } from "./routes";

const OPEN_TYPE = "gitventure:open-dashboard";

/** Open (or focus) a dashboard route. Popup + content scripts share this. */
export function openDashboard(path: DashboardRoute | string = "/auth/continue") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const fallback = () => window.open(dashboardPath(normalized), "_blank", "noopener");
  try {
    const pending = chrome.runtime.sendMessage({ type: OPEN_TYPE, path: normalized });
    if (pending && typeof (pending as Promise<unknown>).then === "function") {
      void (pending as Promise<unknown>).catch(() => fallback());
      return;
    }
  } catch {
    /* fall through */
  }
  fallback();
}

export function isOpenDashboardMessage(
  message: unknown,
): message is { type: typeof OPEN_TYPE; path: string } {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as { type?: string }).type === OPEN_TYPE &&
    typeof (message as { path?: unknown }).path === "string"
  );
}

/** Origins that count as “the dashboard” (localhost ↔ 127.0.0.1). */
export function dashboardOrigins(base = DASHBOARD_URL): string[] {
  try {
    const url = new URL(base);
    const hosts = new Set([url.host]);
    if (url.hostname === "localhost") hosts.add(`127.0.0.1${url.port ? `:${url.port}` : ""}`);
    if (url.hostname === "127.0.0.1") hosts.add(`localhost${url.port ? `:${url.port}` : ""}`);
    return [...hosts].map((host) => `${url.protocol}//${host}`);
  } catch {
    return [base.replace(/\/$/, "")];
  }
}

export async function openDashboardTab(path: string) {
  const target = dashboardPath(path);
  const origins = dashboardOrigins();

  const tabs = await chrome.tabs.query({});
  const existing = tabs.find((tab) => {
    if (!tab.id || !tab.url) return false;
    return origins.some((origin) => tab.url!.startsWith(origin));
  });

  if (existing?.id != null) {
    await chrome.tabs.update(existing.id, { url: target, active: true });
    if (existing.windowId != null) {
      await chrome.windows.update(existing.windowId, { focused: true });
    }
    return;
  }

  await chrome.tabs.create({ url: target });
}
