import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

export interface SessionPayload { userId: number; githubId: string; login: string }

declare global {
  namespace Express { interface Request { session?: SessionPayload } }
}

const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return process.env.JWT_SECRET;
};

export const issueToken = (payload: SessionPayload) => jwt.sign(payload, secret(), { expiresIn: "30d" });

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.session = jwt.verify(token, secret()) as SessionPayload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}
