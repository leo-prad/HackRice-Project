import type { Course } from "../types";
import { getUserProfile, isOnboardingComplete } from "./auth";
import { isAppRoute, isMailRoute, MAIL_ROUTES, ROUTES, APP_ROUTES } from "./routes";

const ALL_APP_DESTINATIONS = [...MAIL_ROUTES, ...APP_ROUTES, ROUTES.SETTINGS] as const;

export type PostAuthProfile = {
  isNewUser?: boolean;
  onboardingCompleted?: boolean;
};

export function isValidPostAuthPath(path: string): boolean {
  if (!path || path === ROUTES.LANDING || path === ROUTES.AUTH_CALLBACK) return false;
  if (path.startsWith(ROUTES.ONBOARDING) || path.startsWith(ROUTES.ONBOARDING_SOURCES)) return false;
  return (
    isMailRoute(path) ||
    isAppRoute(path) ||
    path === ROUTES.SETTINGS ||
    path.startsWith(`${ROUTES.SETTINGS}/`)
  );
}

export function resolvePostAuthDestination(
  profile: PostAuthProfile,
  redirectPath?: string | null,
): string {
  if (redirectPath && isValidPostAuthPath(redirectPath)) {
    return redirectPath;
  }

  const isNew = profile.isNewUser === true;
  const onboardingDone =
    profile.onboardingCompleted === true || (!isNew && isOnboardingComplete());

  if (isNew && !onboardingDone) {
    return ROUTES.ONBOARDING;
  }

  return ROUTES.HOME;
}

/** Legacy overload for callers still passing courses — profile flags preferred. */
export function resolvePostAuthDestinationFromSession(
  courses: Course[],
  redirectPath?: string | null,
): string {
  const profile = getUserProfile();
  return resolvePostAuthDestination(
    {
      isNewUser: profile?.isNewUser,
      onboardingCompleted: profile?.onboardingCompleted ?? (courses.some((c) => c.trainedAt) ? true : isOnboardingComplete()),
    },
    redirectPath,
  );
}

/** Routes reachable while onboarding wizard is in progress. */
export function isOnboardingExemptPath(pathname: string): boolean {
  if (pathname.startsWith(ROUTES.ONBOARDING) || pathname.startsWith(ROUTES.ONBOARDING_SOURCES)) return true;
  if (pathname === ROUTES.SETTINGS || pathname.startsWith(`${ROUTES.SETTINGS}/`)) return true;
  if (pathname.startsWith(ROUTES.COURSES)) return true;
  if (pathname.startsWith(ROUTES.PROFILE)) return true;
  return false;
}

export { ALL_APP_DESTINATIONS };
