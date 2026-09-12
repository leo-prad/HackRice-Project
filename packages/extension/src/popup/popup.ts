import type { LeaderboardEntry, UserProfile } from "@questline/shared";
import { popupApi as api, popupStorage as storage } from "./api";

const app = document.querySelector<HTMLElement>("#app")!;
const dashboard = import.meta.env.VITE_DASHBOARD_URL || "http://localhost:5173";

const brand = '<div class="brand"><div class="mark">Q</div><b>Questline</b></div>';

async function load() {
  const token = await storage.token();
  if (!token) return drawLogin();
  try {
    const [profile, board] = await Promise.all([api<UserProfile>("/users/me"), api<{ entries: LeaderboardEntry[] }>("/leaderboard?limit=50")]);
    drawProfile(profile, board.entries);
  } catch { await storage.clearToken(); drawLogin("Your pairing expired. Pair again."); }
}

function drawLogin(message = "") {
  app.innerHTML = `${brand}<div class="login"><h2>Start your run</h2><p>Sign in on the dashboard, then paste your one-time pairing code.</p><input class="code" maxlength="10" placeholder="QUEST-4F2A"><button class="button" id="redeem">Pair extension</button><a class="button ghost" href="${dashboard}/pair" target="_blank">Open dashboard</a><p class="error">${message}</p></div>`;
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
  const claims = profile.claims.filter((claim) => claim.status === "claimed").slice(0, 3);
  app.innerHTML = `${brand}<div class="user"><img class="avatar" src="${profile.user.avatarUrl ?? ""}"><div><strong>@${profile.user.githubLogin}</strong><span class="level">LEVEL ${profile.level} · ${profile.user.totalXp.toLocaleString()} XP</span></div></div><div class="bar"><i style="width:${progress}%"></i></div><section class="section"><h3>ACTIVE QUESTS</h3>${claims.length ? claims.map((claim: any) => `<div class="row"><span class="name">${clean(claim.title)}</span><span class="xp">${Number(claim.xp).toLocaleString()} XP</span></div>`).join("") : '<div class="empty">No active quests yet.</div>'}</section><section class="section"><h3>GLOBAL LEADERBOARD</h3>${shown.map((entry) => `<div class="row"><span class="rank">#${entry.rank}</span><img src="${entry.avatarUrl ?? ""}"><span class="name">${clean(entry.login)}</span><span class="xp">${entry.totalXp.toLocaleString()}</span></div>`).join("")}</section><a class="footer" href="${dashboard}" target="_blank">Open dashboard ↗</a>`;
}

const clean = (value: string) => value.replace(/[&<>"']/g, "");
void load();
