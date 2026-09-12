import { Router } from "express";
import { levelProgress } from "@questline/shared";
import { requireAuth } from "../auth/jwt.js";
import { query } from "../db.js";

export const usersRouter = Router();
usersRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const [userResult, claims, events] = await Promise.all([
      query("SELECT id,github_id,github_login,avatar_url,total_xp,created_at FROM users WHERE id=$1", [req.session!.userId]),
      query(`SELECT c.*,s.title,s.xp,s.repo_full_name,s.issue_number,s.issue_url,s.days_open FROM claims c JOIN issue_scores s ON s.issue_node_id=c.issue_node_id WHERE c.user_id=$1 ORDER BY c.claimed_at DESC`, [req.session!.userId]),
      query("SELECT id,delta,kind,note,created_at FROM xp_events WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20", [req.session!.userId]),
    ]);
    if (!userResult.rowCount) return res.status(404).json({ error: "User not found" });
    const row = userResult.rows[0];
    const user = { id: row.id, githubId: String(row.github_id), githubLogin: row.github_login, avatarUrl: row.avatar_url, totalXp: row.total_xp, createdAt: row.created_at };
    res.json({ user, ...levelProgress(row.total_xp), claims: claims.rows, recentEvents: events.rows });
  } catch (error) { next(error); }
});
