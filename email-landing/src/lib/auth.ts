const TOKEN_KEY = "outlook_access_token";
const TOKEN_META_KEY = "outlook_token_response";
const TOKEN_EXPIRES_AT_KEY = "outlook_token_expires_at";

export type StoredTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  refresh_token?: string;
  id_token?: string;
};

/**
 * Treat all users as signed out for route guards.
 * - Production: only when `VITE_FORCE_GUEST=1`
 * - Development: on by default; set `VITE_FORCE_GUEST=0` in email-landing/.env to test signed-in flows
 */
export function isForceGuest(): boolean {
  const flag = import.meta.env.VITE_FORCE_GUEST;
  if (flag === "1") return true;
  if (flag === "0") return false;
  return import.meta.env.DEV;
}

/** Microsoft Graph access tokens are often opaque (no dots) — that is valid. */
export function normalizeAccessToken(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  let t = raw.trim().replace(/^Bearer\s+/i, "");
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1).trim();
  }
  if (!t || t === "undefined" || t === "null") return null;
  // Accidentally stored JSON blob instead of token string
  if (t.startsWith("{") || t.startsWith("[")) return null;
  if (t.length < 20) return null;
  return t;
}

export function getAccessToken(): string | null {
  return normalizeAccessToken(localStorage.getItem(TOKEN_KEY));
}

function getTokenExpiresAt(): number | null {
  const raw = localStorage.getItem(TOKEN_EXPIRES_AT_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** True when a stored expiry timestamp exists and is in the past. */
export function isAccessTokenExpired(): boolean {
  const expiresAt = getTokenExpiresAt();
  if (expiresAt == null) return false;
  return Date.now() >= expiresAt;
}

/** Drop stale credentials from localStorage. */
export function purgeExpiredTokens(): void {
  if (getAccessToken() && isAccessTokenExpired()) {
    clearTokens();
  }
}

/**
 * True when a non-expired access token is stored.
 * Does not validate with Microsoft — use SessionValidator for that.
 */
export function isAuthenticated(): boolean {
  purgeExpiredTokens();
  return !!getAccessToken();
}

/** Marketing routes: skip redirect to app when dev force-guest is on. */
export function shouldRedirectGuestToApp(): boolean {
  return isAuthenticated() && !isForceGuest();
}

export function saveTokenResponse(response: StoredTokenResponse): void {
  const token = normalizeAccessToken(response.access_token);
  if (!token) {
    throw new Error("Sign-in did not return a valid access token. Please try again.");
  }
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_META_KEY, JSON.stringify({ ...response, access_token: token }));
  if (typeof response.expires_in === "number" && response.expires_in > 0) {
    localStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(Date.now() + response.expires_in * 1000));
  } else {
    localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
  }
}

const PROFILE_KEY = "outlook_user_profile";

export type UserProfile = {
  id: string;
  displayName: string;
  email?: string;
  plan?: "free" | "pro" | "premium";
  isNewUser?: boolean;
  onboardingCompleted?: boolean;
};

export function patchUserProfile(patch: Partial<UserProfile>): void {
  const current = getUserProfile();
  if (!current) return;
  saveUserProfile({ ...current, ...patch });
}

export function isOnboardingComplete(): boolean {
  const profile = getUserProfile();
  if (profile?.onboardingCompleted === true) return true;
  if (profile?.onboardingCompleted === false && profile.isNewUser === true) return false;
  // Legacy localStorage migration for existing sessions
  const legacy = localStorage.getItem("incuria-onboarding-complete") === "1";
  return legacy;
}

export function markOnboardingCompleteInProfile(): void {
  patchUserProfile({ onboardingCompleted: true, isNewUser: false });
  localStorage.setItem("incuria-onboarding-complete", "1");
}

export function shouldShowOnboardingGate(): boolean {
  const profile = getUserProfile();
  return profile?.isNewUser === true && !isOnboardingComplete();
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getUserProfile(): UserProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function getUserDisplayName(): string {
  return getUserProfile()?.displayName?.trim() || "Instructor";
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_META_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

export function getStoredTokenResponse(): StoredTokenResponse | null {
  const raw = localStorage.getItem(TOKEN_META_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredTokenResponse;
    const token = normalizeAccessToken(parsed.access_token);
    if (!token) return null;
    return { ...parsed, access_token: token };
  } catch {
    return null;
  }
}

/** True when Graph/Microsoft returns auth errors (invalid or expired token). */
export function isMicrosoftAuthError(message: string): boolean {
  return /IDX14100|JWT is not well formed|InvalidAuthenticationToken|invalid_token|401|token.*expired|Compact Serialization/i.test(
    message,
  );
}
