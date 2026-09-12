/** Bumped whenever the difficulty weights or XP formula change; stored on every quest. */
export const SCORING_VERSION = 2;

export const MAX_QUEST_XP = 1000;

export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export const RARITY_TIERS: ReadonlyArray<{ rarity: Rarity; minXp: number; label: string }> = [
  { rarity: "common", minXp: 0, label: "COMMON" },
  { rarity: "rare", minXp: 250, label: "RARE" },
  { rarity: "epic", minXp: 450, label: "EPIC" },
  { rarity: "legendary", minXp: 650, label: "LEGENDARY" },
  { rarity: "mythic", minXp: 850, label: "BOSS" },
];

export const rarityForXp = (xp: number): Rarity =>
  [...RARITY_TIERS].reverse().find((tier) => xp >= tier.minXp)?.rarity ?? "common";

export const rarityLabel = (rarity: Rarity): string =>
  RARITY_TIERS.find((tier) => tier.rarity === rarity)?.label ?? "COMMON";

export const isBossRarity = (rarity: Rarity) => rarity === "mythic";

/** The five 0-10 axes the LLM scores. It never returns XP. */
export interface QuestAnalysis {
  technicalComplexity: number;
  scope: number;
  codebaseContext: number;
  verificationDifficulty: number;
  ambiguity: number;
  objectives: string[];
  reasoningSummary: string;
}

export const DIFFICULTY_WEIGHTS = {
  technicalComplexity: 0.35,
  scope: 0.2,
  codebaseContext: 0.2,
  verificationDifficulty: 0.15,
  ambiguity: 0.1,
} as const;

export function computeDifficulty(analysis: QuestAnalysis): number {
  const clamp = (value: number) => Math.min(10, Math.max(0, Number.isFinite(value) ? value : 0));
  const raw =
    DIFFICULTY_WEIGHTS.technicalComplexity * clamp(analysis.technicalComplexity) +
    DIFFICULTY_WEIGHTS.scope * clamp(analysis.scope) +
    DIFFICULTY_WEIGHTS.codebaseContext * clamp(analysis.codebaseContext) +
    DIFFICULTY_WEIGHTS.verificationDifficulty * clamp(analysis.verificationDifficulty) +
    DIFFICULTY_WEIGHTS.ambiguity * clamp(analysis.ambiguity);
  return Math.round(raw * 100) / 100;
}

export const xpFromDifficulty = (difficulty: number): number =>
  Math.min(MAX_QUEST_XP, Math.max(1, Math.round(difficulty * 100)));

export interface QuestSkill {
  name: string;
  requiredLevel: number;
  weight: number;
  xpReward: number;
}

export interface AnalyzedSkill {
  name: string;
  requiredLevel: number;
  weight: number;
}

/** Splits quest XP across skills by weight; the remainder lands on the last skill so the parts always sum to the whole. */
export function allocateSkillXp(questXp: number, skills: AnalyzedSkill[]): QuestSkill[] {
  if (!skills.length) return [];
  const totalWeight = skills.reduce((sum, skill) => sum + Math.max(0, skill.weight), 0);
  const normalized = skills.map((skill) => (totalWeight > 0 ? Math.max(0, skill.weight) / totalWeight : 1 / skills.length));
  let assigned = 0;
  return skills.map((skill, index) => {
    const isLast = index === skills.length - 1;
    const xpReward = isLast ? questXp - assigned : Math.round(questXp * normalized[index]);
    assigned += xpReward;
    return {
      name: skill.name,
      requiredLevel: Math.min(10, Math.max(1, Math.round(skill.requiredLevel))),
      weight: Math.round(normalized[index] * 1000) / 1000,
      xpReward: Math.max(0, xpReward),
    };
  });
}

export interface User {
  id: number;
  githubId: string;
  githubLogin: string;
  avatarUrl: string | null;
  totalXp: number;
  goals?: string[];
  profileSummary?: string | null;
  profileSeededAt?: string | null;
  createdAt?: string;
}

/** Gemini-built character sheet from GitHub experience + goals (no quest XP). */
export interface PlayerProfileSeed {
  summary: string;
  skills: Array<{ name: string; level: number }>;
  strengths: string[];
  growthFocus: string[];
  source: "llm" | "heuristic";
}

