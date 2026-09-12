import type { IssueScore, QuestRecommendation } from "@gitventure/shared";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `You are the GitVenture AI Quest Matcher.

Given a developer profile and already-scored open-source quests, pick exactly three distinct quests that fit the player.
Rank them by how well they match the player's difficulty baseline and goals — do NOT label them as safe, level-up, or stretch.
Prefer a spread of difficulty when possible so the player sees varied XP bounties.

Only choose quest_key values from the provided candidate list. Never invent issues.
Reasons should be short, concrete, and mention skills, difficulty, or XP. potential_reward is optional (e.g. "Testing LVL 3 → 4").
Do not change XP or difficulty.`;

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
          quest_key: { type: "string" },
          reasons: { type: "array", items: { type: "string" }, maxItems: 4 },
          potential_reward: { type: "string" },
        },
        required: ["quest_key", "reasons"],
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
    xp: quest.xp,
    skills: quest.skills.map((skill) => `${skill.name} L${skill.requiredLevel}`),
    objectives: quest.analysis?.objectives?.slice(0, 3) ?? [],
  }));
}

/**
 * Ask Gemini to pick three scored quests for the player (XP + difficulty only — no tier labels).
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
      picks?: Array<{ quest_key?: string; reasons?: string[]; potential_reward?: string }>;
    };

    const used = new Set<string>();
    const recommendations: QuestRecommendation[] = [];
    for (const pick of raw.picks ?? []) {
      if (!pick.quest_key || used.has(pick.quest_key)) continue;
      const quest = byKey.get(pick.quest_key);
      if (!quest) continue;
      used.add(pick.quest_key);
      recommendations.push({
        quest,
        reasons: (pick.reasons ?? [])
          .filter((reason) => typeof reason === "string")
          .map((reason) => reason.slice(0, 140))
          .slice(0, 4),
        potentialReward: pick.potential_reward?.slice(0, 120) ?? null,
      });
    }

    return recommendations.length ? recommendations : null;
  } catch (error) {
    console.warn("AI quest matcher failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
