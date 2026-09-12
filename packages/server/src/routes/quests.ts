import { Router } from "express";
import { requireAuth } from "../auth/jwt.js";
import { query } from "../db.js";
import { recommendQuests } from "../services/recommend.js";

const multipliers = [0.5, 1, 1.5, 2, 3];
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

export const questsRouter = Router();
questsRouter.use(requireAuth);

/** Existing unused rolls for the current user, so the dashboard can hydrate locked multipliers on load. */
questsRouter.get("/rolls", async (req, res, next) => {
  try {
    const result = await query<{ id: string; issue_node_id: string; risk_multiplier: number }>(
      "SELECT id, issue_node_id, risk_multiplier FROM quest_game_offers WHERE user_id=$1 AND used_at IS NULL",
      [req.session!.userId],
    );
    res.json({
      rolls: result.rows.map((row) => ({
        issueNodeId: row.issue_node_id,
        offerId: String(row.id),
        multiplier: Number(row.risk_multiplier),
        jackpot: Number(row.risk_multiplier) === 3,
      })),
    });
  } catch (error) { next(error); }
});

questsRouter.post("/recommend", async (req, res, next) => {
  try {
    const repoFullName = typeof req.body?.repoFullName === "string" && /^[\w.-]+\/[\w.-]+$/.test(req.body.repoFullName)
      ? req.body.repoFullName
      : undefined;
    const tokenRow = await query<{ github_token: string }>("SELECT github_token FROM users WHERE id=$1", [req.session!.userId]);
    const recommendations = await recommendQuests(req.session!.userId, tokenRow.rows[0]?.github_token, repoFullName);
    res.json({ recommendations });
  } catch (error) { next(error); }
});

/** Rolls a one-time XP multiplier offer for this issue. Locked once rolled — repeat calls return the same result. */
questsRouter.post("/:issueNodeId/risk-roll", async (req, res, next) => {
  try {
    const existing = await query<{ id: string; risk_multiplier: number }>(
      "SELECT id, risk_multiplier FROM quest_game_offers WHERE user_id=$1 AND issue_node_id=$2 AND used_at IS NULL",
      [req.session!.userId, req.params.issueNodeId],
    );
    if (existing.rowCount) {
      const multiplier = Number(existing.rows[0].risk_multiplier);
      return res.json({ offerId: existing.rows[0].id, multiplier, jackpot: multiplier === 3 });
    }
    const multiplier = pick(multipliers);
    const result = await query<{ id: string }>(
      "INSERT INTO quest_game_offers (user_id,issue_node_id,risk_multiplier) VALUES ($1,$2,$3) RETURNING id",
      [req.session!.userId, req.params.issueNodeId, multiplier],
    );
    res.json({ offerId: result.rows[0].id, multiplier, jackpot: multiplier === 3 });
  } catch (error: any) {
    if (error?.code === "23503") return res.status(404).json({ error: "Quest not found" });
    next(error);
  }
});