export interface IssueScore {
  issueNodeId: string;
  issueUrl: string;
  questKey: string;
  repoFullName: string;
  repoOwnerId: string;
  issueNumber: number;
  title: string;
  xp: number;
  difficulty: number;
  rarity: Rarity;
  scoringVersion: number;
  daysOpen: number;
  scoredAt: string;
  analysis: QuestAnalysis | null;
  skills: QuestSkill[];
}

/** Product language: an issue score is a Quest. */
export type Quest = IssueScore;

export type ClaimStatus = "claimed" | "submitted" | "merged" | "abandoned" | "closed";

export interface Claim {
  id: number;
  userId: number;
  issueNodeId: string;
  status: ClaimStatus;
  prUrl: string | null;
  prNumber: number | null;
  prRepo: string | null;
  xpAwarded: number;
  claimedAt: string;
  submittedAt: string | null;
  mergedAt: string | null;
  score?: IssueScore;
}

export interface XpEvent {
  id: number;
  delta: number;
  kind: string;
  note: string | null;
  createdAt: string;
}

export interface XpTimelinePoint {
  bucket: string;
  xpEarned: number;
  awardCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  login: string;
  avatarUrl: string | null;
  totalXp: number;
  level: number;
  questsCompleted: number;
}

export interface UserSkill {
  name: string;
  xp: number;
  level: number;
  category: SkillCategory;
}

export interface UserAchievement {
  code: string;
  name: string;
  description: string;
  unlockedAt: string;
}

export interface PlayerStats {
  questsCompleted: number;
  bossesDefeated: number;
  activeQuests: number;
  globalRank: number | null;
}

export interface UserProfile {
  user: User;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  claims: Claim[];
  recentEvents: XpEvent[];
  skills: UserSkill[];
  achievements: UserAchievement[];
  stats: PlayerStats;
}

/** Everything the Quest Complete screen needs, computed server-side at award time. */
export interface QuestCompletion {
  questKey: string;
  questTitle: string;
  rarity: Rarity;
  xpAwarded: number;
  totalXp: number;
  levelBefore: number;
  levelAfter: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  skillUps: Array<{ name: string; xpAwarded: number; levelBefore: number; levelAfter: number }>;
  achievements: UserAchievement[];
  rankBefore: number | null;
  rankAfter: number | null;
}

export type RecommendationTier = "safe" | "levelup" | "boss";

export interface QuestRecommendation {
  tier: RecommendationTier;
  tierLabel: string;
  quest: IssueScore;
  reasons: string[];
  potentialReward: string | null;
}

/** Overall level curve: 0, 500, 1200, 2100, 3200, 4500 ... gaps widen by 200 XP per level. */
export const levelThreshold = (level: number): number => {
  const n = Math.max(1, Math.floor(level));
  return 500 * (n - 1) + 100 * (n - 1) * (n - 2);
};

export function levelProgress(totalXp: number) {
  let level = 1;
  while (levelThreshold(level + 1) <= totalXp) level += 1;
  const floor = levelThreshold(level);
  const ceiling = levelThreshold(level + 1);
  return { level, xpIntoLevel: totalXp - floor, xpForNextLevel: ceiling - floor };
}

/** Skill curve: 0, 200, 500, 900, 1400, 2000 ... a single good quest moves a skill one level early on. */
export const skillLevelThreshold = (level: number): number => {
  const n = Math.max(1, Math.floor(level));
  return 200 * (n - 1) + 50 * (n - 1) * (n - 2);
};

export function skillLevel(skillXp: number): number {
  let level = 1;
  while (skillLevelThreshold(level + 1) <= skillXp) level += 1;
  return level;
}

export function skillProgress(skillXp: number) {
  const level = skillLevel(skillXp);
  const floor = skillLevelThreshold(level);
  const ceiling = skillLevelThreshold(level + 1);
  return { level, xpIntoLevel: skillXp - floor, xpForNextLevel: ceiling - floor };
}

