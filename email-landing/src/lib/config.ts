function readViteEnv(key: keyof ImportMetaEnv): string {
  const raw = import.meta.env[key];
  if (typeof raw !== "string") return "";
  return raw.replace(/^["']|["']$/g, "").trim();
}

function computeApiUrl(): string {
  const fromEnv = readViteEnv("VITE_API_URL");
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const { origin, port } = window.location;
    if (import.meta.env.DEV) {
      // Recommended dev layout: Vite on 3000, API on 5173 (see README).
      if (port === "3000") return "http://localhost:5173";
      if (port === "5173") return "http://localhost:3000";
    }
    // Production build served from Express on the same host as the API.
    return origin;
  }

  return "http://localhost:3000";
}

export const API_URL = computeApiUrl();

export const MICROSOFT_CLIENT_ID = readViteEnv("VITE_MICROSOFT_CLIENT_ID");

function computeRedirectUri(): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${normalizedBase}auth/callback`;
  }
  return `http://localhost:5173/auth/callback`;
}

export const MICROSOFT_REDIRECT_URI = computeRedirectUri();

export const MICROSOFT_SCOPES = [
  "openid",
  "profile",
  "offline_access",
  "User.Read",
  "Mail.Read",
  "Mail.ReadWrite",
  "Mail.Send",
  "Calendars.ReadWrite",
].join(" ");

export const MICROSOFT_AUTHORIZE_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
