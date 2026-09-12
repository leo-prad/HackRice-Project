import "./env.js";
import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.js";
import { claimsRouter } from "./routes/claims.js";
import { issuesRouter } from "./routes/issues.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { usersRouter } from "./routes/users.js";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "100kb" }));
app.get("/health", (_req, res) => res.json({ ok: true, service: "questline" }));
app.use("/auth", authRouter);
app.use("/issues", issuesRouter);
app.use("/claims", claimsRouter);
app.use("/users", usersRouter);
app.use("/leaderboard", leaderboardRouter);
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(error?.status ?? 500).json({ error: error?.message ?? "Something went wrong" });
});

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => console.log(`Questline API ready on http://localhost:${port}`));
