import type { Claim, LeaderboardEntry, UserProfile, QuestCompletion } from "@gitventure/shared";
import { openDashboard } from "../lib/openDashboard";
import { ROUTES } from "../lib/routes";
import { bumpClaimsEpoch, onClaimsEpoch } from "../lib/claimSync";
import { popupApi as api, popupStorage as storage } from "./api";

const app = document.querySelector<HTMLElement>("#app")!;

const brand = '<div class="brand"><div class="mark">GV</div><b>GitVenture</b></div>';

async function load() {
  const token = await storage.token();
  if (!token) return drawLogin();
  try {
    const [profile, board] = await Promise.all([
      api<UserProfile>("/users/me"),
      api<{ entries: LeaderboardEntry[] }>("/leaderboard?limit=50"),
    ]);
    drawProfile(profile, board.entries);
  } catch {
    await storage.clearToken();
    drawLogin("Your pairing expired. Pair again.");
  }
}

function drawLogin(message = "", canCancel = false) {
  app.innerHTML = `${brand}<div class="login"><h2>${canCancel ? "Pair a new account" : "Start your run"}</h2><p>Sign in on the dashboard, then paste your one-time pairing code.</p><input class="code" maxlength="10" placeholder="QUEST-4F2A"><button class="button" id="redeem">Pair extension</button><button class="button ghost" type="button" id="open-pair">Get pairing code</button>${canCancel ? '<button class="button ghost" id="cancel-pair">Cancel</button>' : ""}<p class="error">${message}</p></div>`;
  app.querySelector("#open-pair")?.addEventListener("click", () => openDashboard(ROUTES.pair));
  app.querySelector("#cancel-pair")?.addEventListener("click", () => void load());
  app.querySelector("#redeem")?.addEventListener("click", async () => {
    const button = app.querySelector<HTMLButtonElement>("#redeem")!;
    const code = app.querySelector<HTMLInputElement>(".code")!.value;
    button.disabled = true;
    button.textContent = "Pairing…";
    try {
      const result = await api<{ token: string }>("/auth/pair/redeem", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      await storage.setToken(result.token);
      await load();
    } catch (error) {
      drawLogin(error instanceof Error ? error.message : "Could not pair");
    }
  });
}

function drawProfile(profile: UserProfile, entries: LeaderboardEntry[]) {
  const userRank = entries.find((entry) => entry.login === profile.user.githubLogin);
  const shown = entries.slice(0, 5);
  if (userRank && userRank.rank > 5) shown.push(userRank);
  const progress = Math.min(100, (profile.xpIntoLevel / profile.xpForNextLevel) * 100);
  const claims = profile.claims
    .filter((claim) => claim.status === "claimed" || claim.status === "submitted")
    .slice(0, 5);
  const quests = claims.length
    ? claims
        .map((claim) => {
          const quest = claim.score;
          const slug = clean(quest?.questKey ?? "");
          const url = quest?.issueUrl ?? "#";
          const title = clean(quest?.title ?? "Quest");
          const xp = quest?.xp ?? 0;
          return `<div class="quest" data-claim-id="${claim.id}"><a class="quest-body" href="${url}" target="_blank" rel="noopener"><div class="quest-meta"><span class="quest-icon"></span><span class="quest-slug">${slug}</span></div><div class="quest-title">${title}</div><div class="quest-foot"><span class="quest-xp">${xp.toLocaleString()} XP</span><span class="quest-open">Open ↗</span></div></a><button class="quest-unclaim" data-claim-id="${claim.id}" type="button" title="Unclaim quest" aria-label="Unclaim quest">×</button><button class="quest-link-pr" data-claim-id="${claim.id}" title="Link pull request" aria-label="Link pull request"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg></button><form class="quest-pr-form" data-claim-id="${claim.id}" hidden><div class="quest-pr-heading"><span>LINK PULL REQUEST</span><button class="quest-pr-cancel" type="button" aria-label="Cancel">×</button></div><input type="url" required placeholder="https://github.com/org/repo/pull/123" aria-label="Pull request URL"><button type="submit">Submit</button><p class="quest-pr-error" hidden></p></form></div>`;
        })
        .join("")
    : `<div class="empty">No active quests yet.<button class="empty-cta" type="button" id="find-quest">Find a quest →</button></div>`;
  app.innerHTML = `${brand}<div class="user"><button class="user-profile" type="button" id="open-profile" title="Open your profile"><img class="avatar" src="${profile.user.avatarUrl ?? ""}"><div><strong>@${profile.user.githubLogin}</strong><span class="level">LEVEL ${profile.level} · ${profile.user.totalXp.toLocaleString()} XP</span></div></button><button class="new-code" id="new-code" title="Pair with a new code">New code</button></div><div class="bar"><i style="width:${progress}%"></i></div><section class="section"><h3>ACTIVE QUESTS</h3><div class="quests">${quests}</div></section><section class="section"><button class="section-link" type="button" id="open-leaderboard" title="Open leaderboard">GLOBAL LEADERBOARD</button>${shown.map((entry) => `<a class="row" href="https://github.com/${encodeURIComponent(entry.login)}" target="_blank" rel="noopener" title="Open ${clean(entry.login)} on GitHub"><span class="rank">#${entry.rank}</span><img src="${entry.avatarUrl ?? ""}"><span class="name">${clean(entry.login)}</span><span class="xp">${entry.totalXp.toLocaleString()}</span></a>`).join("")}</section><button class="footer" type="button" id="open-dashboard">Open dashboard ↗</button>`;
  app.querySelector("#new-code")?.addEventListener("click", () => drawLogin("", true));
  app.querySelector("#open-profile")?.addEventListener("click", () => openDashboard(ROUTES.profile));
  app.querySelector("#open-dashboard")?.addEventListener("click", () => openDashboard(ROUTES.continue));
  app.querySelector("#open-leaderboard")?.addEventListener("click", () => openDashboard(ROUTES.leaderboard));
  app.querySelector("#find-quest")?.addEventListener("click", () => openDashboard(ROUTES.home));
  wireQuestForms();
  wireUnclaim();
}

function wireUnclaim() {
  app.querySelectorAll<HTMLButtonElement>(".quest-unclaim").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const claimId = Number(button.dataset.claimId);
      if (!claimId) return;
      const card = button.closest<HTMLElement>(".quest");
      button.disabled = true;
      card?.classList.add("quest-removing");
      try {
        await api(`/claims/${claimId}/abandon`, { method: "POST" });
        await bumpClaimsEpoch(claimId);
        card?.remove();
        const list = app.querySelector(".quests");
        if (list && !list.querySelector(".quest")) {
          list.innerHTML =
            '<div class="empty">No active quests yet.<button class="empty-cta" type="button" id="find-quest">Find a quest →</button></div>';
          list.querySelector("#find-quest")?.addEventListener("click", () => openDashboard(ROUTES.home));
        }
      } catch {
        button.disabled = false;
        card?.classList.remove("quest-removing");
      }
    });
  });
}

