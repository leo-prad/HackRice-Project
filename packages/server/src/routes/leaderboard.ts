import { Router } from "express";
import { levelProgress } from "@questline/shared";
import { query } from "../db.js";

export const leaderboardRouter = Router();
leaderboardRouter.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const result = await query("SELECT github_login,avatar_url,total_xp FROM users ORDER BY total_xp DESC,created_at ASC LIMIT $1", [limit]);
    res.json({ entries: result.rows.map((row, index) => ({ rank: index + 1, login: row.github_login, avatarUrl: row.avatar_url, totalXp: row.total_xp, level: levelProgress(row.total_xp).level })) });
  } catch (error) { next(error); }
});
