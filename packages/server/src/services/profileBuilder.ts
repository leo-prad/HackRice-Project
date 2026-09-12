import { GoogleGenAI } from "@google/genai";
import type { PlayerProfileSeed } from "@questline/shared";
import { GOAL_SKILL_HINTS, skillLevelThreshold } from "@questline/shared";
import { query } from "../db.js";
import { getViewerExperience, type GitHubExperience } from "./github.js";
import { normalizeSkillName } from "./analysis.js";

const SYSTEM_PROMPT = `You build a Questline developer character sheet from a player's GitHub history and growth goals.

Return skills a contributor already shows evidence for, biased toward their stated goals.
Use short canonical skill names ("Python", "TypeScript", "React", "APIs", "SQL", "Testing", "Concurrency", "DevOps", "Documentation").
Levels are 1-8. Be conservative: one repo in a language is level 2-3, many recent projects and stars push higher, never invent expert levels without evidence.
Prefer 4-8 skills. Include at least one skill that advances each selected goal when evidence exists.
Do not return XP, rarity, or quest recommendations.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    skills: {
      type: "array",
      minItems: 2,
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          level: { type: "integer", minimum: 1, maximum: 8 },
        },
        required: ["name", "level"],
        additionalProperties: false,
      },
    },
    strengths: { type: "array", maxItems: 5, items: { type: "string" } },
    growth_focus: { type: "array", maxItems: 5, items: { type: "string" } },
  },
  required: ["summary", "skills", "strengths", "growth_focus"],
  additionalProperties: false,
} as const;

function buildPrompt(goals: string[], experience: GitHubExperience): string {
  const languages = experience.languages.map((entry) => `${entry.name}×${entry.count}`).join(", ") || "none detected";
  const repos = experience.repos
    .slice(0, 15)
    .map((repo) => `- ${repo.fullName} (${repo.language ?? "mixed"}, ${repo.stars}★)${repo.description ? `: ${repo.description.slice(0, 120)}` : ""}`)
    .join("\n");
  return [
    `Player: @${experience.login}`,
    experience.bio ? `Bio: ${experience.bio}` : "",
    `Public repos: ${experience.publicRepos}, followers: ${experience.followers}`,
    `Growth goals: ${goals.join(", ")}`,
    `Language histogram: ${languages}`,
    `Recent repositories:\n${repos || "(none)"}`,
  ].filter(Boolean).join("\n");
}

/** Deterministic seed when Gemini is unavailable so onboarding never leaves an empty skill tree. */
export function heuristicProfile(goals: string[], experience: GitHubExperience): PlayerProfileSeed {
  const skills: Array<{ name: string; level: number }> = [];
  for (const [index, language] of experience.languages.slice(0, 4).entries()) {
    skills.push({ name: language.name, level: Math.min(6, Math.max(2, language.count + 1 - Math.floor(index / 2))) });
  }
  for (const goal of goals) {
    const hint = (GOAL_SKILL_HINTS[goal] ?? [goal.toLowerCase()])[0];
    const name = hint.charAt(0).toUpperCase() + hint.slice(1);
    if (!skills.some((skill) => skill.name.toLowerCase() === name.toLowerCase())) {
      skills.push({ name, level: 2 });
    }
  }
  if (!skills.length) skills.push({ name: "Debugging", level: 2 });
  return {
    summary: `Early-career builder focused on ${goals.slice(0, 2).join(" and ") || "open source"}.`,
    skills: skills.slice(0, 8),
    strengths: experience.languages.slice(0, 3).map((entry) => entry.name),
    growthFocus: goals.slice(0, 3),
    source: "heuristic",
  };
}

async function analyzeProfile(goals: string[], experience: GitHubExperience): Promise<PlayerProfileSeed> {
  if (!process.env.GEMINI_API_KEY) return heuristicProfile(goals, experience);
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.interactions.create({
      model: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
      system_instruction: SYSTEM_PROMPT,
      input: buildPrompt(goals, experience),
      generation_config: { thinking_level: "low" },
      response_format: { type: "text", mime_type: "application/json", schema: RESPONSE_SCHEMA },
    });
    const raw = JSON.parse(response.output_text ?? "{}") as {
      summary?: string;
      skills?: Array<{ name?: string; level?: number }>;
      strengths?: string[];
      growth_focus?: string[];
    };
    const skills = (raw.skills ?? [])
      .filter((skill) => typeof skill?.name === "string" && skill.name.trim())
      .map((skill) => ({
        name: normalizeSkillName(skill.name!),
        level: Math.min(8, Math.max(1, Math.round(skill.level ?? 2))),
      }))
      .filter((skill) => skill.name)
      .slice(0, 8);
    if (skills.length < 2) throw new Error("Profile missing skills");
    return {
      summary: (raw.summary ?? "").trim().slice(0, 280) || heuristicProfile(goals, experience).summary,
      skills,
      strengths: (raw.strengths ?? []).filter((item) => typeof item === "string").map((item) => item.slice(0, 80)).slice(0, 5),
      growthFocus: (raw.growth_focus ?? []).filter((item) => typeof item === "string").map((item) => item.slice(0, 80)).slice(0, 5),
      source: "llm",
    };
  } catch (error) {
    console.warn("Profile builder fell back to heuristic:", error instanceof Error ? error.message : error);
    return heuristicProfile(goals, experience);
  }
}

/**
 * One-time character seed from GitHub experience + goals. Writes skill floors into user_skills
 * without creating xp_events or touching quest XP.
 */
export async function buildPlayerProfile(userId: number, goals: string[]): Promise<PlayerProfileSeed | null> {
  const user = await query<{ github_token: string; profile_seeded_at: Date | null }>(
    "SELECT github_token, profile_seeded_at FROM users WHERE id=$1",
    [userId],
  );
  if (!user.rowCount) return null;
  if (user.rows[0].profile_seeded_at) {
    const existing = await query<{ profile_json: PlayerProfileSeed | null }>("SELECT profile_json FROM users WHERE id=$1", [userId]);
    return existing.rows[0]?.profile_json ?? null;
  }

  let experience: GitHubExperience;
  try {
    experience = await getViewerExperience(user.rows[0].github_token);
  } catch (error) {
    console.warn("Could not load GitHub experience:", error instanceof Error ? error.message : error);
    experience = { login: "player", bio: null, publicRepos: 0, followers: 0, languages: [], repos: [] };
  }

  const profile = await analyzeProfile(goals, experience);

  for (const skill of profile.skills) {
    const xp = skillLevelThreshold(skill.level);
    await query(
      `INSERT INTO user_skills (user_id, skill_name, xp)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, skill_name) DO UPDATE
         SET xp = EXCLUDED.xp, updated_at = now()
         WHERE user_skills.xp = 0`,
      [userId, skill.name, xp],
    );
  }

  await query(
    "UPDATE users SET profile_json=$1, profile_seeded_at=now() WHERE id=$2 AND profile_seeded_at IS NULL",
    [JSON.stringify(profile), userId],
  );
  return profile;
}
