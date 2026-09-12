import { query } from "../db.js";
import { getPull, parsePullUrl } from "./github.js";
import { awardMergedClaim, markClaimClosed } from "./xp.js";

// Poll every submitted claim's PR state and settle it. Merged claims release
// the remaining half of the target XP; closed-without-merge claims transition
// to 'closed' and forfeit the remainder. GitHub errors are swallowed so a
// single bad URL never sinks the whole sweep.
export async function refreshSubmittedClaimsForUser(userId: number) {
  const tokenRow = await query<{ github_token: string }>("SELECT github_token FROM users WHERE id=$1", [userId]);
  const token = tokenRow.rows[0]?.github_token;
  if (!token) return { merged: 0, closed: 0 };
  const claims = await query<{ id: number; pr_url: string | null }>(
    "SELECT id, pr_url FROM claims WHERE user_id=$1 AND status='submitted' AND pr_url IS NOT NULL",
    [userId],
  );
  let merged = 0;
  let closed = 0;
  for (const row of claims.rows) {
    try {
      const parsed = parsePullUrl(row.pr_url!);
      const pull = await getPull(parsed.owner, parsed.repo, parsed.number, token);
      if (pull.merged) { await awardMergedClaim(row.id, userId); merged += 1; }
      else if (pull.state === "closed") { await markClaimClosed(row.id, userId); closed += 1; }
    } catch { /* leave the claim for a later sweep */ }
  }
  return { merged, closed };
}
