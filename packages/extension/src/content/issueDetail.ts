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
    const finished = claim && claim.status === "merged";
    const awarded = claim ? (claim.xpAwarded ?? (claim as Claim & { xp_awarded?: number }).xp_awarded ?? 0) : 0;
    // While the PR sits in review, keep the big number as the bounty on the
    // line so the user still sees what's on the table; once the claim
    // settles, the big number becomes the actual XP that landed.
    const bigValue = finished ? awarded : score.xp;
    const kicker = !claim ? "QUEST BOUNTY"
      : claim.status === "submitted" ? "AWAITING APPROVAL"
      : claim.status === "merged" ? "XP EARNED"
      : claim.status === "closed" ? "PR CLOSED - RE-CLAIM"
      : "QUEST BOUNTY";
    card.innerHTML = `
      <button class="ql-collapse" aria-label="Collapse Questline">⌄</button>
      <div class="ql-orb"><span>Q</span><b>${bigValue >= 1000 ? `${bigValue / 1000}k` : bigValue}</b></div>
      <div class="ql-card-body">
        <div class="ql-kicker">${kicker}</div>
        <div class="ql-big-xp">${bigValue.toLocaleString()}<small> XP</small></div>
        <div class="ql-meta">${escapeHtml(score.repoFullName)} <span>#${score.issueNumber}</span>${finished && awarded !== score.xp ? ` <span class="ql-of-bounty">of ${score.xp.toLocaleString()} bounty</span>` : ""}</div>
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
          profile = await api<UserProfile>("/users/me");
          if (response.xpAwarded > 0) await playXpGain(response.xpAwarded, profile);
          else showToast("PR submitted — XP will unlock once a maintainer approves it.");
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
  if (!claim || claim.status === "abandoned" || claim.status === "closed") {
    const label = claim?.status === "closed" ? "Try again" : "Claim quest";
    return `<button class="ql-primary">${label} <span>→</span></button>`;
  }
  if (claim.status === "claimed") return '<button class="ql-primary">Link your PR <span>→</span></button>';
  const awarded = claim.xpAwarded ?? (claim as Claim & { xp_awarded?: number }).xp_awarded ?? 0;
  if (claim.status === "submitted") return `<button class="ql-primary ql-review" disabled>⏳ In Review <span>Awaiting approval</span></button>`;
  return `<button class="ql-primary ql-complete" disabled>✓ Complete <span>+${awarded.toLocaleString()} XP</span></button>`;
}

export function showToast(message: string) {
  const toast = document.createElement("div");
  toast.className = "ql-toast";
  toast.dataset.questlineRoot = "1";
  toast.textContent = message;
  document.body.append(toast);
  requestAnimationFrame(() => toast.classList.add("ql-toast-in"));
  setTimeout(() => {
    toast.classList.remove("ql-toast-in");
    setTimeout(() => toast.remove(), 400);
  }, 3600);
}

export async function playXpGain(amount: number, after: UserProfile) {
  const overlay = document.createElement("div");
  overlay.className = "ql-gain";
  overlay.dataset.questlineRoot = "1";
  const targetPct = Math.min(100, after.xpIntoLevel / after.xpForNextLevel * 100);
  overlay.innerHTML = `
    <div class="ql-edge ql-edge-left"></div>
    <div class="ql-edge ql-edge-right"></div>
    <div class="ql-gain-body">
      <div class="ql-gain-label">ISSUE RESOLVED</div>
      <div class="ql-gain-number">+0 XP</div>
      <div class="ql-level-up" hidden>LEVEL UP</div>
      <div class="ql-gain-bar">
        <div class="ql-gain-bar-labels"><span>LEVEL ${after.level}</span><span>LEVEL ${after.level + 1}</span></div>
        <div class="ql-gain-bar-track"><i style="width:0%"></i></div>
        <div class="ql-gain-bar-meta"><span>${after.xpIntoLevel.toLocaleString()} XP</span><span>${after.xpForNextLevel.toLocaleString()} XP</span></div>
      </div>
      <div class="ql-gain-hint">Click anywhere to dismiss</div>
    </div>`;
  document.body.append(overlay);

  const spawnEdgeConfetti = (edge: HTMLElement, dir: 1 | -1) => {
    for (let i = 0; i < 70; i++) {
      const piece = document.createElement("i");
      const width = 10 + Math.random() * 10;
      const height = 6 + Math.random() * 6;
      piece.style.top = `${Math.random() * 90 + 2}vh`;
      piece.style.setProperty("--push", `${dir * (14 + Math.random() * 32)}vw`);
      piece.style.setProperty("--sway", `${dir * (2 + Math.random() * 6)}vw`);
      piece.style.setProperty("--fall", `${80 + Math.random() * 40}vh`);
      piece.style.setProperty("--rot", `${dir * (240 + Math.random() * 540)}deg`);
      piece.style.setProperty("--duration", `${2600 + Math.random() * 1400}ms`);
      piece.style.setProperty("--delay", `${Math.random() * 900}ms`);
      piece.style.setProperty("--w", `${width}px`);
      piece.style.setProperty("--h", `${height}px`);
      piece.style.setProperty("--hue", `${[52, 152, 262, 32, 200, 340][i % 6]}`);
      edge.append(piece);
    }
  };
  spawnEdgeConfetti(overlay.querySelector<HTMLElement>(".ql-edge-left")!, 1);
  spawnEdgeConfetti(overlay.querySelector<HTMLElement>(".ql-edge-right")!, -1);

  const number = overlay.querySelector<HTMLElement>(".ql-gain-number")!;
  const barFill = overlay.querySelector<HTMLElement>(".ql-gain-bar-track i")!;
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      const eased = 1 - Math.pow(1 - t, 3);
      number.textContent = `+${Math.floor(amount * eased).toLocaleString()} XP`;
      barFill.style.width = `${targetPct * eased}%`;
      if (t < 1) requestAnimationFrame(tick); else resolve();
    };
    requestAnimationFrame(tick);
  });

  const crossedLevel = amount > 0 && after.xpIntoLevel < amount;
  if (crossedLevel) {
    const banner = overlay.querySelector<HTMLElement>(".ql-level-up")!;
    banner.hidden = false;
  }
  const hint = overlay.querySelector<HTMLElement>(".ql-gain-hint")!;
  setTimeout(() => hint.classList.add("ql-gain-hint-in"), 700);

  await new Promise<void>((resolve) => {
    const dismiss = () => {
      overlay.classList.add("ql-gain-out");
      setTimeout(() => { overlay.remove(); resolve(); }, 450);
    };
    overlay.addEventListener("click", dismiss, { once: true });
  });
}

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]!);
