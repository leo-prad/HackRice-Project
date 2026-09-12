import { Navigate } from "react-router-dom";
import { shouldRedirectGuestToApp } from "../lib/auth";
import { ROUTES } from "../lib/routes";

export function GuestOnly({ children }: { children: React.ReactNode }) {
  if (shouldRedirectGuestToApp()) {
    return <Navigate to={ROUTES.HOME} replace />;
  }
  return <>{children}</>;
}
