import type { UserProfile } from "@gitventure/shared";
import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../../lib/api";
import { newcomerStep, WORKFLOW, workflowLayer, type WorkflowLayer } from "../../lib/workflow";

type Props = {
  children: ReactNode;
  /** Which exclusive layer may render this route. */
  layer: WorkflowLayer;
};

/**
 * Loads the player once and keeps newcomer vs returning routes from overlapping.
 * - newcomer routes (ingest/onboard): bounce to /next if goals already exist
 * - returning routes (next/profile/…): bounce into ingest/onboard if goals are missing
 */
export default function WorkflowGate({ children, layer }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api<UserProfile>("/users/me")
      .then((me) => {
        if (!cancelled) setProfile(me);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load session");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-void px-5">
        <p className="font-body text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-void">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-mist">Loading…</p>
      </div>
    );
  }

  const actual = workflowLayer(profile);

  if (layer === "newcomer" && actual === "returning") {
    return <Navigate to={WORKFLOW.home} replace />;
  }

  if (layer === "returning" && actual === "newcomer") {
    return <Navigate to={newcomerStep(profile)} replace />;
  }

  return <>{children}</>;
}
