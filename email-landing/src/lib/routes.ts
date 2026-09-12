export const ROUTES = {
  LANDING: "/",
  AUTH_CALLBACK: "/auth/callback",
  /** First-run onboarding wizard (new accounts only). */
  ONBOARDING: "/onboarding",
  /** @deprecated Redirects to ONBOARDING */
  ONBOARDING_SOURCES: "/onboarding/sources",
  HOME: "/home",
  NEEDS_REPLY: "/needs-reply",
  BATCH_READY: "/batch-ready",
  INBOX: "/inbox",
  SENT: "/sent",
  DRAFTS: "/drafts",
  JUNK: "/junk",
  DELETED: "/deleted",
  ARCHIVE: "/archive",
  PROFILE: "/profile",
  COURSES: "/courses",
  SETTINGS: "/settings",
  PRICING: "/pricing",
  ABOUT: "/about",
  CONTACT: "/contact",
} as const;

/** Re-exported for route redirects (e.g. /pricing → landing + scroll). */
export { LANDING_SECTION, type LandingScrollState } from "./landingScroll";

/** Mail workbench URLs — all render InboxPage → MailPage. */
export const MAIL_ROUTES = [
  ROUTES.HOME,
  ROUTES.NEEDS_REPLY,
  ROUTES.BATCH_READY,
  ROUTES.INBOX,
  ROUTES.SENT,
  ROUTES.DRAFTS,
  ROUTES.JUNK,
  ROUTES.DELETED,
  ROUTES.ARCHIVE,
] as const;

/** Authenticated auxiliary pages — workbench shell (shared mail sidebar). */
export const APP_ROUTES = [
  ROUTES.PROFILE,
  ROUTES.COURSES,
  ROUTES.SETTINGS,
] as const;

const MAIL_ROUTE_RE =
  /^\/(home|needs-reply|batch-ready|inbox|sent|drafts|junk|deleted|archive)(\/|$)/;

const APP_ROUTE_RE = /^\/(profile|courses|settings)(\/|$)/;

export function isMailRoute(pathname: string): boolean {
  return MAIL_ROUTE_RE.test(pathname);
}

export function isAppRoute(pathname: string): boolean {
  return APP_ROUTE_RE.test(pathname);
}

/** Prefix-safe path for hard navigations (respects Vite `base`). */
export function resolveAppPath(route: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  if (route === "/" || route === "") {
    return `${normalizedBase}/` || "/";
  }
  return `${normalizedBase}${route}`;
}

export const ONBOARDING_COMPLETE_KEY = "incuria-onboarding-complete";
export const POST_AUTH_REDIRECT_KEY = "incuria-post-auth-redirect";
export const TEACHING_RULES_KEY = "incuria-teaching-rules";

/** @deprecated Server-backed onboarding flag on user profile is authoritative. */
export function isOnboardingCompleteLocal(): boolean {
  return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "1";
}

export function setOnboardingCompleteLocal(): void {
  localStorage.setItem(ONBOARDING_COMPLETE_KEY, "1");
}

export function setPostAuthRedirect(path: string): void {
  if (!path || path === ROUTES.LANDING) return;
  sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
}

export function consumePostAuthRedirect(): string | null {
  const path = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
  sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  return path;
}

export function getTeachingRules(): string {
  return localStorage.getItem(TEACHING_RULES_KEY) ?? "";
}

export function setTeachingRules(rules: string): void {
  if (rules.trim()) {
    localStorage.setItem(TEACHING_RULES_KEY, rules.trim());
  } else {
    localStorage.removeItem(TEACHING_RULES_KEY);
  }
}
