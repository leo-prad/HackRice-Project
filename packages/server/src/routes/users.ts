import { Router } from "express";
import type { PlayerStats, UserAchievement, UserProfile, UserSkill } from "@questline/shared";
import { GROWTH_GOALS, achievementDef, levelProgress, skillCategory, skillLevel } from "@questline/shared";
import { requireAuth } from "../auth/jwt.js";
import { query } from "../db.js";
import { claimsForUser } from "../services/claims.js";
import { buildPlayerProfile } from "../services/profileBuilder.js";

export const usersRouter = Router();
usersRouter.use(requireAuth);

interface UserRow {
  id: number; github_id: string; github_login: string; avatar_url: string | null;
  total_xp: number; created_at: Date; goals_completed_at: Date | null;
  profile_seeded_at: Date | null; profile_json: { summary?: string } | null;
}

async function loadProfile(userId: number): Promise<UserProfile | null> {
  const [userResult, claims, events, skills, achievements, goals] = await Promise.all([
    query<UserRow>(
      "SELECT id,github_id,github_login,avatar_url,total_xp,created_at,goals_completed_at,profile_seeded_at,profile_json FROM users WHERE id=$1",
      [userId],
    ),
    claimsForUser(userId),
    query<{ id: number; delta: number; kind: string; note: string | null; created_at: Date }>(
      "SELECT id,delta,kind,note,created_at FROM xp_events WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20",
      [userId],
    ),
    query<{ skill_name: string; xp: number }>("SELECT skill_name,xp FROM user_skills WHERE user_id=$1 ORDER BY xp DESC", [userId]),
    query<{ code: string; unlocked_at: Date }>("SELECT code,unlocked_at FROM user_achievements WHERE user_id=$1 ORDER BY unlocked_at ASC", [userId]),
    query<{ goal: string }>("SELECT goal FROM user_goals WHERE user_id=$1 ORDER BY id ASC", [userId]),
  ]);
  if (!userResult.rowCount) return null;
  const row = userResult.rows[0];

  const rank = await query<{ rank: string }>(
    "SELECT count(*)::int + 1 AS rank FROM users WHERE total_xp > $1 OR (total_xp = $1 AND created_at < $2)",
    [row.total_xp, row.created_at],
  );

  const completed = claims.filter((claim) => claim.status === "merged");
  const stats: PlayerStats = {
    questsCompleted: completed.length,
    bossesDefeated: completed.filter((claim) => claim.score?.rarity === "mythic").length,
    activeQuests: claims.filter((claim) => claim.status === "claimed" || claim.status === "submitted").length,
    globalRank: Number(rank.rows[0].rank),
  };

  const playerSkills: UserSkill[] = skills.rows.map((skill) => ({
    name: skill.skill_name,
    xp: skill.xp,
    level: skillLevel(skill.xp),
    category: skillCategory(skill.skill_name),
  }));

  const unlocked: UserAchievement[] = achievements.rows.flatMap((entry) => {
    const definition = achievementDef(entry.code);
    return definition
      ? [{ code: definition.code, name: definition.name, description: definition.description, unlockedAt: entry.unlocked_at.toISOString() }]
      : [];
  });

  return {
    user: {
      id: row.id,
      githubId: String(row.github_id),
      githubLogin: row.github_login,
      avatarUrl: row.avatar_url,
      totalXp: row.total_xp,
      goals: goals.rows.map((entry) => entry.goal),
      profileSummary: row.profile_json?.summary ?? null,
      profileSeededAt: row.profile_seeded_at ? row.profile_seeded_at.toISOString() : null,
      createdAt: row.created_at.toISOString(),
    },
    ...levelProgress(row.total_xp),
    claims,
    recentEvents: events.rows.map((event) => ({
      id: event.id,
      delta: event.delta,
      kind: event.kind,
      note: event.note,
      createdAt: event.created_at.toISOString(),
    })),
    skills: playerSkills,
    achievements: unlocked,
    stats,
  };
}

usersRouter.get("/me", async (req, res, next) => {
  try {
    const profile = await loadProfile(req.session!.userId);
    if (!profile) return res.status(404).json({ error: "Player not found" });
    res.json(profile);
  } catch (error) { next(error); }
});

/** Onboarding: save goals, then import GitHub experience into a Gemini-built skill profile. */
usersRouter.put("/me/goals", async (req, res, next) => {
  try {
    const goals: unknown = req.body?.goals;
    if (!Array.isArray(goals) || !goals.length || goals.length > GROWTH_GOALS.length) {
      return res.status(400).json({ error: "Pick between 1 and 8 goals" });
    }
    const allowed = goals.filter((goal): goal is string => typeof goal === "string" && (GROWTH_GOALS as readonly string[]).includes(goal));
    if (!allowed.length) return res.status(400).json({ error: "Unrecognized goals" });

    await query("DELETE FROM user_goals WHERE user_id=$1 AND goal <> ALL($2::text[])", [req.session!.userId, allowed]);
    for (const goal of allowed) {
      await query("INSERT INTO user_goals (user_id,goal) VALUES ($1,$2) ON CONFLICT (user_id,goal) DO NOTHING", [req.session!.userId, goal]);
    }
    await query("UPDATE users SET goals_completed_at = now() WHERE id=$1 AND goals_completed_at IS NULL", [req.session!.userId]);

    const character = await buildPlayerProfile(req.session!.userId, allowed);
    res.json({ goals: allowed, character });
  } catch (error) { next(error); }
});