function wireQuestForms() {
  app.querySelectorAll<HTMLButtonElement>(".quest-link-pr").forEach((button) => {
    button.addEventListener("click", () => {
      const form = app.querySelector<HTMLFormElement>(`.quest-pr-form[data-claim-id="${button.dataset.claimId}"]`);
      if (!form) return;
      form.hidden = false;
      form.closest(".quest")?.classList.add("quest-pr-open");
      form.querySelector<HTMLInputElement>("input")?.focus();
    });
  });

  app.querySelectorAll<HTMLFormElement>(".quest-pr-form").forEach((form) => {
    form.querySelector<HTMLButtonElement>(".quest-pr-cancel")?.addEventListener("click", () => {
      form.hidden = true;
      form.closest(".quest")?.classList.remove("quest-pr-open");
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
      const input = form.querySelector<HTMLInputElement>("input")!;
      const error = form.querySelector<HTMLElement>(".quest-pr-error")!;
      submit.disabled = true;
      submit.textContent = "Sending…";
      error.hidden = true;
      try {
        const response = await api<{ claim: Claim; completion: QuestCompletion | null; pending: string | null }>(
          `/claims/${form.dataset.claimId}/submit`,
          {
            method: "POST",
            body: JSON.stringify({ prUrl: input.value }),
          },
        );
        await bumpClaimsEpoch(Number(form.dataset.claimId));
        if (response.completion) {
          await load();
          playSubmissionConfetti();
          openDashboard(ROUTES.complete);
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
    piece.style.setProperty("--x", `${Math.cos((index / 24) * Math.PI * 2) * (45 + Math.random() * 90)}px`);
    piece.style.setProperty("--y", `${Math.sin((index / 24) * Math.PI * 2) * (45 + Math.random() * 90)}px`);
    piece.style.setProperty("--delay", `${Math.random() * 100}ms`);
    burst.append(piece);
  }
  app.append(burst);
  setTimeout(() => burst.remove(), 1100);
}

const clean = (value: string) => value.replace(/[&<>"']/g, "");
onClaimsEpoch(() => void load());
void load();
