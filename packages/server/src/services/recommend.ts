import type { IssueScore, QuestRecommendation, RecommendationTier } from "@questline/shared";
import { GOAL_SKILL_HINTS, SCORING_VERSION, levelProgress, roman, skillLevel, skillLevelThreshold } from "@questline/shared";
import { query } from "../db.js";
import { searchIssues } from "./github.js";
import { matchQuestsWithAi, TIER_LABELS } from "./questMatcher.js";
import { questSkillsFor, scoreIssues, toQuest, type ScoreRow } from "./scoring.js";

/**
 * Product quest board — all issues come from this repo unless DEMO_REPOS overrides.
 * Override with DEMO_REPOS in `.env` (comma-separated owner/repo).
 */
export const DEMO_WORLD_DEFAULTS = ["tejaspalukuri/GitPathDemo"] as const;

const DEMO_REPO = DEMO_WORLD_DEFAULTS[0];

/** Goal map stays inside the product demo repo so Next Quest never leaves GitPathDemo. */
const DEFAULT_REPOS: Record<string, string[]> = {
  Frontend: [DEMO_REPO],
  Backend: [DEMO_REPO],
  Python: [DEMO_REPO],
  TypeScript: [DEMO_REPO],
  Systems: [DEMO_REPO],
  Databases: [DEMO_REPO],
  "Machine Learning": [DEMO_REPO],
  DevOps: [DEMO_REPO],
};

const parseRepoList = (raw: string | undefined) =>
  (raw ?? "").split(",").map((entry) => entry.trim()).filter((entry) => /^[\w.-]+\/[\w.-]+$/.test(entry));

/** When DEMO_REPOS is set (or defaults apply), Next Quest stays inside that allowlist. */
export function demoWorlds(): string[] {
  const fromEnv = parseRepoList(process.env.DEMO_REPOS);
  return fromEnv.length ? fromEnv : [...DEMO_WORLD_DEFAULTS];
}

interface PlayerContext {
  level: number;
  goals: string[];
  skillXp: Map<string, number>;
  excluded: Set<string>;
  baseline: number;
}

async function loadPlayer(userId: number): Promise<PlayerContext> {
  const [user, goals, skills, claims, recent] = await Promise.all([
    query<{ total_xp: number }>("SELECT total_xp FROM users WHERE id=$1", [userId]),
    query<{ goal: string }>("SELECT goal FROM user_goals WHERE user_id=$1", [userId]),
    query<{ skill_name: string; xp: number }>("SELECT skill_name,xp FROM user_skills WHERE user_id=$1", [userId]),
    query<{ issue_node_id: string }>("SELECT issue_node_id FROM claims WHERE user_id=$1 AND status <> 'abandoned'", [userId]),
    query<{ difficulty_score: string }>(
      `SELECT s.difficulty_score FROM claims c JOIN issue_scores s ON s.issue_node_id=c.issue_node_id
       WHERE c.user_id=$1 AND c.status='merged' ORDER BY c.merged_at DESC LIMIT 3`,
      [userId],
    ),
  ]);

  const level = levelProgress(user.rows[0]?.total_xp ?? 0).level;
  const history = recent.rows.map((row) => Number(row.difficulty_score));
  const baseline = history.length
    ? history.reduce((sum, value) => sum + value, 0) / history.length
    : Math.min(6, 2 + level * 0.5);

  return {
    level,
    goals: goals.rows.map((row) => row.goal),
    skillXp: new Map(skills.rows.map((row) => [row.skill_name.toLowerCase(), row.xp])),
    excluded: new Set(claims.rows.map((row) => row.issue_node_id)),
    baseline,
  };
}

const playerSkillLevel = (player: PlayerContext, skillName: string) => skillLevel(player.skillXp.get(skillName.toLowerCase()) ?? 0);

