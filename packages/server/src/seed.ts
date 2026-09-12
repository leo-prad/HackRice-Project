import "./env.js";
import { pool } from "./db.js";
import { listRepoIssues, searchIssues } from "./services/github.js";
import { scoreIssues } from "./services/scoring.js";

import { DEMO_WORLD_DEFAULTS } from "./services/recommend.js";

async function seed() {
  const repos = (process.env.DEMO_REPOS || DEMO_WORLD_DEFAULTS.join(","))
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  console.log(`Warming GitQuest scores for ${repos.join(", ")}`);
  for (const fullName of repos) {
    const [owner, repo] = fullName.split("/");
    if (!owner || !repo) continue;
    const issues = await listRepoIssues(owner, repo, 8);
    const urls = issues.map((issue) => issue.html_url);
    if (urls.length < 4) {
      const extra = await searchIssues(`repo:${owner}/${repo} (label:"good first issue" OR label:"help wanted" OR label:"bug")`, 8);
      extra.forEach((item) => urls.push(item.html_url));
    }
    const scores = await scoreIssues(Array.from(new Set(urls)).slice(0, 8), undefined, 3);
    for (const quest of scores.sort((a, b) => b.xp - a.xp)) {
      console.log(`${quest.rarity.padEnd(10)} ${String(quest.xp).padStart(4)} XP  ${quest.difficulty.toFixed(2)}  ${quest.questKey}  ${quest.title}`);
    }
  }
}

seed()
  .then(() => console.log("Demo quest cache is warm. Open a seeded repo on GitHub with the extension."))
  .catch((error) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
