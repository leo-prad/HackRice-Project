import { Navigate, useLocation } from "react-router-dom";
import { shouldShowOnboardingGate } from "../lib/auth";
import { isOnboardingExemptPath } from "../lib/postAuthRoute";
import { isMailRoute, ROUTES } from "../lib/routes";

/** Redirects new users away from mail until onboarding is complete. */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  if (isMailRoute(pathname) && shouldShowOnboardingGate() && !isOnboardingExemptPath(pathname)) {
    return <Navigate to={ROUTES.ONBOARDING} replace />;
  }

  return <>{children}</>;
}
