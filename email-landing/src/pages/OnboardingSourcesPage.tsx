import { Navigate } from "react-router-dom";
import { ROUTES } from "../lib/routes";

/** @deprecated Bookmarks to /onboarding/sources redirect to the wizard. */
export default function OnboardingSourcesPage() {
  return <Navigate to={ROUTES.ONBOARDING} replace />;
}
