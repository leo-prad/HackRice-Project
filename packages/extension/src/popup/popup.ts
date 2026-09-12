import type { LeaderboardEntry, UserProfile } from "@questline/shared";
import { popupApi as api, popupStorage as storage } from "./api";

const app = document.querySelector<HTMLElement>("#app")!;
const dashboard = import.meta.env.VITE_DASHBOARD_URL || "http://localhost:5173";

const brand = '<div class="brand"><div class="mark">Q</div><b>GitQuest</b></div>';

async function load() {
  const token = await storage.token();
  if (!token) return drawLogin();
  try {
    const [profile, board] = await Promise.all([api<UserProfile>("/users/me"), api<{ entries: LeaderboardEntry[] }>("/leaderboard?limit=50")]);
    drawProfile(profile, board.entries);
  } catch { await storage.clearToken(); drawLogin("Your pairing expired. Pair again."); }
}

function drawLogin(message = "", canCancel = false) {
  app.innerHTML = `${brand}<div class="login"><h2>${canCancel ? "Pair a new account" : "Start your run"}</h2><p>Sign in on the dashboard, then paste your one-time pairing code.</p><input class="code" maxlength="10" placeholder="QUEST-4F2A"><button class="button" id="redeem">Pair extension</button><a class="button ghost" href="${dashboard}/pair" target="_blank">Open dashboard</a>${canCancel ? '<button class="button ghost" id="cancel-pair">Cancel</button>' : ""}<p class="error">${message}</p></div>`;
  app.querySelector("#cancel-pair")?.addEventListener("click", () => void load());
  app.querySelector("#redeem")?.addEventListener("click", async () => {
    const button = app.querySelector<HTMLButtonElement>("#redeem")!;
    const code = app.querySelector<HTMLInputElement>(".code")!.value;
    button.disabled = true; button.textContent = "Pairing…";
    try { const result = await api<{ token: string }>("/auth/pair/redeem", { method: "POST", body: JSON.stringify({ code }) }); await storage.setToken(result.token); await load(); }
    catch (error) { drawLogin(error instanceof Error ? error.message : "Could not pair"); }
  });
}

function drawProfile(profile: UserProfile, entries: LeaderboardEntry[]) {
  const userRank = entries.find((entry) => entry.login === profile.user.githubLogin);
  const shown = entries.slice(0, 5);
  if (userRank && userRank.rank > 5) shown.push(userRank);
  const progress = Math.min(100, profile.xpIntoLevel / profile.xpForNextLevel * 100);
  const claims = profile.claims.filter((claim) => claim.status === "claimed").slice(0, 5);
  const quests = claims.length
    ? claims
        .map((claim) => {
          const quest = claim.score;
          const slug = clean(quest?.questKey ?? "");
          const url = quest?.issueUrl ?? "#";
          const title = clean(quest?.title ?? "Quest");
          const xp = quest?.xp ?? 0;
          return `<a class="quest" href="${url}" target="_blank" rel="noopener"><div class="quest-meta"><span class="quest-icon"></span><span class="quest-slug">${slug}</span></div><div class="quest-title">${title}</div><div class="quest-foot"><span class="quest-xp">${xp.toLocaleString()} XP</span><span class="quest-open">Open ↗</span></div></a>`;
        })
        .join("")
    : '<div class="empty">No active quests yet.</div>';
  app.innerHTML = `${brand}<div class="user"><img class="avatar" src="${profile.user.avatarUrl ?? ""}"><div><strong>@${profile.user.githubLogin}</strong><span class="level">LEVEL ${profile.level} · ${profile.user.totalXp.toLocaleString()} XP</span></div><button class="new-code" id="new-code" title="Pair with a new code">New code</button></div><div class="bar"><i style="width:${progress}%"></i></div><section class="section"><h3>ACTIVE QUESTS</h3><div class="quests">${quests}</div></section><section class="section"><h3>GLOBAL LEADERBOARD</h3>${shown.map((entry) => `<div class="row"><span class="rank">#${entry.rank}</span><img src="${entry.avatarUrl ?? ""}"><span class="name">${clean(entry.login)}</span><span class="xp">${entry.totalXp.toLocaleString()}</span></div>`).join("")}</section><a class="footer" href="${dashboard}" target="_blank">Open dashboard ↗</a>`;
  app.querySelector("#new-code")?.addEventListener("click", () => drawLogin("", true));
}

const clean = (value: string) => value.replace(/[&<>"']/g, "");
void load();
