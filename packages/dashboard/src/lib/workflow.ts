import type { UserProfile } from "@gitventure/shared";

/** Two exclusive product layers — never mix onboarding chrome with the live app. */
export type WorkflowLayer = "newcomer" | "returning";

export const WORKFLOW = {
  /** Post-OAuth resolver */
  continue: "/auth/continue",
  /** Newcomer-only */
  ingest: "/ingest",
  onboard: "/onboard",
  /** Returning-player app */
  home: "/next",
  profile: "/profile",
  complete: "/complete",
  pair: "/pair",
} as const;

const INGEST_SEEN_KEY = "gitventureIngestSeen";

export function workflowLayer(profile: Pick<UserProfile, "user">): WorkflowLayer {
  return profile.user.goals?.length ? "returning" : "newcomer";
}

export function homeFor(profile: Pick<UserProfile, "user">): string {
  return workflowLayer(profile) === "returning" ? WORKFLOW.home : WORKFLOW.ingest;
}

/** Session-local: animation already played for this login — skip replay, stay in newcomer layer. */
export function markIngestSeen(githubLogin: string) {
  sessionStorage.setItem(INGEST_SEEN_KEY, githubLogin);
}

export function hasIngestSeen(githubLogin: string): boolean {
  return sessionStorage.getItem(INGEST_SEEN_KEY) === githubLogin;
}

export function clearIngestSeen() {
  sessionStorage.removeItem(INGEST_SEEN_KEY);
}

/** Next newcomer step after ingest animation (or when revisiting ingest). */
export function newcomerStep(profile: Pick<UserProfile, "user">): string {
  if (workflowLayer(profile) === "returning") return WORKFLOW.home;
  if (hasIngestSeen(profile.user.githubLogin)) return WORKFLOW.onboard;
  return WORKFLOW.ingest;
}
