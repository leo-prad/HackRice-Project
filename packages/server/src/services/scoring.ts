import type { PoolClient } from "pg";
import type { IssueScore, QuestAnalysis, QuestSkill } from "@gitventure/shared";
import { SCORING_VERSION, allocateSkillXp, computeDifficulty, xpFromDifficulty } from "@gitventure/shared";
import { query, withTransaction } from "../db.js";
import { analyzeIssue } from "./analysis.js";
import { getIssueBundle, parseIssueUrl } from "./github.js";

export interface ScoreRow {
  issue_node_id: string; issue_url: string; quest_key: string; repo_full_name: string; repo_owner_id: string;
  issue_number: number; title: string; xp: number; difficulty_score: string | number;
  scoring_version: number; analysis_json: QuestAnalysis | null; days_open: number; scored_at: Date;
}

interface SkillRow {
  issue_node_id: string; skill_name: string; skill_level_required: number; skill_xp_reward: number; weight: string | number;
}

const toSkill = (row: SkillRow): QuestSkill => ({
  name: row.skill_name,
  requiredLevel: row.skill_level_required,
  weight: Number(row.weight),
  xpReward: row.skill_xp_reward,
});

export const toQuest = (row: ScoreRow, skills: QuestSkill[] = []): IssueScore => ({
  issueNodeId: row.issue_node_id,
  issueUrl: row.issue_url,
  questKey: row.quest_key,
  repoFullName: row.repo_full_name,
  repoOwnerId: String(row.repo_owner_id),
  issueNumber: row.issue_number,
  title: row.title,
  xp: row.xp,
  difficulty: Number(row.difficulty_score),
  scoringVersion: row.scoring_version,
  daysOpen: row.days_open,
  scoredAt: row.scored_at.toISOString(),
  analysis: row.analysis_json,
  skills,
});

const SKILL_ORDER = "ORDER BY skill_xp_reward DESC, skill_name ASC";

export async function questSkillsFor(nodeIds: string[]): Promise<Map<string, QuestSkill[]>> {
  const grouped = new Map<string, QuestSkill[]>();
  if (!nodeIds.length) return grouped;
  const result = await query<SkillRow>(`SELECT * FROM quest_skills WHERE issue_node_id = ANY($1::text[]) ${SKILL_ORDER}`, [nodeIds]);
  for (const row of result.rows) {
    const list = grouped.get(row.issue_node_id) ?? [];
    list.push(toSkill(row));
    grouped.set(row.issue_node_id, list);
  }
  return grouped;
}

export async function getQuest(nodeId: string): Promise<IssueScore | null> {
  const score = await query<ScoreRow>("SELECT * FROM issue_scores WHERE issue_node_id=$1", [nodeId]);
  if (!score.rowCount) return null;
  const skills = await questSkillsFor([nodeId]);
  return toQuest(score.rows[0], skills.get(nodeId) ?? []);
}

async function skillsInTransaction(client: PoolClient, nodeId: string): Promise<QuestSkill[]> {
  const result = await client.query<SkillRow>(`SELECT * FROM quest_skills WHERE issue_node_id=$1 ${SKILL_ORDER}`, [nodeId]);
  return result.rows.map(toSkill);
}

interface QuestFields {
  nodeId: string; issueUrl: string; questKey: string; repoFullName: string; repoOwnerId: number;
  issueNumber: number; title: string; xp: number; difficulty: number;
  analysis: QuestAnalysis; daysOpen: number;
}

/**
 * Writes a freshly analyzed quest. The first writer wins, so concurrent viewers converge on one
 * canonical XP value. Rows left behind by an older `scoring_version` are upgraded in place, which
 * keeps `issue_node_id` stable for existing claims.
 * Legacy `rarity` column is written as a fixed placeholder for schema compatibility.
 */
