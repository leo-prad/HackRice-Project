import type { Claim, QuestCompletion } from "@questline/shared";
import { query } from "../db.js";
import { toClaim, type ClaimRow } from "./claims.js";
import { getQuest } from "./scoring.js";
import { refreshSubmittedClaimsForUser } from "./claimRefresh.js";

export interface SubmitResult {
  claim: Claim;
  completion: QuestCompletion | null;
  pending: string | null;
}

const reload = async (claimId: number): Promise<{ claim: Claim; completion: QuestCompletion | null }> => {
  const result = await query<ClaimRow>("SELECT * FROM claims WHERE id = $1", [claimId]);
  const row = result.rows[0];
  const score = await getQuest(row.issue_node_id);
  return {
    claim: toClaim(row, score ?? undefined),
    completion: row.completion_json ?? null,
  };
};

/** Re-check GitHub for this user's submitted PRs, then return the requested claim. */
export async function refreshClaim(claimId: number, userId: number): Promise<SubmitResult> {
  const before = await query<ClaimRow>("SELECT * FROM claims WHERE id=$1 AND user_id=$2", [claimId, userId]);
  if (!before.rowCount) throw Object.assign(new Error("Claim not found"), { status: 404 });

  await refreshSubmittedClaimsForUser(userId);
  const loaded = await reload(claimId);

  if (loaded.claim.status === "merged") {
    return { ...loaded, pending: null };
  }
  if (loaded.claim.status === "closed") {
    return { ...loaded, completion: null, pending: "PR was closed without approval — you can re-claim." };
  }
  return {
    ...loaded,
    completion: null,
    pending: "Still awaiting maintainer approval or merge.",
  };
}