function goalMatches(player: PlayerContext, quest: IssueScore): string[] {
  const questSkills = quest.skills.map((skill) => skill.name.toLowerCase());
  return player.goals.filter((goal) => {
    const hints = GOAL_SKILL_HINTS[goal] ?? [goal.toLowerCase()];
    return hints.some((hint) => questSkills.some((name) => name.includes(hint) || hint.includes(name)));
  });
}

function buildReasons(player: PlayerContext, quest: IssueScore): string[] {
  const reasons: string[] = [];
  for (const skill of quest.skills.slice(0, 3)) {
    const current = playerSkillLevel(player, skill.name);
    reasons.push(
      current >= skill.requiredLevel
        ? `Matches ${skill.name} LVL ${current}`
        : `Challenges ${skill.name} LVL ${current} → needs ${roman(skill.requiredLevel)}`,
    );
  }
  const goals = goalMatches(player, quest);
  if (goals.length) reasons.push(`Advances your ${goals.slice(0, 2).join(" and ")} goal`);
  return reasons;
}

/** "Testing LVL 3 → 4" for the skill whose reward actually crosses a threshold. */
function potentialReward(player: PlayerContext, quest: IssueScore): string | null {
  for (const skill of [...quest.skills].sort((a, b) => b.xpReward - a.xpReward)) {
    const currentXp = player.skillXp.get(skill.name.toLowerCase()) ?? 0;
    const before = skillLevel(currentXp);
    const after = skillLevel(currentXp + skill.xpReward);
    if (after > before) return `${skill.name} LVL ${before} → ${after}`;
  }
  const best = quest.skills[0];
  if (!best) return null;
  const currentXp = player.skillXp.get(best.name.toLowerCase()) ?? 0;
  const needed = skillLevelThreshold(skillLevel(currentXp) + 1) - currentXp;
  return `${best.name} +${best.xpReward} XP (${needed} to next level)`;
}

async function cachedCandidates(player: PlayerContext, limit: number, worlds: string[]): Promise<IssueScore[]> {
  const rows = await query<ScoreRow>(
    `SELECT * FROM issue_scores
     WHERE scoring_version >= $1
       AND issue_node_id <> ALL($2::text[])
       AND ($3::text[] IS NULL OR repo_full_name = ANY($3::text[]))
     ORDER BY scored_at DESC LIMIT $4`,
    [SCORING_VERSION, Array.from(player.excluded), worlds.length ? worlds : null, limit],
  );
  const skills = await questSkillsFor(rows.rows.map((row) => row.issue_node_id));
  return rows.rows.map((row) => toQuest(row, skills.get(row.issue_node_id) ?? []));
}

/**
 * Demo mode (default): only the curated DEMO_REPOS worlds.
 * If DEMO_REPOS="" explicitly and you want the old goal map, set USE_GOAL_REPO_MAP=true.
 */
function repoPool(player: PlayerContext, extraRepo?: string): string[] {
  if (process.env.USE_GOAL_REPO_MAP === "true") {
    const repos = new Set<string>();
    if (extraRepo) repos.add(extraRepo);
    demoWorlds().forEach((repo) => repos.add(repo));
    const goals = player.goals.length ? player.goals : Object.keys(DEFAULT_REPOS);
    for (const goal of goals) (DEFAULT_REPOS[goal] ?? []).forEach((repo) => repos.add(repo));
    return Array.from(repos).slice(0, 6);
  }

  const worlds = demoWorlds();
  if (extraRepo && worlds.some((repo) => repo.toLowerCase() === extraRepo.toLowerCase())) {
    return worlds;
  }
  return worlds.slice(0, 6);
}

