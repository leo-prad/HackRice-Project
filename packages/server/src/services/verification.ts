import type { Claim, QuestCompletion } from "@questline/shared";
import { query } from "../db.js";
import { toClaim, type ClaimRow } from "./claims.js";
import { getQuest } from "./scoring.js";
import { completeClaim } from "./xp.js";

export interface SubmitResult {
  claim: Claim;
  completion: QuestCompletion | null;
  pending: string | null;
}

const reload = async (claimId: number): Promise<Claim> => {
  const result = await query<ClaimRow>("SELECT * FROM claims WHERE id = $1", [claimId]);
  const row = result.rows[0];
  const score = await getQuest(row.issue_node_id);
  return toClaim(row, score ?? undefined);
};

/**
 * Completes a quest after a PR has been linked. No merge wait — author + issue reference
 * were already checked on submit.
 */
export async function finalizeLinkedClaim(claimId: number, note: string): Promise<SubmitResult> {
  const row = await query<ClaimRow>("SELECT * FROM claims WHERE id = $1", [claimId]);
  if (!row.rowCount) throw Object.assign(new Error("Claim not found"), { status: 404 });

  if (row.rows[0].status === "merged") {
    return { claim: await reload(claimId), completion: row.rows[0].completion_json ?? null, pending: null };
  }

  const completion = await completeClaim(claimId, note);
  return { claim: await reload(claimId), completion, pending: null };
}
