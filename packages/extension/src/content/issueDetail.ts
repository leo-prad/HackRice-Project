import type { Claim, IssueScore, QuestCompletion, UserProfile } from "@questline/shared";
import { roman } from "@questline/shared";
import { api } from "../lib/api";
import { dashboardPath } from "../lib/config";
import { storage } from "../lib/storage";

let mounting = false;

interface SubmitResponse {
  claim: Claim;
  completion: QuestCompletion | null;
  pending: string | null;
}

export async function mountIssueDetail() {
  if (mounting || document.querySelector('[data-questline-card="1"]')) return;
  mounting = true;
  try {
    const result = await api<{ scores: IssueScore[] }>("/issues/score", { method: "POST", body: JSON.stringify({ issueUrls: [location.href.split(/[?#]/)[0]] }) });
    const score = result.scores[0];
    if (!score || !document.body) return;
    let claim: Claim | null = null;
    let profile: UserProfile | null = null;
    try {
      const details = await api<{ claim: Claim | null }>(`/issues/${encodeURIComponent(score.issueNodeId)}`);
      claim = details.claim;
      profile = await api<UserProfile>("/users/me");
      // Opportunistic settle if a PR is already approved/merged.
      if (claim?.status === "submitted") {
        const refreshed = await api<SubmitResponse>(`/claims/${claim.id}/refresh`, { method: "POST" }).catch(() => null);
        if (refreshed) claim = refreshed.claim;
      }
    } catch { /* Signed-out visitors still see the quest. */ }
    renderCard(score, claim, profile);
  } catch (error) { console.warn("Questline could not mount the quest card", error); }
  finally { mounting = false; }
}

async function renderCard(score: IssueScore, initialClaim: Claim | null, initialProfile: UserProfile | null) {
  const card = document.createElement("aside");
  card.className = "ql-card";
  card.dataset.questline = "1";
  card.dataset.questlineRoot = "1";
  card.dataset.questlineCard = "1";
  if (await storage.collapsed()) card.classList.add("ql-collapsed");

  let claim = initialClaim;
  let profile = initialProfile;

  const draw = () => {
    const progress = profile ? Math.min(100, (profile.xpIntoLevel / Math.max(1, profile.xpForNextLevel)) * 100) : 0;
    const finished = claim?.status === "merged";
    const awarded = claim?.xpAwarded ?? 0;
    const bigValue = finished && awarded > 0 ? awarded : score.xp;
    const kicker = !claim || claim.status === "abandoned" || claim.status === "closed"
      ? "QUEST BOUNTY"
      : claim.status === "submitted" ? "AWAITING APPROVAL"
      : claim.status === "merged" ? "XP EARNED"
      : "QUEST BOUNTY";

    card.innerHTML = `
      <button class="ql-collapse" aria-label="Collapse Questline">⌄</button>
      <div class="ql-orb"><span>Q</span><b>${bigValue >= 1000 ? `${(bigValue / 1000).toFixed(bigValue % 1000 === 0 ? 0 : 1)}k` : bigValue}</b></div>
      <div class="ql-card-body">
        <div class="ql-kicker"><i></i>${kicker}</div>
        <h3 class="ql-title">${escapeHtml(score.title)}</h3>
        <div class="ql-big-xp">${bigValue.toLocaleString()}<small> XP</small></div>
        <div class="ql-meta">${escapeHtml(score.repoFullName)} <span>#${score.issueNumber}</span> · open ${score.daysOpen} ${score.daysOpen === 1 ? "day" : "days"}</div>
        ${skillsMarkup(score)}
        ${objectivesMarkup(score)}
        <div class="ql-action">${actionMarkup(claim)}</div>
        <p class="ql-error" hidden></p>
        <div class="ql-footer">${footerMarkup(profile, progress)}</div>
      </div>`;
    card.querySelector(".ql-collapse")?.addEventListener("click", async () => {
      card.classList.toggle("ql-collapsed");
      await storage.setCollapsed(card.classList.contains("ql-collapsed"));
    });
    wireAction();
  };

  const refreshProfile = async () => {
    try { profile = await api<UserProfile>("/users/me"); } catch { /* Keep the previous profile. */ }
  };

  const settle = async (response: SubmitResponse) => {
    claim = response.claim;
    if (response.completion) await playQuestComplete(response.completion, score);
    await refreshProfile();
    draw();
    if (!response.completion && response.pending) note(response.pending);
  };

  const note = (message: string) => {
    const target = card.querySelector<HTMLElement>(".ql-action");
    if (!target) return;
    const line = document.createElement("p");
    line.className = "ql-note";
    line.textContent = message;
    target.after(line);
  };

  const wireAction = () => {
    const refresh = card.querySelector<HTMLButtonElement>(".ql-refresh");
    if (refresh && claim) {
      refresh.addEventListener("click", () => run(refresh, async () => {
        const response = await api<SubmitResponse>(`/claims/${claim!.id}/refresh`, { method: "POST" });
        await settle(response);
      }));
    }

    const button = card.querySelector<HTMLButtonElement>(".ql-primary");
    if (!button || button.disabled) return;
    button.addEventListener("click", async () => {
      if (!profile) { window.open(dashboardPath("/pair"), "_blank"); return; }

      if (!claim || claim.status === "abandoned" || claim.status === "closed") {
        await run(button, async () => {
          claim = (await api<{ claim: Claim }>("/claims", { method: "POST", body: JSON.stringify({ issueNodeId: score.issueNodeId }) })).claim;
          draw();
        });
        return;
      }

      if (claim.status === "claimed") {
        const action = card.querySelector(".ql-action")!;
        action.innerHTML = '<div class="ql-pr-row"><input class="ql-pr-input" type="url" placeholder="https://github.com/org/repo/pull/123" aria-label="Pull request URL"><button class="ql-primary">Link</button></div>';
        const submit = action.querySelector<HTMLButtonElement>("button")!;
        submit.addEventListener("click", () => run(submit, async () => {
          const prUrl = action.querySelector<HTMLInputElement>("input")!.value;
          const response = await api<SubmitResponse>(`/claims/${claim!.id}/submit`, { method: "POST", body: JSON.stringify({ prUrl }) });
          await settle(response);
        }));
      }
    });
  };

  const run = async (button: HTMLButtonElement, work: () => Promise<void>) => {
    const error = card.querySelector<HTMLElement>(".ql-error")!;
    button.disabled = true;
    const prior = button.textContent;
    button.textContent = "Working…";
    try { await work(); }
    catch (reason) {
      error.hidden = false;
      error.textContent = reason instanceof Error ? reason.message : "Something went wrong";
      button.disabled = false;
      button.textContent = prior;
    }
  };

  document.body.append(card);
  draw();
}

function skillsMarkup(score: IssueScore) {
  if (!score.skills.length) return "";
  const skills = score.skills
    .map((skill) => `<span class="ql-skill">${escapeHtml(skill.name)} <b>${roman(skill.requiredLevel)}</b></span>`)
    .join("");
  return `<div class="ql-section"><div class="ql-section-label">REQUIRED SKILLS</div><div class="ql-skills">${skills}</div></div>`;
}

function objectivesMarkup(score: IssueScore) {
  const objectives = score.analysis?.objectives ?? [];
  if (!objectives.length) return "";
  const items = objectives.slice(0, 4).map((objective) => `<li>${escapeHtml(objective)}</li>`).join("");
  return `<div class="ql-section"><div class="ql-section-label">OBJECTIVES</div><ul class="ql-objectives">${items}</ul></div>`;
}

function actionMarkup(claim: Claim | null) {
  if (!claim || claim.status === "abandoned" || claim.status === "closed") {
    const label = claim?.status === "closed" ? "Try again" : "Accept";
    return `<button class="ql-primary">${label} <span>→</span></button>`;
  }
  if (claim.status === "claimed") {
    return '<div class="ql-status"><b>QUEST ACCEPTED</b><span>Status: IN PROGRESS</span></div><button class="ql-primary">Link your PR <span>→</span></button>';
  }
  if (claim.status === "submitted") {
    return `<div class="ql-status"><b>IN REVIEW</b><span>XP unlocks when a maintainer approves or merges.</span></div><button class="ql-primary ql-review ql-refresh" type="button">Check approval status</button>`;
  }
  const awarded = claim.xpAwarded ?? 0;
  return `<div class="ql-status"><b>QUEST COMPLETE</b><span>PR approved — XP awarded.</span></div><button class="ql-primary ql-complete" disabled>✓ Complete <span>+${awarded.toLocaleString()} XP</span></button>`;
}

function footerMarkup(profile: UserProfile | null, progress: number) {
  if (!profile) return "<span>Pair the extension to claim this quest</span>";
  return `<div><span>LEVEL ${profile.level}</span><strong>${profile.user.totalXp.toLocaleString()} XP</strong></div><div class="ql-progress"><i style="width:${progress}%"></i></div>`;
}

async function playQuestComplete(completion: QuestCompletion, _score: IssueScore) {
  const overlay = document.createElement("div");
  overlay.className = "ql-gain";
  overlay.dataset.questlineRoot = "1";
  overlay.innerHTML = `
    <div class="ql-particles"></div>
    <div class="ql-gain-label">QUEST COMPLETE</div>
    <div class="ql-gain-quest">${escapeHtml(completion.questTitle)}</div>
    <div class="ql-gain-number">+0 XP</div>
    <div class="ql-gain-bar"><i></i></div>
    <div class="ql-gain-rows"></div>
    <button class="ql-gain-next" hidden>Find next quest →</button>`;
  document.body.append(overlay);

  const particles = overlay.querySelector(".ql-particles")!;
  for (let i = 0; i < 28; i++) {
    const dot = document.createElement("i");
    const angle = (Math.PI * 2 * i) / 28;
    dot.style.setProperty("--x", `${Math.cos(angle) * (120 + Math.random() * 180)}px`);
    dot.style.setProperty("--y", `${Math.sin(angle) * (120 + Math.random() * 180)}px`);
    dot.style.setProperty("--delay", `${Math.random() * 140}ms`);
    particles.append(dot);
  }

  const number = overlay.querySelector<HTMLElement>(".ql-gain-number")!;
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      number.textContent = `+${Math.floor(completion.xpAwarded * (1 - Math.pow(1 - t, 3))).toLocaleString()} XP`;
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });

  const bar = overlay.querySelector<HTMLElement>(".ql-gain-bar i")!;
  bar.style.width = `${Math.min(100, (completion.xpIntoLevel / Math.max(1, completion.xpForNextLevel)) * 100)}%`;

  const rows = overlay.querySelector<HTMLElement>(".ql-gain-rows")!;
  const reveal = async (className: string, label: string, value: string) => {
    const row = document.createElement("div");
    row.className = `ql-gain-row ${className}`;
    row.innerHTML = `<b>${label}</b><strong>${escapeHtml(value)}</strong>`;
    rows.append(row);
    await new Promise((resolve) => setTimeout(resolve, 420));
  };

  if (completion.levelAfter > completion.levelBefore) {
    await reveal("ql-gain-level", "LEVEL UP", `LEVEL ${completion.levelBefore} → ${completion.levelAfter}`);
  }
  for (const skill of completion.skillUps.filter((entry) => entry.levelAfter > entry.levelBefore)) {
    await reveal("ql-gain-skill", "SKILL LEVEL UP", `${skill.name.toUpperCase()} ${roman(skill.levelBefore)} → ${roman(skill.levelAfter)}`);
  }
  for (const achievement of completion.achievements) {
    await reveal("ql-gain-achievement", "ACHIEVEMENT UNLOCKED", achievement.name.toUpperCase());
  }
  if (completion.rankBefore && completion.rankAfter && completion.rankAfter < completion.rankBefore) {
    await reveal("ql-gain-rank", "GLOBAL RANK", `#${completion.rankBefore} → #${completion.rankAfter}`);
  }

  const next = overlay.querySelector<HTMLButtonElement>(".ql-gain-next")!;
  next.hidden = false;
  next.addEventListener("click", () => window.open(dashboardPath("/next"), "_blank"));

  await new Promise<void>((resolve) => {
    const dismiss = () => resolve();
    overlay.addEventListener("click", (event) => { if (event.target === overlay) dismiss(); });
    setTimeout(dismiss, 9000);
  });
  overlay.classList.add("ql-gain-out");
  setTimeout(() => overlay.remove(), 350);
}

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]!);
