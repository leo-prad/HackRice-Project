import { Router } from "express";
import { query } from "../db.js";
import { scoreIssue } from "../services/scoring.js";

export const issuesRouter = Router();

issuesRouter.post("/score", async (req, res) => {
  const issueUrls = req.body?.issueUrls;
  if (!Array.isArray(issueUrls) || issueUrls.some((url) => typeof url !== "string") || issueUrls.length > 30) {
    return res.status(400).json({ error: "issueUrls must contain at most 30 URLs" });
  }
  let cursor = 0;
  const scores: unknown[] = [];
  const worker = async () => {
    while (cursor < issueUrls.length) {
      const url = issueUrls[cursor++];
      try { scores.push(await scoreIssue(url)); }
      catch (error) { console.error(`Could not score ${url}`, error); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(5, issueUrls.length) }, worker));
  res.json({ scores });
});

issuesRouter.get("/:nodeId", async (req, res, next) => {
  try {
    const score = await query("SELECT * FROM issue_scores WHERE issue_node_id=$1", [req.params.nodeId]);
    if (!score.rowCount) return res.status(404).json({ error: "Issue score not found" });
    const auth = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    let claim = null;
    if (auth) {
      const { verify } = await import("jsonwebtoken");
      try {
        const payload = verify(auth, process.env.JWT_SECRET!) as { userId: number };
        const found = await query("SELECT * FROM claims WHERE user_id=$1 AND issue_node_id=$2", [payload.userId, req.params.nodeId]);
        claim = found.rows[0] ?? null;
      } catch { /* Public score still works with an expired token. */ }
    }
    res.json({ score: score.rows[0], claim });
  } catch (error) { next(error); }
});
