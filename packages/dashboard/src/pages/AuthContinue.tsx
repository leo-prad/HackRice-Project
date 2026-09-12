import type { UserProfile } from "@gitventure/shared";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, session } from "../lib/api";
import { homeFor, WORKFLOW } from "../lib/workflow";

/**
 * Post-OAuth (and “Open dashboard”) resolver.
 * Sends newcomers into ingest → onboard, returning players straight into the app.
 */
export default function AuthContinue() {
  const [target, setTarget] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session.get()) {
      setTarget("/");
      return;
    }
    let cancelled = false;
    api<UserProfile>("/users/me")
      .then((me) => {
        if (!cancelled) setTarget(homeFor(me));
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not continue");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void px-5">
        <div className="max-w-md text-center">
          <p className="font-body text-sm text-red-400">{error}</p>
          <a href="/" className="gv-btn-secondary mt-6 inline-flex px-5 py-3 text-sm">
            Back to home
          </a>
        </div>
      </div>
    );
  }

  if (!target) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-mist">Routing your session…</p>
      </div>
    );
  }

  return <Navigate to={target} replace />;
}

export { WORKFLOW };
