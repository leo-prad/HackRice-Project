import { Router } from "express";
import { requireAuth } from "../auth/jwt.js";
import { query } from "../db.js";
import { recommendQuests } from "../services/recommend.js";

export const questsRouter = Router();
questsRouter.use(requireAuth);

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
