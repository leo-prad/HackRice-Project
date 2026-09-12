import { withTransaction } from "../db.js";

// XP is only released once a maintainer approves the PR (or the PR is merged).
// Submitting the PR link on its own grants nothing — it just parks the claim
// in 'submitted' so the refresh sweep can settle it later.
const targetAward = (bountyXp: number, viewerGithubId: string, repoOwnerId: string) => {
  const multiplier = String(viewerGithubId) === String(repoOwnerId) ? 0.25 : 1;
  return Math.floor(bountyXp * multiplier);
};

export async function awardSubmittedClaim(claimId: number, userId: number, prUrl: string, prRepo: string, prNumber: number) {
  return withTransaction(async (client) => {
    const locked = await client.query(
      `SELECT c.*, s.xp, s.repo_owner_id, u.github_id FROM claims c
       JOIN issue_scores s ON s.issue_node_id=c.issue_node_id JOIN users u ON u.id=c.user_id
       WHERE c.id=$1 AND c.user_id=$2 FOR UPDATE`, [claimId, userId],
    );
    if (!locked.rowCount) throw Object.assign(new Error("Claim not found"), { status: 404 });
    const claim = locked.rows[0];
    if (claim.status !== "claimed") throw Object.assign(new Error("Claim was already submitted"), { status: 409 });
    const target = targetAward(claim.xp, claim.github_id, claim.repo_owner_id);
    const updated = await client.query(
      `UPDATE claims SET status='submitted',pr_url=$1,pr_repo=$2,pr_number=$3,xp_awarded=0,submitted_at=now()
       WHERE id=$4 RETURNING *`, [prUrl, prRepo, prNumber, claimId],
    );
    // No XP granted yet; log a zero-delta event so the audit trail still shows
    // the submission moment.
    await client.query("INSERT INTO xp_events (user_id,claim_id,delta,kind,note) VALUES ($1,$2,0,'claim_submitted',$3)",
      [userId, claimId, "PR submitted - awaiting approval"]);
    return { claim: updated.rows[0], xpAwarded: 0, target };
  });
}

// Called when a submitted PR is approved or merged; releases the full target
// XP the claim was worth.
export async function awardMergedClaim(claimId: number, userId: number) {
  return withTransaction(async (client) => {
    const locked = await client.query(
      `SELECT c.*, s.xp, s.repo_owner_id, u.github_id FROM claims c
       JOIN issue_scores s ON s.issue_node_id=c.issue_node_id JOIN users u ON u.id=c.user_id
       WHERE c.id=$1 AND c.user_id=$2 FOR UPDATE`, [claimId, userId],
    );
    if (!locked.rowCount) throw Object.assign(new Error("Claim not found"), { status: 404 });
    const claim = locked.rows[0];
    if (claim.status !== "submitted") return { claim, xpAwarded: 0, target: 0 };
    const target = targetAward(claim.xp, claim.github_id, claim.repo_owner_id);
    const remainder = Math.max(0, target - Number(claim.xp_awarded ?? 0));
    const updated = await client.query(
      `UPDATE claims SET status='merged',xp_awarded=$1,merged_at=now() WHERE id=$2 RETURNING *`,
      [target, claimId],
    );
    if (remainder > 0) {
      await client.query("INSERT INTO xp_events (user_id,claim_id,delta,kind,note) VALUES ($1,$2,$3,'claim_approved',$4)",
        [userId, claimId, remainder, "PR approved - XP released"]);
      await client.query("UPDATE users SET total_xp=total_xp+$1,last_active_at=now() WHERE id=$2", [remainder, userId]);
    }
    return { claim: updated.rows[0], xpAwarded: remainder, target };
  });
}

export async function markClaimClosed(claimId: number, userId: number) {
  return withTransaction(async (client) => {
    const locked = await client.query(
      `SELECT * FROM claims WHERE id=$1 AND user_id=$2 FOR UPDATE`, [claimId, userId],
    );
    if (!locked.rowCount) return null;
    const claim = locked.rows[0];
    if (claim.status !== "submitted") return claim;
    const updated = await client.query(
      `UPDATE claims SET status='closed' WHERE id=$1 RETURNING *`, [claimId],
    );
    return updated.rows[0];
  });
}
