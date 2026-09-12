import { query } from "../db.js";
import { issueToken } from "./jwt.js";

interface GitHubViewer { id: number; login: string; avatar_url: string }

export function oauthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID ?? "",
    redirect_uri: process.env.GITHUB_OAUTH_CALLBACK ?? "",
    scope: "read:user public_repo",
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function finishOAuth(code: string) {
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GITHUB_OAUTH_CALLBACK,
    }),
  });
  if (!tokenResponse.ok) throw new Error("GitHub token exchange failed");
  const tokenBody = await tokenResponse.json() as { access_token?: string; error?: string };
  if (!tokenBody.access_token) throw new Error(tokenBody.error ?? "GitHub returned no token");

  const userResponse = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokenBody.access_token}`, Accept: "application/vnd.github+json" },
  });
  if (!userResponse.ok) throw new Error("Could not load GitHub profile");
  const viewer = await userResponse.json() as GitHubViewer;
  const result = await query<{ id: number }>(
    `INSERT INTO users (github_id, github_login, avatar_url, github_token)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (github_id) DO UPDATE SET github_login=EXCLUDED.github_login,
       avatar_url=EXCLUDED.avatar_url, github_token=EXCLUDED.github_token, last_active_at=now()
     RETURNING id`,
    [viewer.id, viewer.login, viewer.avatar_url, tokenBody.access_token],
  );
  return issueToken({ userId: result.rows[0].id, githubId: String(viewer.id), login: viewer.login });
}
