import "./env.js";
import { pool, query } from "./db.js";
import { listRepoIssues, searchIssues } from "./services/github.js";
import { scoreIssues } from "./services/scoring.js";

import { DEMO_WORLD_DEFAULTS } from "./services/recommend.js";

/** Prefer a PAT for private demo repos; fall back to any stored OAuth user token. */
async function resolveSeedToken(): Promise<string | undefined> {
  if (process.env.GITHUB_TOKEN?.trim()) return process.env.GITHUB_TOKEN.trim();
  const row = await query<{ github_token: string }>(
    "SELECT github_token FROM users WHERE github_token IS NOT NULL AND github_token <> '' ORDER BY id ASC LIMIT 1",
  );
  return row.rows[0]?.github_token;
}

async function seed() {
  const repos = (process.env.DEMO_REPOS || DEMO_WORLD_DEFAULTS.join(","))
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const token = await resolveSeedToken();
  if (!token) {
    console.warn(
      "No GITHUB_TOKEN (or signed-in user token) available. Private repos like GitPathDemo will fail to seed.",
    );
  }

  console.log(`Warming Questline scores for ${repos.join(", ")}`);
  for (const fullName of repos) {
    const [owner, repo] = fullName.split("/");
    if (!owner || !repo) continue;
    const issues = await listRepoIssues(owner, repo, 30, token);
    const urls = issues.map((issue) => issue.html_url);
    if (urls.length < 3) {
      const extra = await searchIssues(`repo:${owner}/${repo} is:issue is:open`, 20, token);
      extra.forEach((item) => urls.push(item.html_url));
    }
    const unique = Array.from(new Set(urls));
    console.log(`Found ${unique.length} open issues in ${fullName}`);
    const scores = await scoreIssues(unique, token, 3);
    for (const quest of scores.sort((a, b) => b.xp - a.xp)) {
      console.log(`${quest.rarity.padEnd(10)} ${String(quest.xp).padStart(4)} XP  ${quest.difficulty.toFixed(2)}  ${quest.questKey}  ${quest.title}`);
    }
  }
}

seed()
  .then(() => console.log("Demo quest cache is warm. Open https://github.com/tejaspalukuri/GitPathDemo/issues with the extension."))
  .catch((error) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
