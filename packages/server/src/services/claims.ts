import type { Claim, ClaimStatus, IssueScore, QuestCompletion } from "@questline/shared";
import { query } from "../db.js";
import { questSkillsFor, toQuest, type ScoreRow } from "./scoring.js";

export interface ClaimRow {
  id: number; user_id: number; issue_node_id: string; status: ClaimStatus;
  pr_url: string | null; pr_number: number | null; pr_repo: string | null;
  xp_awarded: number; claimed_at: Date; submitted_at: Date | null; merged_at: Date | null;
  risk_multiplier?: number;
  double_choice?: "take" | "risk" | null; double_won?: boolean | null; double_bonus_awarded?: number;
  completion_json?: QuestCompletion | null;
}

export const toClaim = (row: ClaimRow, score?: IssueScore): Claim => ({
  id: row.id,
  userId: row.user_id,
  issueNodeId: row.issue_node_id,
  status: row.status,
  prUrl: row.pr_url,
  prNumber: row.pr_number,
  prRepo: row.pr_repo,
  xpAwarded: row.xp_awarded,
  riskMultiplier: Number(row.risk_multiplier ?? 1),
  doubleChoice: row.double_choice ?? undefined,
  doubleWon: row.double_won,
  doubleBonusAwarded: Number(row.double_bonus_awarded ?? 0),
  claimedAt: row.claimed_at.toISOString(),
  submittedAt: row.submitted_at ? row.submitted_at.toISOString() : null,
  mergedAt: row.merged_at ? row.merged_at.toISOString() : null,
  ...(score ? { score } : {}),
});

/** Claims for one player, each hydrated with its quest so the UI can show XP, rarity, and skills. */
export async function claimsForUser(userId: number): Promise<Claim[]> {
  const claims = await query<ClaimRow & ScoreRow>(
    `SELECT c.*, s.issue_url, s.quest_key, s.repo_full_name, s.repo_owner_id, s.issue_number, s.title,
            s.xp, s.difficulty_score, s.rarity, s.scoring_version, s.analysis_json, s.days_open, s.scored_at
     FROM claims c JOIN issue_scores s ON s.issue_node_id = c.issue_node_id
     WHERE c.user_id = $1 ORDER BY c.claimed_at DESC`,
    [userId],
  );
  const skills = await questSkillsFor(claims.rows.map((row) => row.issue_node_id));
  return claims.rows.map((row) => toClaim(row, toQuest(row, skills.get(row.issue_node_id) ?? [])));
}
