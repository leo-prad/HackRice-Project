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
  const claims = profile.claims.filter((claim) => claim.status === "claimed").slice(0, 5);
  const quests = claims.length
    ? claims
        .map((claim: any) => {
          const repo = clean(String(claim.repo_full_name ?? claim.repoFullName ?? ""));
          const number = Number(claim.issue_number ?? claim.issueNumber ?? 0);
          const issueUrl = String(claim.issue_url ?? claim.issueUrl ?? "");
          const id = Number(claim.id);
          return `<div class="quest" data-claim-id="${id}" data-issue-url="${issueUrl}"><a class="quest-body" href="${issueUrl}" target="_blank" rel="noopener"><div class="quest-meta"><span class="quest-icon"></span><span class="quest-slug">${repo}${number ? ` #${number}` : ""}</span></div><div class="quest-title">${clean(claim.title)}</div><div class="quest-foot"><span class="quest-xp">${Number(claim.xp).toLocaleString()} XP</span><span class="quest-open">Open ↗</span></div></a><button class="quest-link" type="button" aria-label="Link a pull request" title="Link a pull request"><svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 0 1 0-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83 0z"/></svg></button></div>`;
        })
        .join("")
    : '<div class="empty">No active quests yet.</div>';
  const profileHref = `https://github.com/${profile.user.githubLogin}`;
  app.innerHTML = `${brand}<a class="user" href="${profileHref}" target="_blank" rel="noopener"><img class="avatar" src="${profile.user.avatarUrl ?? ""}"><div><strong>@${profile.user.githubLogin}</strong><span class="level">LEVEL ${profile.level} · ${profile.user.totalXp.toLocaleString()} XP</span></div></a><div class="bar"><i style="width:${progress}%"></i></div><section class="section"><h3>ACTIVE QUESTS</h3><div class="quests">${quests}</div></section><section class="section"><h3>GLOBAL LEADERBOARD</h3>${shown.map((entry) => `<a class="row" href="https://github.com/${entry.login}" target="_blank" rel="noopener"><span class="rank">#${entry.rank}</span><img src="${entry.avatarUrl ?? ""}"><span class="name">${clean(entry.login)}</span><span class="xp">${entry.totalXp.toLocaleString()}</span></a>`).join("")}</section><a class="footer" href="${dashboard}" target="_blank">Open dashboard ↗</a>`;
  wireQuestLinkButtons();
}

function wireQuestLinkButtons() {
  app.querySelectorAll<HTMLButtonElement>(".quest-link").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const quest = button.closest<HTMLElement>(".quest")!;
      openPrPaste(quest);
    });
  });
}

function openPrPaste(quest: HTMLElement) {
  const claimId = Number(quest.dataset.claimId);
  quest.classList.add("quest-pasting");
  quest.innerHTML = `<div class="quest-paste"><div class="quest-paste-label">LINK YOUR PULL REQUEST</div><input class="quest-paste-input" type="url" placeholder="https://github.com/org/repo/pull/123" aria-label="Pull request URL"><div class="quest-paste-actions"><button class="quest-paste-cancel" type="button">Cancel</button><button class="quest-paste-submit" type="button">Submit</button></div><p class="quest-paste-error" hidden></p></div>`;
  const input = quest.querySelector<HTMLInputElement>(".quest-paste-input")!;
  const cancel = quest.querySelector<HTMLButtonElement>(".quest-paste-cancel")!;
  const submit = quest.querySelector<HTMLButtonElement>(".quest-paste-submit")!;
  const error = quest.querySelector<HTMLElement>(".quest-paste-error")!;
  input.focus();
  cancel.addEventListener("click", () => void load());
  submit.addEventListener("click", async () => {
    if (!input.value) { input.focus(); return; }
    submit.disabled = true;
    cancel.disabled = true;
    submit.textContent = "Submitting…";
    error.hidden = true;
    try {
      const response = await api<{ xpAwarded: number }>(`/claims/${claimId}/submit`, { method: "POST", body: JSON.stringify({ prUrl: input.value }) });
      const after = await api<UserProfile>("/users/me");
      await triggerGainOnActiveTab(response.xpAwarded, after);
      await load();
      window.close();
    } catch (reason) {
      submit.disabled = false;
      cancel.disabled = false;
      submit.textContent = "Submit";
      error.hidden = false;
      error.textContent = reason instanceof Error ? reason.message : "Could not submit";
    }
  });
}

async function triggerGainOnActiveTab(amount: number, after: UserProfile) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url?.startsWith("https://github.com/")) return;
    await chrome.tabs.sendMessage(tab.id, { type: "questline:xp-gain", amount, after });
  } catch {
    // Content script isn't on this tab, nothing to do.
  }
}

const clean = (value: string) => value.replace(/[&<>"']/g, "");
void load();
