import type { Claim, IssueScore, UserProfile } from "@questline/shared";
import { XP_LADDER } from "@questline/shared";
import { api } from "../lib/api";
import { storage } from "../lib/storage";

let mounting = false;

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
    } catch { /* Signed-out visitors still see the bounty. */ }
    renderCard(score, claim, profile);
  } catch (error) { console.warn("Questline could not mount the quest card", error); }
  finally { mounting = false; }
}

async function renderCard(score: IssueScore, initialClaim: Claim | null, profile: UserProfile | null) {
  const card = document.createElement("aside");
  card.className = "ql-card";
  card.dataset.questline = "1";
  card.dataset.questlineRoot = "1";
  card.dataset.questlineCard = "1";
  if (await storage.collapsed()) card.classList.add("ql-collapsed");
  let claim = initialClaim;
  const rung = Math.max(0, XP_LADDER.indexOf(score.xp as typeof XP_LADDER[number]));
  card.style.setProperty("--ql-accent", `var(--ql-rung-${rung})`);

  const draw = () => {
    const progress = profile ? Math.min(100, profile.xpIntoLevel / profile.xpForNextLevel * 100) : 0;
    card.innerHTML = `
      <button class="ql-collapse" aria-label="Collapse Questline">⌄</button>
      <div class="ql-orb"><span>Q</span><b>${score.xp >= 1000 ? `${score.xp / 1000}k` : score.xp}</b></div>
      <div class="ql-card-body">
        <div class="ql-kicker">QUEST BOUNTY</div>
        <div class="ql-big-xp">${score.xp.toLocaleString()}<small> XP</small></div>
        <div class="ql-meta">${escapeHtml(score.repoFullName)} <span>#${score.issueNumber}</span></div>
        <div class="ql-age"><i></i> Open ${score.daysOpen} ${score.daysOpen === 1 ? "day" : "days"}</div>
        <div class="ql-action">${actionMarkup(claim)}</div>
        <p class="ql-error" hidden></p>
        <div class="ql-footer">${profile ? `<div><span>LEVEL ${profile.level}</span><strong>${profile.user.totalXp.toLocaleString()} XP</strong></div><div class="ql-progress"><i style="width:${progress}%"></i></div>` : '<span>Pair the extension to claim this quest</span>'}</div>
      </div>`;
    card.querySelector(".ql-collapse")?.addEventListener("click", async () => {
      card.classList.toggle("ql-collapsed");
      await storage.setCollapsed(card.classList.contains("ql-collapsed"));
    });
    wireAction();
  };

  const wireAction = () => {
    const button = card.querySelector<HTMLButtonElement>(".ql-primary");
    if (!button || button.disabled) return;
    button.addEventListener("click", async () => {
      if (!profile) { window.open(`${import.meta.env.VITE_DASHBOARD_URL || "http://localhost:5173"}/pair`, "_blank"); return; }
      if (!claim) {
        await run(button, async () => {
          claim = (await api<{ claim: Claim }>("/claims", { method: "POST", body: JSON.stringify({ issueNodeId: score.issueNodeId }) })).claim;
          draw();
        });
      } else if (claim.status === "claimed") {
        const action = card.querySelector(".ql-action")!;
        action.innerHTML = '<div class="ql-pr-row"><input class="ql-pr-input" type="url" placeholder="https://github.com/org/repo/pull/123" aria-label="Pull request URL"><button class="ql-primary">Submit</button></div>';
        const submit = action.querySelector<HTMLButtonElement>("button")!;
        submit.addEventListener("click", () => run(submit, async () => {
          const prUrl = action.querySelector<HTMLInputElement>("input")!.value;
          const response = await api<{ claim: Claim; xpAwarded: number }>(`/claims/${claim!.id}/submit`, { method: "POST", body: JSON.stringify({ prUrl }) });
          claim = response.claim;
          await playXpGain(response.xpAwarded, profile!);
          profile = await api<UserProfile>("/users/me");
          draw();
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
    catch (reason) { error.hidden = false; error.textContent = reason instanceof Error ? reason.message : "Something went wrong"; button.disabled = false; button.textContent = prior; }
  };

  document.body.append(card);
  draw();
}

function actionMarkup(claim: Claim | null) {
  if (!claim) return '<button class="ql-primary">Claim quest <span>→</span></button>';
  if (claim.status === "claimed") return '<button class="ql-primary">Link your PR <span>→</span></button>';
  const awarded = claim.xpAwarded ?? (claim as Claim & { xp_awarded?: number }).xp_awarded ?? 0;
  return `<button class="ql-primary ql-complete" disabled>✓ Complete <span>+${awarded.toLocaleString()} XP</span></button>`;
}

async function playXpGain(amount: number, before: UserProfile) {
  const overlay = document.createElement("div");
  overlay.className = "ql-gain";
  overlay.dataset.questlineRoot = "1";
  overlay.innerHTML = '<div class="ql-particles"></div><div class="ql-gain-label">QUEST COMPLETE</div><div class="ql-gain-number">+0 XP</div><div class="ql-level-up" hidden>LEVEL UP</div>';
  document.body.append(overlay);
  const particles = overlay.querySelector(".ql-particles")!;
  for (let i = 0; i < 28; i++) {
    const dot = document.createElement("i");
    const angle = Math.PI * 2 * i / 28;
    dot.style.setProperty("--x", `${Math.cos(angle) * (120 + Math.random() * 180)}px`);
    dot.style.setProperty("--y", `${Math.sin(angle) * (120 + Math.random() * 180)}px`);
    dot.style.setProperty("--delay", `${Math.random() * 140}ms`);
    particles.append(dot);
  }
  const target = overlay.querySelector<HTMLElement>(".ql-gain-number")!;
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 800);
      target.textContent = `+${Math.floor(amount * (1 - Math.pow(1 - t, 3))).toLocaleString()} XP`;
      if (t < 1) requestAnimationFrame(tick); else resolve();
    };
    requestAnimationFrame(tick);
  });
  const crossesLevel = before.xpIntoLevel + amount >= before.xpForNextLevel;
  if (crossesLevel) { const banner = overlay.querySelector<HTMLElement>(".ql-level-up")!; banner.hidden = false; await new Promise((r) => setTimeout(r, 600)); }
  await new Promise((r) => setTimeout(r, 450));
  overlay.classList.add("ql-gain-out");
  setTimeout(() => overlay.remove(), 350);
}

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]!);
