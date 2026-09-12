import { Router, type Request } from "express";
import jwt from "jsonwebtoken";
import type { SessionPayload } from "../auth/jwt.js";
import { query } from "../db.js";
import { toClaim, type ClaimRow } from "../services/claims.js";
import { getQuest, scoreIssues } from "../services/scoring.js";

export const issuesRouter = Router();

async function viewerSession(req: Request): Promise<SessionPayload | undefined> {
  const auth = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!auth || !process.env.JWT_SECRET) return undefined;
  try {
    return jwt.verify(auth, process.env.JWT_SECRET) as SessionPayload;
  } catch {
    return undefined;
  }
}

async function viewerGithubToken(req: Request) {
  const session = await viewerSession(req);
  if (!session) return undefined;
  const result = await query<{ github_token: string }>("SELECT github_token FROM users WHERE id=$1", [session.userId]);
  return result.rows[0]?.github_token;
}

issuesRouter.post("/score", async (req, res, next) => {
  const issueUrls = req.body?.issueUrls;
  if (!Array.isArray(issueUrls) || issueUrls.some((url) => typeof url !== "string") || issueUrls.length > 30) {
    return res.status(400).json({ error: "issueUrls must contain at most 30 URLs" });
  }
  try {
    const githubToken = await viewerGithubToken(req);
    res.json({ scores: await scoreIssues(issueUrls, githubToken) });
  } catch (error) { next(error); }
});

issuesRouter.get("/:nodeId", async (req, res, next) => {
  try {
    const score = await getQuest(req.params.nodeId);
    if (!score) return res.status(404).json({ error: "Quest not found" });
    const session = await viewerSession(req);
    let claim = null;
    if (session) {
      const found = await query<ClaimRow>("SELECT * FROM claims WHERE user_id=$1 AND issue_node_id=$2", [session.userId, req.params.nodeId]);
      claim = found.rowCount ? toClaim(found.rows[0]) : null;
    }
    res.json({ score, claim });
  } catch (error) { next(error); }
});