async function freshCandidates(player: PlayerContext, viewerToken?: string, extraRepo?: string): Promise<IssueScore[]> {
  const repos = repoPool(player, extraRepo);
  if (!repos.length) return [];
  try {
    // All open issues in the allowlisted demo repo(s) — do not require specific labels.
    const repoClause = repos.map((repo) => `repo:${repo}`).join(" OR ");
    const found = await searchIssues(`(${repoClause}) is:issue is:open`, 20, viewerToken);
    const urls = found
      .filter((item) => !player.excluded.has(item.node_id))
      .slice(0, 12)
      .map((item) => item.html_url);
    return await scoreIssues(urls, viewerToken, 4);
  } catch (error) {
    console.warn("Quest search failed, falling back to cached quests:", error instanceof Error ? error.message : error);
    return [];
  }
}

const pick = (pool: IssueScore[], target: number, used: Set<string>, preferHarder: boolean): IssueScore | undefined =>
  pool
    .filter((quest) => !used.has(quest.issueNodeId))
    .sort((a, b) => {
      const distance = Math.abs(a.difficulty - target) - Math.abs(b.difficulty - target);
      if (Math.abs(distance) > 0.001) return distance;
      return preferHarder ? b.difficulty - a.difficulty : a.difficulty - b.difficulty;
    })[0];

/**
 * Three quests around the player's current ability. Prefers the AI Quest Matcher; falls back to
 * deterministic Safe / Level-up / Boss picks when Gemini is unavailable.
 */
export async function recommendQuests(userId: number, viewerToken?: string, repoFullName?: string): Promise<QuestRecommendation[]> {
  const player = await loadPlayer(userId);
  const worlds = demoWorlds();
  let pool = await cachedCandidates(player, 40, worlds);
  if (pool.length < 6) {
    const fresh = await freshCandidates(player, viewerToken, repoFullName);
    const seen = new Set(pool.map((quest) => quest.issueNodeId));
    pool = [...pool, ...fresh.filter((quest) => {
      if (seen.has(quest.issueNodeId)) return false;
      const allowed = new Set(worlds.map((repo) => repo.toLowerCase()));
      return allowed.has(quest.repoFullName.toLowerCase());
    })];
  }
  if (!pool.length) return [];

  const aiPicks = await matchQuestsWithAi(
    {
      level: player.level,
      goals: player.goals,
      baseline: player.baseline,
      skills: Array.from(player.skillXp.entries()).map(([name, xp]) => ({ name, level: skillLevel(xp) })),
    },
    pool,
  );

  const used = new Set<string>();
  const recommendations: QuestRecommendation[] = [];

  if (aiPicks?.length) {
    for (const pick of aiPicks) {
      if (used.has(pick.quest.issueNodeId) || used.has(pick.tier)) continue;
      used.add(pick.quest.issueNodeId);
      used.add(pick.tier);
      recommendations.push({
        ...pick,
        reasons: pick.reasons.length ? pick.reasons : buildReasons(player, pick.quest),
        potentialReward: pick.potentialReward ?? potentialReward(player, pick.quest),
      });
    }
  }

  const goalPool = pool.filter((quest) => goalMatches(player, quest).length);
  const targets: Array<{ tier: RecommendationTier; target: number; preferHarder: boolean; preferGoal: boolean }> = [
    { tier: "safe", target: player.baseline, preferHarder: false, preferGoal: false },
    { tier: "levelup", target: player.baseline + 1.5, preferHarder: true, preferGoal: true },
    { tier: "boss", target: Math.min(10, player.baseline + 3.5), preferHarder: true, preferGoal: false },
  ];

  for (const { tier, target, preferHarder, preferGoal } of targets) {
    if (used.has(tier)) continue;
    const quest = (preferGoal ? pick(goalPool, target, used, preferHarder) : undefined) ?? pick(pool, target, used, preferHarder);
    if (!quest) continue;
    used.add(quest.issueNodeId);
    used.add(tier);
    recommendations.push({
      tier,
      tierLabel: TIER_LABELS[tier],
      quest,
      reasons: buildReasons(player, quest),
      potentialReward: potentialReward(player, quest),
    });
  }

  return recommendations.sort((a, b) => {
    const order = { safe: 0, levelup: 1, boss: 2 };
    return order[a.tier] - order[b.tier];
  });
}
