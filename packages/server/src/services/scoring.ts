import { GoogleGenAI } from "@google/genai";
import type { IssueScore } from "@questline/shared";
import { XP_LADDER } from "@questline/shared";
import { query } from "../db.js";
import { contributorCount, getIssueBundle, parseIssueUrl } from "./github.js";

// Personal or single-contributor repos can't produce a competitive bounty:
// nobody else can review, so the ceiling is capped independently of Gemini.
const LOW_STAKES_CAP = 300;

const SYSTEM_PROMPT = `You assign XP bounties to open source GitHub issues for a developer game.

You will be given one issue. Return a single XP number representing how much effort and skill closing it requires.

Calibrate against these anchors:
200 XP fix a typo in documentation
500 XP add a missing null check, under 10 lines changed
1,000 XP add a config option with an obvious implementation
2,000 XP write unit tests for an existing untested function
3,500 XP fix a bug that requires reading 2 to 3 files to understand
5,000 XP implement a small feature with a new public API surface
8,000 XP fix a race condition or memory leak with no reliable repro
12,000 XP refactor a subsystem while preserving behavior
20,000 XP architectural change spanning multiple subsystems

Weigh codebase knowledge, investigation, design judgment, unresolved disagreement, repository review bar, and issue age. Do not reward verbosity. Do not penalize a short issue body when the work is hard.
Return only {"xp": <integer>}. No explanation, label, or other fields.`;

interface ScoreRow {
  issue_node_id: string; issue_url: string; repo_full_name: string; repo_owner_id: string;
  issue_number: number; title: string; xp: number; days_open: number; scored_at: Date;
}

export const snapXp = (raw: number) => XP_LADDER.reduce((best, rung) =>
  Math.abs(rung - raw) < Math.abs(best - raw) ? rung : best, XP_LADDER[0]);

const xpRarity = (xp: number) =>
  xp >= 12000 ? "legendary" : xp >= 5000 ? "epic" : xp >= 2000 ? "rare" : xp >= 1000 ? "uncommon" : "common";

const toScore = (row: ScoreRow): IssueScore => ({
  issueNodeId: row.issue_node_id, issueUrl: row.issue_url, repoFullName: row.repo_full_name,
  repoOwnerId: String(row.repo_owner_id), issueNumber: row.issue_number, title: row.title,
  // Leave the sub-cap values alone; only snap the larger raw legacy values.
  xp: row.xp <= LOW_STAKES_CAP ? row.xp : snapXp(row.xp),
  daysOpen: row.days_open, scoredAt: row.scored_at.toISOString(),
});

export async function scoreIssue(issueUrl: string, viewerToken?: string): Promise<IssueScore> {
  const parsed = parseIssueUrl(issueUrl);
  const cached = await query<ScoreRow>("SELECT * FROM issue_scores WHERE issue_url=$1", [parsed.canonical]);
  if (cached.rowCount) return toScore(cached.rows[0]);

  const { issue, repository, comments } = await getIssueBundle(parsed.owner, parsed.repo, parsed.number, viewerToken);
  const daysOpen = Math.max(0, Math.floor((Date.now() - new Date(issue.created_at).getTime()) / 86_400_000));
  const labels = issue.labels.map((label) => typeof label === "string" ? label : label.name).filter(Boolean).join(", ") || "none";
  const prompt = `Repository: ${repository.full_name} (${repository.stargazers_count} stars, ${repository.open_issues_count} open issues)\nIssue #${issue.number}: ${issue.title}\nLabels: ${labels}\nOpened: ${daysOpen} days ago\nComments: ${issue.comments}\nAlready has a linked PR: no\n\nBody:\n${(issue.body ?? "").slice(0, 4000)}\n\nTop comments:\n${comments.slice(0, 3).map((c) => (c.body ?? "").slice(0, 500)).join("\n\n")}`;

  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.interactions.create({
    model: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
    system_instruction: SYSTEM_PROMPT,
    input: prompt,
    generation_config: { thinking_level: "low" },
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: { type: "object", properties: { xp: { type: "integer", minimum: 1 } }, required: ["xp"], additionalProperties: false },
    },
  });
  const raw = JSON.parse(response.output_text ?? "{}") as { xp?: number };
  if (!Number.isInteger(raw.xp) || (raw.xp ?? 0) <= 0) throw new Error("Gemini returned an invalid XP score");
  let xp: number = snapXp(raw.xp!);
  const contributors = await contributorCount(parsed.owner, parsed.repo, viewerToken);
  const lowStakes = repository.private || contributors <= 1;
  if (lowStakes) xp = Math.min(xp, LOW_STAKES_CAP);

  // First database write wins, so concurrent viewers always receive the same immutable bounty.
  // quest_key / difficulty_score / rarity / scoring_version were added by a parallel schema
  // change; populate sensible defaults so the insert never fails on NOT NULL.
  const inserted = await query<ScoreRow>(
    `INSERT INTO issue_scores (issue_node_id,issue_url,repo_full_name,repo_owner_id,issue_number,title,xp,days_open,quest_key,difficulty_score,rarity,scoring_version)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (issue_node_id) DO NOTHING RETURNING *`,
    [issue.node_id, parsed.canonical, repository.full_name, repository.owner.id, issue.number, issue.title, xp, daysOpen, issue.node_id, Math.min(99.99, xp / 2000), xpRarity(xp), 1],
  );
  if (inserted.rowCount) return toScore(inserted.rows[0]);
  const winner = await query<ScoreRow>("SELECT * FROM issue_scores WHERE issue_node_id=$1", [issue.node_id]);
  return toScore(winner.rows[0]);
}
