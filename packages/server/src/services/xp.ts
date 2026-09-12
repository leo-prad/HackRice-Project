import { withTransaction } from "../db.js";

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
    const multiplier = String(claim.github_id) === String(claim.repo_owner_id) ? 0.25 : 1;
    const award = Math.floor(claim.xp * multiplier);
    const updated = await client.query(
      `UPDATE claims SET status='submitted',pr_url=$1,pr_repo=$2,pr_number=$3,xp_awarded=$4,submitted_at=now()
       WHERE id=$5 RETURNING *`, [prUrl, prRepo, prNumber, award, claimId],
    );
    await client.query("INSERT INTO xp_events (user_id,claim_id,delta,kind,note) VALUES ($1,$2,$3,'claim_complete',$4)",
      [userId, claimId, award, multiplier === 0.25 ? "25% self-owned repository award" : "PR submitted"]);
    await client.query("UPDATE users SET total_xp=total_xp+$1,last_active_at=now() WHERE id=$2", [award, userId]);
    return { claim: updated.rows[0], xpAwarded: award };
  });
}
