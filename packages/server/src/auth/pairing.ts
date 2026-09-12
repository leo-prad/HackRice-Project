import crypto from "node:crypto";
import { query, withTransaction } from "../db.js";
import { issueToken } from "./jwt.js";

export async function createPairingCode(userId: number) {
  const code = `QUEST-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  await query("INSERT INTO pairing_codes (code, user_id, expires_at) VALUES ($1,$2,now() + interval '5 minutes')", [code, userId]);
  return code;
}

export async function redeemPairingCode(rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  return withTransaction(async (client) => {
    const result = await client.query(
      `SELECT p.code, u.id, u.github_id, u.github_login, u.avatar_url, u.total_xp
       FROM pairing_codes p JOIN users u ON u.id=p.user_id
       WHERE p.code=$1 AND p.consumed=false AND p.expires_at > now() FOR UPDATE`, [code],
    );
    if (!result.rowCount) return null;
    const row = result.rows[0];
    await client.query("UPDATE pairing_codes SET consumed=true WHERE code=$1", [code]);
    return {
      token: issueToken({ userId: row.id, githubId: String(row.github_id), login: row.github_login }),
      user: { id: row.id, githubId: String(row.github_id), githubLogin: row.github_login, avatarUrl: row.avatar_url, totalXp: row.total_xp },
    };
  });
}
