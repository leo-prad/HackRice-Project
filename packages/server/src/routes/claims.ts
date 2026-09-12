import { Router } from "express";
import { requireAuth } from "../auth/jwt.js";
import { query } from "../db.js";
import { claimsForUser, toClaim, type ClaimRow } from "../services/claims.js";
import { refreshSubmittedClaimsForUser } from "../services/claimRefresh.js";
import { getPull, parsePullUrl, pullReferencesIssue } from "../services/github.js";
import { getQuest } from "../services/scoring.js";
import { refreshClaim } from "../services/verification.js";

export const claimsRouter = Router();
claimsRouter.use(requireAuth);

claimsRouter.post("/", async (req, res, next) => {
  try {
    if (typeof req.body?.issueNodeId !== "string") return res.status(400).json({ error: "issueNodeId is required" });
    const prior = await query<ClaimRow>("SELECT * FROM claims WHERE user_id=$1 AND issue_node_id=$2", [req.session!.userId, req.body.issueNodeId]);
    // Closed PRs leave no XP on the ledger, so re-claiming is safe.
    const reopenable = new Set(["abandoned", "closed"]);
    if (prior.rowCount && !reopenable.has(prior.rows[0].status)) {
      return res.status(409).json({ error: "You already have an active claim" });
    }
    const offerId = typeof req.body?.offerId === "string" ? req.body.offerId : null;
    const offer = offerId ? await query<{ risk_multiplier: number | null }>(
      "UPDATE quest_game_offers SET used_at=now() WHERE id=$1 AND user_id=$2 AND issue_node_id=$3 AND used_at IS NULL RETURNING risk_multiplier",
      [offerId, req.session!.userId, req.body.issueNodeId],
    ) : null;
    if (offerId && !offer?.rowCount) return res.status(409).json({ error: "That game offer is no longer available" });
    const multiplier = Number(offer?.rows[0]?.risk_multiplier ?? 1);
    const result = prior.rowCount
      ? await query<ClaimRow>("UPDATE claims SET status='claimed',pr_url=NULL,pr_number=NULL,pr_repo=NULL,xp_awarded=0,claimed_at=now(),submitted_at=NULL,merged_at=NULL,completion_json=NULL,risk_multiplier=$2 WHERE id=$1 RETURNING *", [prior.rows[0].id, multiplier])
      : await query<ClaimRow>("INSERT INTO claims (user_id,issue_node_id,risk_multiplier) VALUES ($1,$2,$3) RETURNING *", [req.session!.userId, req.body.issueNodeId, multiplier]);
    const score = await getQuest(req.body.issueNodeId);
    res.status(201).json({ claim: toClaim(result.rows[0], score ?? undefined) });
  } catch (error: any) {
    if (error?.code === "23503") return res.status(404).json({ error: "Quest not found" });
    next(error);
  }
});

/** Links a PR. Author + issue reference required; XP waits for approval/merge. */
claimsRouter.post("/:id/submit", async (req, res, next) => {
  try {
    if (typeof req.body?.prUrl !== "string") return res.status(400).json({ error: "prUrl is required" });
    const parsed = parsePullUrl(req.body.prUrl);
    const claim = await query<ClaimRow & { issue_url: string; github_token: string }>(
      `SELECT c.*, s.issue_url, u.github_token FROM claims c
       JOIN issue_scores s ON s.issue_node_id=c.issue_node_id JOIN users u ON u.id=c.user_id
       WHERE c.id=$1 AND c.user_id=$2`,
      [req.params.id, req.session!.userId],
    );
    if (!claim.rowCount) return res.status(404).json({ error: "Claim not found" });
    if (claim.rows[0].status === "merged") return res.status(409).json({ error: "This quest is already complete" });
    if (claim.rows[0].status === "submitted") {
      return res.json(await refreshClaim(Number(req.params.id), req.session!.userId));
    }

    const pull = await getPull(parsed.owner, parsed.repo, parsed.number, claim.rows[0].github_token);
    if (String(pull.user.id) !== req.session!.githubId) {
      return res.status(403).json({ error: "The PR author must match your GitHub account" });
    }

    const issue = new URL(claim.rows[0].issue_url).pathname.match(/^\/([^/]+)\/([^/]+)\/issues\/(\d+)$/);
    if (issue && !pullReferencesIssue(pull, issue[1], issue[2], Number(issue[3]))) {
      return res.status(422).json({ error: `The pull request must reference the quest issue. Add "Closes #${issue[3]}" to the PR description.` });
    }

    await query(
      "UPDATE claims SET status='submitted',pr_url=$1,pr_repo=$2,pr_number=$3,submitted_at=now() WHERE id=$4",
      [parsed.canonical, `${parsed.owner}/${parsed.repo}`, parsed.number, req.params.id],
    );

    await query(
      "INSERT INTO xp_events (user_id, claim_id, issue_node_id, delta, kind, note) VALUES ($1,$2,$3,0,'claim_submitted',$4)",
      [req.session!.userId, req.params.id, claim.rows[0].issue_node_id, "PR submitted — awaiting maintainer approval"],
    );

    // Settle immediately if the PR is already approved or merged; otherwise park as pending.
    res.json(await refreshClaim(Number(req.params.id), req.session!.userId));
  } catch (error) { next(error); }
});