const ROMAN: ReadonlyArray<[number, string]> = [
  [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

export function roman(value: number): string {
  let remaining = Math.max(0, Math.floor(value));
  let out = "";
  for (const [amount, numeral] of ROMAN) {
    while (remaining >= amount) {
      out += numeral;
      remaining -= amount;
    }
  }
  return out || "0";
}

export type SkillCategory = "Backend" | "Frontend" | "Systems" | "Data" | "Practices" | "Other";

const SKILL_CATEGORIES: ReadonlyArray<[SkillCategory, RegExp]> = [
  ["Frontend", /^(react|vue|svelte|angular|css|html|tailwind|ui|ux|accessibility|a11y|frontend|dom|browser|next\.?js)/i],
  ["Backend", /^(python|node|express|fastapi|django|flask|rails|api|apis|rest|graphql|backend|auth|authentication|java|go|golang|ruby|php|c#|\.net|spring)/i],
  ["Systems", /^(concurrency|threading|async|networking|memory|performance|c\+\+|c$|rust|kernel|compiler|systems|distributed|caching|cache|os|linux)/i],
  ["Data", /^(sql|database|databases|postgres|postgresql|mysql|sqlite|mongo|redis|data|etl|pandas|numpy|machine learning|ml|ai|pytorch|tensorflow)/i],
  ["Practices", /^(testing|tests|documentation|docs|ci|cd|devops|docker|kubernetes|build|tooling|refactoring|debugging|git|typescript|javascript)/i],
];

export function skillCategory(name: string): SkillCategory {
  const trimmed = name.trim();
  for (const [category, pattern] of SKILL_CATEGORIES) if (pattern.test(trimmed)) return category;
  return "Other";
}

const LANGUAGE_SKILLS = new Set([
  "python", "javascript", "typescript", "java", "go", "golang", "rust", "c", "c++", "c#", "ruby", "php",
  "swift", "kotlin", "scala", "elixir", "erlang", "haskell", "dart", "objective-c", "perl", "lua", "r",
  "shell", "bash", "sql", "html", "css", "zig", "ocaml", "clojure",
]);

export const isLanguageSkill = (name: string) => LANGUAGE_SKILLS.has(name.trim().toLowerCase());

export const GROWTH_GOALS = [
  "Frontend",
  "Backend",
  "Python",
  "TypeScript",
  "Systems",
  "Databases",
  "Machine Learning",
  "DevOps",
] as const;

export type GrowthGoal = (typeof GROWTH_GOALS)[number];

/** Goals map to the skill names the analyzer tends to emit, so recommendations can match on them. */
export const GOAL_SKILL_HINTS: Record<string, string[]> = {
  Frontend: ["react", "css", "html", "typescript", "javascript", "ui", "accessibility", "frontend"],
  Backend: ["api", "apis", "python", "node", "express", "backend", "auth", "rest", "graphql"],
  Python: ["python", "pytest", "django", "flask", "fastapi"],
  TypeScript: ["typescript", "javascript", "node", "types"],
  Systems: ["concurrency", "networking", "memory", "performance", "rust", "c++", "caching", "distributed"],
  Databases: ["sql", "database", "databases", "postgres", "mysql", "redis", "migrations"],
  "Machine Learning": ["machine learning", "ml", "pytorch", "tensorflow", "numpy", "pandas", "data"],
  DevOps: ["docker", "kubernetes", "ci", "cd", "devops", "build", "tooling"],
};

export type AchievementCode = "first_blood" | "open_source_hero" | "boss_slayer" | "polyglot" | "speedrunner";

export interface AchievementDef {
  code: AchievementCode;
  name: string;
  description: string;
}

export const ACHIEVEMENTS: ReadonlyArray<AchievementDef> = [
  { code: "first_blood", name: "First Blood", description: "Complete your first quest." },
  { code: "open_source_hero", name: "Open Source Hero", description: "Complete 10 quests." },
  { code: "boss_slayer", name: "Boss Slayer", description: "Defeat a Boss quest." },
  { code: "polyglot", name: "Polyglot", description: "Complete quests across 3 different languages." },
  { code: "speedrunner", name: "Speedrunner", description: "Complete a quest within a day of claiming it." },
];

export const achievementDef = (code: string) => ACHIEVEMENTS.find((entry) => entry.code === code);
