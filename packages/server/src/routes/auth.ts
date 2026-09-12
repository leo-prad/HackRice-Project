import { Router } from "express";
import { finishOAuth, oauthUrl } from "../auth/github.js";
import { requireAuth } from "../auth/jwt.js";
import { createPairingCode, redeemPairingCode } from "../auth/pairing.js";

export const authRouter = Router();

authRouter.get("/github", (_req, res) => res.redirect(oauthUrl()));
authRouter.get("/github/callback", async (req, res, next) => {
  try {
    if (typeof req.query.code !== "string") return res.status(400).send("Missing OAuth code");
    const token = await finishOAuth(req.query.code);
    res.redirect(`${process.env.DASHBOARD_URL ?? "http://127.0.0.1:5174"}/#token=${encodeURIComponent(token)}`);
  } catch (error) { next(error); }
});
authRouter.post("/pair/create", requireAuth, async (req, res, next) => {
  try { res.json({ code: await createPairingCode(req.session!.userId), expiresInSeconds: 300 }); }
  catch (error) { next(error); }
});
authRouter.post("/pair/redeem", async (req, res, next) => {
  try {
    if (typeof req.body?.code !== "string") return res.status(400).json({ error: "Code is required" });
    const result = await redeemPairingCode(req.body.code);
    if (!result) return res.status(400).json({ error: "Code is invalid, expired, or already used" });
    res.json(result);
  } catch (error) { next(error); }
});
