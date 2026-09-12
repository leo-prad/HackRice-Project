import { Router } from "express";
import { requireAuth } from "../auth/jwt.js";
import { query } from "../db.js";
import { getPull, parsePullUrl } from "../services/github.js";
import { awardSubmittedClaim } from "../services/xp.js";

export const claimsRouter = Router();
claimsRouter.use(requireAuth);

claimsRouter.post("/", async (req, res, next) => {
  try {
    if (typeof req.body?.issueNodeId !== "string") return res.status(400).json({ error: "issueNodeId is required" });
    const prior = await query("SELECT * FROM claims WHERE user_id=$1 AND issue_node_id=$2", [req.session!.userId, req.body.issueNodeId]);
    if (prior.rowCount && prior.rows[0].status !== "abandoned") return res.status(409).json({ error: "You already have an active claim" });
    const result = prior.rowCount
      ? await query("UPDATE claims SET status='claimed',pr_url=NULL,pr_number=NULL,pr_repo=NULL,xp_awarded=0,claimed_at=now(),submitted_at=NULL,merged_at=NULL WHERE id=$1 RETURNING *", [prior.rows[0].id])
      : await query("INSERT INTO claims (user_id,issue_node_id) VALUES ($1,$2) RETURNING *", [req.session!.userId, req.body.issueNodeId]);
    res.status(201).json({ claim: result.rows[0] });
  } catch (error: any) {
    if (error?.code === "23503") return res.status(404).json({ error: "Issue score not found" });
    next(error);
  }
});

claimsRouter.post("/:id/submit", async (req, res, next) => {
  try {
    if (typeof req.body?.prUrl !== "string") return res.status(400).json({ error: "prUrl is required" });
    const parsed = parsePullUrl(req.body.prUrl);
    const tokenRow = await query<{ github_token: string }>("SELECT github_token FROM users WHERE id=$1", [req.session!.userId]);
    const pull = await getPull(parsed.owner, parsed.repo, parsed.number, tokenRow.rows[0].github_token);
    if (String(pull.user.id) !== req.session!.githubId) return res.status(403).json({ error: "The PR author must match your GitHub account" });
    const result = await awardSubmittedClaim(Number(req.params.id), req.session!.userId, parsed.canonical, `${parsed.owner}/${parsed.repo}`, parsed.number);
    res.json(result);
  } catch (error) { next(error); }
});

claimsRouter.post("/:id/abandon", async (req, res, next) => {
  try {
    const result = await query("UPDATE claims SET status='abandoned' WHERE id=$1 AND user_id=$2 AND status='claimed' RETURNING *", [req.params.id, req.session!.userId]);
    if (!result.rowCount) return res.status(404).json({ error: "Active claim not found" });
    res.json({ claim: result.rows[0] });
  } catch (error) { next(error); }
});

claimsRouter.get("/mine", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*,s.title,s.xp,s.repo_full_name,s.issue_number,s.issue_url,s.days_open
       FROM claims c JOIN issue_scores s ON s.issue_node_id=c.issue_node_id
       WHERE c.user_id=$1 ORDER BY c.claimed_at DESC`, [req.session!.userId]);
    res.json({ claims: result.rows });
  } catch (error) { next(error); }
});
