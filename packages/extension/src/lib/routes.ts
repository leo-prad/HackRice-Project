/** Dashboard paths — keep aligned with `packages/dashboard/src/lib/workflow.ts`. */
export const ROUTES = {
  /** Post-auth / “Open dashboard” resolver (newcomer → ingest, returning → next). */
  continue: "/auth/continue",
  ingest: "/ingest",
  onboard: "/onboard",
  home: "/next",
  profile: "/profile",
  complete: "/complete",
  pair: "/pair",
  leaderboard: "/leaderboard",
  login: "/",
} as const;

export type DashboardRoute = (typeof ROUTES)[keyof typeof ROUTES];
