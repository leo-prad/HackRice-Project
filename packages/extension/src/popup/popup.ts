import type { Claim, LeaderboardEntry, UserProfile, QuestCompletion } from "@questline/shared";
import { dashboardPath } from "../lib/config";
import { popupApi as api, popupStorage as storage } from "./api";

const app = document.querySelector<HTMLElement>("#app")!;

const brand = '<div class="brand"><div class="mark">Q</div><b>Questline</b></div>';

async function load() {
  const token = await storage.token();
  if (!token) return drawLogin();
  try {
    const [profile, board] = await Promise.all([api<UserProfile>("/users/me"), api<{ entries: LeaderboardEntry[] }>("/leaderboard?limit=50")]);
    drawProfile(profile, board.entries);
  } catch { await storage.clearToken(); drawLogin("Your pairing expired. Pair again."); }
}

function drawLogin(message = "", canCancel = false) {
  app.innerHTML = `${brand}<div class="login"><h2>${canCancel ? "Pair a new account" : "Start your run"}</h2><p>Sign in on the dashboard, then paste your one-time pairing code.</p><input class="code" maxlength="10" placeholder="QUEST-4F2A"><button class="button" id="redeem">Pair extension</button><a class="button ghost" href="${dashboardPath("/pair")}" target="_blank">Open dashboard</a>${canCancel ? '<button class="button ghost" id="cancel-pair">Cancel</button>' : ""}<p class="error">${message}</p></div>`;
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
          return `<div class="quest"><a class="quest-body" href="${url}" target="_blank" rel="noopener"><div class="quest-meta"><span class="quest-icon"></span><span class="quest-slug">${slug}</span></div><div class="quest-title">${title}</div><div class="quest-foot"><span class="quest-xp">${xp.toLocaleString()} XP</span><span class="quest-open">Open ↗</span></div></a><button class="quest-link-pr" data-claim-id="${claim.id}" title="Link pull request" aria-label="Link pull request"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg></button><form class="quest-pr-form" data-claim-id="${claim.id}" hidden><input type="url" required placeholder="https://github.com/org/repo/pull/123" aria-label="Pull request URL"><button type="submit">Submit</button><p class="quest-pr-error" hidden></p></form></div>`;
        })
        .join("")
    : '<div class="empty">No active quests yet.</div>';
  app.innerHTML = `${brand}<div class="user"><a class="user-profile" href="${dashboardPath("/profile")}" target="_blank" title="Open your profile"><img class="avatar" src="${profile.user.avatarUrl ?? ""}"><div><strong>@${profile.user.githubLogin}</strong><span class="level">LEVEL ${profile.level} · ${profile.user.totalXp.toLocaleString()} XP</span></div></a><button class="new-code" id="new-code" title="Pair with a new code">New code</button></div><div class="bar"><i style="width:${progress}%"></i></div><section class="section"><h3>ACTIVE QUESTS</h3><div class="quests">${quests}</div></section><section class="section"><h3>GLOBAL LEADERBOARD</h3>${shown.map((entry) => `<a class="row" href="https://github.com/${encodeURIComponent(entry.login)}" target="_blank" rel="noopener" title="Open ${clean(entry.login)} on GitHub"><span class="rank">#${entry.rank}</span><img src="${entry.avatarUrl ?? ""}"><span class="name">${clean(entry.login)}</span><span class="xp">${entry.totalXp.toLocaleString()}</span></a>`).join("")}</section><a class="footer" href="${dashboardPath("/profile")}" target="_blank">Open dashboard ↗</a>`;
  app.querySelector("#new-code")?.addEventListener("click", () => drawLogin("", true));
  wireQuestForms();
}

function wireQuestForms() {
  app.querySelectorAll<HTMLButtonElement>(".quest-link-pr").forEach((button) => {
    button.addEventListener("click", () => {
      const form = app.querySelector<HTMLFormElement>(`.quest-pr-form[data-claim-id="${button.dataset.claimId}"]`);
      if (!form) return;
      form.hidden = !form.hidden;
      if (!form.hidden) form.querySelector<HTMLInputElement>("input")?.focus();
    });
  });

  app.querySelectorAll<HTMLFormElement>(".quest-pr-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = form.querySelector<HTMLButtonElement>("button")!;
      const input = form.querySelector<HTMLInputElement>("input")!;
      const error = form.querySelector<HTMLElement>(".quest-pr-error")!;
      submit.disabled = true;
      submit.textContent = "Sending…";
      error.hidden = true;
      try {
        const response = await api<{ claim: Claim; completion: QuestCompletion | null; pending: string | null }>(`/claims/${form.dataset.claimId}/submit`, {
          method: "POST",
          body: JSON.stringify({ prUrl: input.value }),
        });
        if (response.completion) {
          await load();
          playSubmissionConfetti();
        } else {
          playSubmissionConfetti();
          form.innerHTML = '<p class="quest-pr-success">PR submitted. XP unlocks after approval or merge.</p>';
        }
      } catch (reason) {
        error.textContent = reason instanceof Error ? reason.message : "Could not submit this PR";
        error.hidden = false;
        submit.disabled = false;
        submit.textContent = "Submit";
      }
    });
  });
}

function playSubmissionConfetti() {
  const burst = document.createElement("div");
  burst.className = "submit-confetti";
  for (let index = 0; index < 24; index += 1) {
    const piece = document.createElement("i");
    piece.style.setProperty("--x", `${Math.cos(index / 24 * Math.PI * 2) * (45 + Math.random() * 90)}px`);
    piece.style.setProperty("--y", `${Math.sin(index / 24 * Math.PI * 2) * (45 + Math.random() * 90)}px`);
    piece.style.setProperty("--delay", `${Math.random() * 100}ms`);
    burst.append(piece);
  }
  app.append(burst);
  setTimeout(() => burst.remove(), 1100);
}

const clean = (value: string) => value.replace(/[&<>"']/g, "");
void load();