claimsRouter.post("/:id/abandon", async (req, res, next) => {
  try {
    const result = await query<ClaimRow>(
      "UPDATE claims SET status='abandoned' WHERE id=$1 AND user_id=$2 AND status IN ('claimed','submitted') RETURNING *",
      [req.params.id, req.session!.userId],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Active claim not found" });
    res.json({ claim: toClaim(result.rows[0]) });
  } catch (error) { next(error); }
});

claimsRouter.post("/:id/double", async (req, res, next) => {
  try {
    const choice = req.body?.choice === "risk" ? "risk" : req.body?.choice === "take" ? "take" : null;
    if (!choice) return res.status(400).json({ error: "Choose take or risk" });
    const result = await query<ClaimRow & { user_id: number }>(
      `SELECT * FROM claims WHERE id=$1 AND user_id=$2 AND status='merged' AND double_choice IS NULL`,
      [req.params.id, req.session!.userId],
    );
    if (!result.rowCount) return res.status(409).json({ error: "This reward has already been settled" });
    const claim = result.rows[0];
    const won = choice === "risk" && Math.random() < 0.5;
    const bonus = won ? claim.xp_awarded : 0;
    const settled = await query<ClaimRow>("UPDATE claims SET double_choice=$1,double_won=$2,double_bonus_awarded=$3 WHERE id=$4 AND double_choice IS NULL RETURNING *", [choice, won, bonus, claim.id]);
    if (!settled.rowCount) return res.status(409).json({ error: "This reward has already been settled" });
    if (bonus) {
      await query("INSERT INTO xp_events (user_id,claim_id,issue_node_id,delta,kind,note) VALUES ($1,$2,$3,$4,'double_bonus','Double or Nothing jackpot')", [claim.user_id, claim.id, claim.issue_node_id, bonus]);
      await query("UPDATE users SET total_xp=total_xp+$1,last_active_at=now() WHERE id=$2", [bonus, claim.user_id]);
    }
    res.json({ claim: toClaim(settled.rows[0]), won, bonus });
  } catch (error) { next(error); }
});

claimsRouter.get("/mine", async (req, res, next) => {
  try {
    res.json({ claims: await claimsForUser(req.session!.userId) });
  } catch (error) { next(error); }
});

claimsRouter.post("/:id/refresh", async (req, res, next) => {
  try {
    res.json(await refreshClaim(Number(req.params.id), req.session!.userId));
  } catch (error) { next(error); }
});

claimsRouter.post("/refresh-mine", async (req, res, next) => {
  try {
    const result = await refreshSubmittedClaimsForUser(req.session!.userId);
    res.json(result);
  } catch (error) { next(error); }
});

claimsRouter.get("/latest-completion", async (req, res, next) => {
  try {
    const result = await query<{ completion_json: ClaimRow["completion_json"] }>(
      "SELECT completion_json FROM claims WHERE user_id=$1 AND completion_json IS NOT NULL ORDER BY merged_at DESC LIMIT 1",
      [req.session!.userId],
    );
    res.json({ completion: result.rows[0]?.completion_json ?? null });
  } catch (error) { next(error); }
});
