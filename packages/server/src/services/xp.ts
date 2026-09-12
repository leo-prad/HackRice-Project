import type { PoolClient } from "pg";
import type { QuestCompletion, Rarity, UserAchievement } from "@questline/shared";
import { achievementDef, isBossRarity, isLanguageSkill, levelProgress, skillLevel } from "@questline/shared";
import { withTransaction } from "../db.js";

const SPEEDRUN_WINDOW_MS = 24 * 60 * 60 * 1000;

interface LockedClaim {
  id: number; user_id: number; issue_node_id: string; status: string;
  pr_repo: string | null; pr_number: number | null; claimed_at: Date;
  completion_json: QuestCompletion | null;
  xp: number; rarity: Rarity; title: string; quest_key: string; repo_owner_id: string;
  github_id: string; total_xp: number; created_at: Date;
}

async function globalRank(client: PoolClient, totalXp: number, createdAt: Date): Promise<number> {
  const result = await client.query<{ rank: string }>(
    "SELECT count(*)::int + 1 AS rank FROM users WHERE total_xp > $1 OR (total_xp = $1 AND created_at < $2)",
    [totalXp, createdAt],
  );
  return Number(result.rows[0].rank);
}

async function unlockAchievements(client: PoolClient, claim: LockedClaim, questsCompleted: number): Promise<UserAchievement[]> {
  const earned: string[] = [];
  if (questsCompleted >= 1) earned.push("first_blood");
  if (questsCompleted >= 10) earned.push("open_source_hero");
  if (isBossRarity(claim.rarity)) earned.push("boss_slayer");
  if (Date.now() - claim.claimed_at.getTime() <= SPEEDRUN_WINDOW_MS) earned.push("speedrunner");

  const languages = await client.query<{ skill_name: string }>(
    `SELECT DISTINCT qs.skill_name FROM claims c
     JOIN quest_skills qs ON qs.issue_node_id = c.issue_node_id
     WHERE c.user_id = $1 AND c.status = 'merged'`,
    [claim.user_id],
  );
  if (languages.rows.filter((row) => isLanguageSkill(row.skill_name)).length >= 3) earned.push("polyglot");

  const unlocked: UserAchievement[] = [];
  for (const code of earned) {
    const inserted = await client.query<{ code: string; unlocked_at: Date }>(
      `INSERT INTO user_achievements (user_id, code, claim_id) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, code) DO NOTHING RETURNING code, unlocked_at`,
      [claim.user_id, code, claim.id],
    );
    const row = inserted.rows[0];
    const definition = achievementDef(code);
    if (row && definition) {
      unlocked.push({ code: definition.code, name: definition.name, description: definition.description, unlockedAt: row.unlocked_at.toISOString() });
    }
  }
  return unlocked;
}

/**
 * Pays a claim exactly once when a qualifying PR is linked. Returns the Quest Complete payload,
 * or the stored payload when the claim was already settled.
 */
export async function completeClaim(claimId: number, note: string): Promise<QuestCompletion | null> {
  return withTransaction(async (client) => {
    const locked = await client.query<LockedClaim>(
      `SELECT c.id, c.user_id, c.issue_node_id, c.status, c.pr_repo, c.pr_number, c.claimed_at, c.completion_json,
              s.xp, s.rarity, s.title, s.quest_key, s.repo_owner_id,
              u.github_id, u.total_xp, u.created_at
       FROM claims c
       JOIN issue_scores s ON s.issue_node_id = c.issue_node_id
       JOIN users u ON u.id = c.user_id
       WHERE c.id = $1 FOR UPDATE`,
      [claimId],
    );
    if (!locked.rowCount) throw Object.assign(new Error("Claim not found"), { status: 404 });
    const claim = locked.rows[0];

    const alreadyPaid = await client.query(
      "SELECT 1 FROM xp_events WHERE claim_id = $1 AND kind IN ('pr_merged','claim_complete') LIMIT 1",
      [claimId],
    );
    if (alreadyPaid.rowCount || claim.status === "merged") return claim.completion_json;
    if (claim.status !== "submitted" && claim.status !== "claimed") {
      throw Object.assign(new Error("Link your pull request before completing the quest"), { status: 409 });
    }

    const multiplier = String(claim.github_id) === String(claim.repo_owner_id) ? 0.25 : 1;
    const award = Math.max(0, Math.floor(claim.xp * multiplier));
    const before = levelProgress(claim.total_xp);
    const rankBefore = await globalRank(client, claim.total_xp, claim.created_at);

    await client.query("UPDATE claims SET status='merged', xp_awarded=$1, merged_at=now() WHERE id=$2", [award, claimId]);
    await client.query(
      "INSERT INTO xp_events (user_id, claim_id, issue_node_id, delta, kind, note) VALUES ($1,$2,$3,$4,'claim_complete',$5)",
      [claim.user_id, claimId, claim.issue_node_id, award, multiplier === 0.25 ? `${note} (25% self-owned repository award)` : note],
    );
    const updatedUser = await client.query<{ total_xp: number }>(
      "UPDATE users SET total_xp = total_xp + $1, last_active_at = now() WHERE id = $2 RETURNING total_xp",
      [award, claim.user_id],
    );
    const totalXp = updatedUser.rows[0].total_xp;

    const questSkills = await client.query<{ skill_name: string; skill_xp_reward: number }>(
      "SELECT skill_name, skill_xp_reward FROM quest_skills WHERE issue_node_id = $1 ORDER BY skill_xp_reward DESC",
      [claim.issue_node_id],
    );
    const skillUps: QuestCompletion["skillUps"] = [];
    for (const skill of questSkills.rows) {
      const skillAward = Math.max(0, Math.floor(skill.skill_xp_reward * multiplier));
      if (!skillAward) continue;
      const upserted = await client.query<{ xp: number }>(
        `INSERT INTO user_skills (user_id, skill_name, xp) VALUES ($1,$2,$3)
         ON CONFLICT (user_id, skill_name) DO UPDATE SET xp = user_skills.xp + $3, updated_at = now()
         RETURNING xp`,
        [claim.user_id, skill.skill_name, skillAward],
      );
      const after = upserted.rows[0].xp;
      skillUps.push({
        name: skill.skill_name,
        xpAwarded: skillAward,
        levelBefore: skillLevel(after - skillAward),
        levelAfter: skillLevel(after),
      });
    }

    const completedCount = await client.query<{ count: string }>(
      "SELECT count(*)::int AS count FROM claims WHERE user_id = $1 AND status = 'merged'",
      [claim.user_id],
    );
    const achievements = await unlockAchievements(client, claim, Number(completedCount.rows[0].count));

    const after = levelProgress(totalXp);
    const rankAfter = await globalRank(client, totalXp, claim.created_at);
    const completion: QuestCompletion = {
      questKey: claim.quest_key,
      questTitle: claim.title,
      rarity: claim.rarity,
      xpAwarded: award,
      totalXp,
      levelBefore: before.level,
      levelAfter: after.level,
      xpIntoLevel: after.xpIntoLevel,
      xpForNextLevel: after.xpForNextLevel,
      skillUps,
      achievements,
      rankBefore,
      rankAfter,
    };
    await client.query("UPDATE claims SET completion_json = $1 WHERE id = $2", [JSON.stringify(completion), claimId]);
    return completion;
  });
}
