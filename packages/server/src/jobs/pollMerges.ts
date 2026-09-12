import { query } from "../db.js";
import { refreshSubmittedClaimsForUser } from "../services/claimRefresh.js";

const INTERVAL_MS = 60_000;

/** Background sweep: settle submitted claims whose PRs were approved or merged. */
export function startMergePolling() {
  const tick = async () => {
    try {
      const users = await query<{ id: number }>(
        `SELECT DISTINCT user_id AS id FROM claims WHERE status='submitted' AND pr_url IS NOT NULL`,
      );
      for (const user of users.rows) {
        await refreshSubmittedClaimsForUser(user.id).catch((error) => {
          console.error(`claim refresh failed for user ${user.id}:`, error);
        });
      }
    } catch (error) {
      console.error("merge poll failed:", error);
    }
  };
  void tick();
  setInterval(tick, INTERVAL_MS);
}
