import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchOutlookProfile } from "../lib/api";
import { clearTokens, isAuthenticated, isMicrosoftAuthError } from "../lib/auth";
import { ROUTES } from "../lib/routes";

/**
 * Probes Microsoft Graph once per mount. Clears invalid sessions and sends user to landing.
 */
export function SessionValidator() {
  const navigate = useNavigate();
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current || !isAuthenticated()) return;
    checked.current = true;

    void fetchOutlookProfile().catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      if (!isMicrosoftAuthError(message)) return;
      clearTokens();
      navigate(ROUTES.LANDING, { replace: true });
    });
  }, [navigate]);

  return null;
}