async function persistQuest(fields: QuestFields, skills: QuestSkill[]): Promise<IssueScore> {
  const values = [
    fields.nodeId, fields.issueUrl, fields.questKey, fields.repoFullName, fields.repoOwnerId,
    fields.issueNumber, fields.title, fields.xp, fields.difficulty, "none",
    SCORING_VERSION, JSON.stringify(fields.analysis), fields.daysOpen,
  ];

  return withTransaction(async (client) => {
    let row: ScoreRow | undefined;
    try {
      const inserted = await client.query<ScoreRow>(
        `INSERT INTO issue_scores
           (issue_node_id,issue_url,quest_key,repo_full_name,repo_owner_id,issue_number,title,xp,difficulty_score,rarity,scoring_version,analysis_json,days_open)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (issue_node_id) DO NOTHING RETURNING *`,
        values,
      );
      row = inserted.rows[0];
    } catch (error: any) {
      // A renamed repository can collide on quest_key with a different node id; reuse the stored quest.
      if (error?.code !== "23505") throw error;
      const byKey = await client.query<ScoreRow>("SELECT * FROM issue_scores WHERE quest_key=$1", [fields.questKey]);
      if (!byKey.rowCount) throw error;
      return toQuest(byKey.rows[0], await skillsInTransaction(client, byKey.rows[0].issue_node_id));
    }

    if (!row) {
      const existing = await client.query<ScoreRow>("SELECT * FROM issue_scores WHERE issue_node_id=$1 FOR UPDATE", [fields.nodeId]);
      const current = existing.rows[0];
      if (current && current.scoring_version >= SCORING_VERSION) {
        return toQuest(current, await skillsInTransaction(client, fields.nodeId));
      }
      const upgraded = await client.query<ScoreRow>(
        `UPDATE issue_scores SET issue_url=$2,quest_key=$3,repo_full_name=$4,repo_owner_id=$5,issue_number=$6,
           title=$7,xp=$8,difficulty_score=$9,rarity=$10,scoring_version=$11,analysis_json=$12,days_open=$13,scored_at=now()
         WHERE issue_node_id=$1 RETURNING *`,
        values,
      );
      row = upgraded.rows[0];
    }

    await client.query("DELETE FROM quest_skills WHERE issue_node_id=$1", [fields.nodeId]);
    for (const skill of skills) {
      await client.query(
        `INSERT INTO quest_skills (issue_node_id,skill_name,skill_level_required,skill_xp_reward,weight)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (issue_node_id,skill_name) DO NOTHING`,
        [fields.nodeId, skill.name, skill.requiredLevel, skill.xpReward, skill.weight],
      );
    }
    return toQuest(row!, await skillsInTransaction(client, fields.nodeId));
  });
}

/** Cache-first. A scored issue keeps its XP forever, so every player sees the same bounty. */
export async function scoreIssue(issueUrl: string, viewerToken?: string): Promise<IssueScore> {
  const parsed = parseIssueUrl(issueUrl);
  const cached = await query<ScoreRow>("SELECT * FROM issue_scores WHERE issue_url=$1", [parsed.canonical]);
  if (cached.rowCount && cached.rows[0].scoring_version >= SCORING_VERSION) {
    const skills = await questSkillsFor([cached.rows[0].issue_node_id]);
    return toQuest(cached.rows[0], skills.get(cached.rows[0].issue_node_id) ?? []);
  }

  const { issue, repository, readme, comments, architecture, codeFiles, testFiles } = await getIssueBundle(parsed.owner, parsed.repo, parsed.number, viewerToken);
  const daysOpen = Math.max(0, Math.floor((Date.now() - new Date(issue.created_at).getTime()) / 86_400_000));
  const { analysis, skills } = await analyzeIssue({
    issue,
    repository,
    readme,
    comments,
    daysOpen,
    architecture,
    codeFiles,
    testFiles,
  });

  const difficulty = computeDifficulty(analysis);
  const xp = xpFromDifficulty(difficulty);

  return persistQuest(
    {
      nodeId: issue.node_id,
      issueUrl: parsed.canonical,
      questKey: `${repository.full_name}#${issue.number}`,
      repoFullName: repository.full_name,
      repoOwnerId: repository.owner.id,
      issueNumber: issue.number,
      title: issue.title,
      xp,
      difficulty,
      analysis,
      daysOpen,
    },
    allocateSkillXp(xp, skills),
  );
}

/** Scores many issues with bounded concurrency, skipping the ones GitHub or the analyzer rejects. */
export async function scoreIssues(issueUrls: string[], viewerToken?: string, concurrency = 5): Promise<IssueScore[]> {
  const results: IssueScore[] = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < issueUrls.length) {
      const url = issueUrls[cursor++];
      try {
        results.push(await scoreIssue(url, viewerToken));
      } catch (error) {
        console.error(`Could not score ${url}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, issueUrls.length) }, worker));
  return results;
}
