import { Router } from "express";
import { requireAuth } from "../auth/jwt.js";
import { query } from "../db.js";
import { getPull, getPullReviews, parsePullUrl } from "../services/github.js";
import { awardMergedClaim, awardSubmittedClaim, markClaimClosed } from "../services/xp.js";
import { refreshSubmittedClaimsForUser } from "../services/claimRefresh.js";

export const claimsRouter = Router();
claimsRouter.use(requireAuth);

claimsRouter.post("/", async (req, res, next) => {
  try {
    if (typeof req.body?.issueNodeId !== "string") return res.status(400).json({ error: "issueNodeId is required" });
    const prior = await query("SELECT * FROM claims WHERE user_id=$1 AND issue_node_id=$2", [req.session!.userId, req.body.issueNodeId]);
    // A closed PR (or an abandoned claim) leaves nothing on the user's XP
    // ledger, so re-claiming is safe and can't be used to farm points.
    const reopenable = new Set(["abandoned", "closed"]);
    if (prior.rowCount && !reopenable.has(prior.rows[0].status)) return res.status(409).json({ error: "You already have an active claim" });
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

claimsRouter.post("/:id/refresh", async (req, res, next) => {
  try {
    const claimRow = await query("SELECT c.*, s.repo_owner_id FROM claims c JOIN issue_scores s ON s.issue_node_id=c.issue_node_id WHERE c.id=$1 AND c.user_id=$2",
      [req.params.id, req.session!.userId]);
    if (!claimRow.rowCount) return res.status(404).json({ error: "Claim not found" });
    const claim = claimRow.rows[0];
    if (claim.status !== "submitted" || !claim.pr_url) return res.json({ claim, xpAwarded: 0 });
    const tokenRow = await query<{ github_token: string }>("SELECT github_token FROM users WHERE id=$1", [req.session!.userId]);
    const parsed = parsePullUrl(claim.pr_url);
    try {
      const pull = await getPull(parsed.owner, parsed.repo, parsed.number, tokenRow.rows[0].github_token);
      if (pull.merged) {
        const result = await awardMergedClaim(Number(claim.id), req.session!.userId);
        return res.json(result);
      }
      if (pull.state === "closed") {
        const updated = await markClaimClosed(Number(claim.id), req.session!.userId);
        return res.json({ claim: updated, xpAwarded: 0 });
      }
      const reviews = await getPullReviews(parsed.owner, parsed.repo, parsed.number, tokenRow.rows[0].github_token).catch(() => []);
      if (reviews.some((r) => r.state === "APPROVED")) {
        const result = await awardMergedClaim(Number(claim.id), req.session!.userId);
        return res.json(result);
      }
      return res.json({ claim, xpAwarded: 0 });
    } catch (error) {
      if (error instanceof Error && /GitHub 404/.test(error.message)) {
        const updated = await markClaimClosed(Number(claim.id), req.session!.userId);
        return res.json({ claim: updated, xpAwarded: 0 });
      }
      return res.json({ claim, xpAwarded: 0 });
    }
  } catch (error) { next(error); }
});

// Convenience: sweep all of the caller's submitted claims. Used by /users/me for
// opportunistic polling.
claimsRouter.post("/refresh-mine", async (req, res, next) => {
  try {
    const result = await refreshSubmittedClaimsForUser(req.session!.userId);
    res.json(result);
  } catch (error) { next(error); }
});
