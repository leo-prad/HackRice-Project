import { Navigate, useLocation } from "react-router-dom";
import { SessionValidator } from "./SessionValidator";
import { isAuthenticated } from "../lib/auth";
import { isValidPostAuthPath } from "../lib/postAuthRoute";
import { ROUTES, setPostAuthRedirect } from "../lib/routes";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    const from = (location.state as { from?: string } | null)?.from;
    const redirectPath = from && isValidPostAuthPath(from) ? from : location.pathname;
    if (isValidPostAuthPath(redirectPath)) {
      setPostAuthRedirect(redirectPath);
    }
    return <Navigate to={ROUTES.LANDING} replace state={{ from: redirectPath }} />;
  }

  return (
    <>
      <SessionValidator />
      {children}
    </>
  );
}
