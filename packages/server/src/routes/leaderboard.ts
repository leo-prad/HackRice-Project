import { Router } from "express";
import { levelProgress } from "@gitventure/shared";
import { query } from "../db.js";

export const leaderboardRouter = Router();
leaderboardRouter.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const result = await query<{ github_login: string; avatar_url: string | null; total_xp: number; quests_completed: string }>(
      `SELECT u.github_login, u.avatar_url, u.total_xp,
              count(c.id) FILTER (WHERE c.status = 'merged')::int AS quests_completed
       FROM users u LEFT JOIN claims c ON c.user_id = u.id
       GROUP BY u.id, u.github_login, u.avatar_url, u.total_xp, u.created_at
       ORDER BY u.total_xp DESC, u.created_at ASC LIMIT $1`,
      [limit],
    );
    res.json({
      entries: result.rows.map((row, index) => ({
        rank: index + 1,
        login: row.github_login,
        avatarUrl: row.avatar_url,
        totalXp: row.total_xp,
        level: levelProgress(row.total_xp).level,
        questsCompleted: Number(row.quests_completed),
      })),
    });
  } catch (error) { next(error); }
});
