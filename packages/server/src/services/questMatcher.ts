import type { IssueScore, QuestRecommendation, RecommendationTier } from "@questline/shared";
import { GoogleGenAI } from "@google/genai";

const TIER_LABELS: Record<RecommendationTier, string> = {
  safe: "SAFE BET",
  levelup: "LEVEL-UP QUEST",
  boss: "STRETCH QUEST",
};

const SYSTEM_PROMPT = `You are the GitQuest AI Quest Matcher.

Given a developer profile and a list of already-scored open-source quests, pick exactly three:
- safe: near their current ability (comfortable stretch)
- levelup: slightly harder, ideally advances a stated growth goal
- boss: significantly harder challenge

Only choose quest_key values from the provided candidate list. Never invent issues.
Reasons should be short, concrete, and mention skills or goals. potential_reward is optional (e.g. "Testing LVL 3 → 4").
Do not change XP, difficulty, or rarity.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    picks: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          tier: { type: "string", enum: ["safe", "levelup", "boss"] },
          quest_key: { type: "string" },
          reasons: { type: "array", items: { type: "string" }, maxItems: 4 },
          potential_reward: { type: "string" },
        },
        required: ["tier", "quest_key", "reasons"],
        additionalProperties: false,
      },
    },
  },
  required: ["picks"],
  additionalProperties: false,
} as const;

export interface MatcherPlayer {
  level: number;
  goals: string[];
  skills: Array<{ name: string; level: number }>;
  baseline: number;
}

function compactCandidates(pool: IssueScore[]) {
  return pool.slice(0, 12).map((quest) => ({
    quest_key: quest.questKey,
    title: quest.title,
    difficulty: quest.difficulty,
    rarity: quest.rarity,
    xp: quest.xp,
    skills: quest.skills.map((skill) => `${skill.name} L${skill.requiredLevel}`),
    objectives: quest.analysis?.objectives?.slice(0, 3) ?? [],
  }));
}

/**
 * Ask Gemini to choose Safe / Level-up / Boss from an existing scored pool.
 * Returns null when the model is unavailable or returns invalid keys so callers can fall back.
 */
export async function matchQuestsWithAi(
  player: MatcherPlayer,
  pool: IssueScore[],
): Promise<QuestRecommendation[] | null> {
  if (!process.env.GEMINI_API_KEY || pool.length < 1) return null;

  const byKey = new Map(pool.map((quest) => [quest.questKey, quest]));
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.interactions.create({
      model: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
      system_instruction: SYSTEM_PROMPT,
      input: JSON.stringify({
        player: {
          overall_level: player.level,
          difficulty_baseline: player.baseline,
          goals: player.goals,
          skills: player.skills,
        },
        candidates: compactCandidates(pool),
      }),
      generation_config: { thinking_level: "low" },
      response_format: { type: "text", mime_type: "application/json", schema: RESPONSE_SCHEMA },
    });

    const raw = JSON.parse(response.output_text ?? "{}") as {
      picks?: Array<{ tier?: string; quest_key?: string; reasons?: string[]; potential_reward?: string }>;
    };

    const used = new Set<string>();
    const recommendations: QuestRecommendation[] = [];
    for (const pick of raw.picks ?? []) {
      const tier = pick.tier as RecommendationTier | undefined;
      if (!tier || !TIER_LABELS[tier] || !pick.quest_key) continue;
      if (used.has(tier) || used.has(pick.quest_key)) continue;
      const quest = byKey.get(pick.quest_key);
      if (!quest) continue;
      used.add(tier);
      used.add(pick.quest_key);
      recommendations.push({
        tier,
        tierLabel: TIER_LABELS[tier],
        quest,
        reasons: (pick.reasons ?? []).filter((reason) => typeof reason === "string").map((reason) => reason.slice(0, 140)).slice(0, 4),
        potentialReward: pick.potential_reward?.slice(0, 120) ?? null,
      });
    }

    return recommendations.length ? recommendations : null;
  } catch (error) {
    console.warn("AI quest matcher failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

export { TIER_LABELS };
