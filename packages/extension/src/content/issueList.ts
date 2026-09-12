import type { Claim, IssueScore } from "@questline/shared";
import { api } from "../lib/api";
import { storage } from "../lib/storage";

type ClaimRecord = Claim & { issue_node_id?: string };

type IssueAction = {
  root: HTMLDivElement;
  pill: HTMLSpanElement;
  button: HTMLButtonElement;
};

const pending = new Set<string>();

const canonical = (href: string) => {
  const url = new URL(href, location.origin);
  return `${url.origin}${url.pathname.replace(/\/$/, "")}`;
};

const isIssueLink = (link: HTMLAnchorElement) =>
  /^\/[^/]+\/[^/]+\/issues\/\d+$/.test(new URL(link.href).pathname);

function findIssueRow(link: HTMLAnchorElement): HTMLElement | null {
  const knownRow = link.closest<HTMLElement>('[data-testid="issue-row"], .Box-row, [role="row"], li');
  if (knownRow) return knownRow;

  let candidate = link.parentElement;
  for (let depth = 0; candidate && candidate !== document.body && depth < 8; depth += 1) {
    const issueLinks = Array.from(candidate.querySelectorAll<HTMLAnchorElement>("a[href]")).filter(isIssueLink);
    const siblingRows = candidate.parentElement
      ? Array.from(candidate.parentElement.children).filter((child) =>
          Array.from(child.querySelectorAll<HTMLAnchorElement>("a[href]")).some(isIssueLink),
        )
      : [];
    if (issueLinks.length === 1 && siblingRows.length > 1) return candidate;
    candidate = candidate.parentElement;
  }
  return null;
}

function existingAction(row: HTMLElement, issueUrl: string) {
  return Array.from(row.querySelectorAll<HTMLElement>("[data-questline-issue-url]"))
    .some((node) => node.dataset.questlineIssueUrl === issueUrl);
}

function createAction(row: HTMLElement, issueUrl: string, issueTitle: string): IssueAction {
  row.classList.add("ql-issue-row");

  const root = document.createElement("div");
  root.className = "ql-list-actions";
  root.dataset.questline = "1";
  root.dataset.questlineRoot = "1";
  root.dataset.questlineIssueUrl = issueUrl;

  const pill = document.createElement("span");
  pill.className = "ql-list-xp ql-list-xp-loading";
  pill.textContent = "··· XP";
  pill.setAttribute("aria-label", `Loading XP for ${issueTitle}`);

  const button = document.createElement("button");
  button.className = "ql-accept-button";
  button.type = "button";
  button.textContent = "Accept";
  button.disabled = true;
  button.setAttribute("aria-label", `Accept ${issueTitle}`);

  root.append(pill, button);
  row.append(root);
  return { root, pill, button };
}

function claimIssueNodeId(claim: ClaimRecord) {
  return claim.issueNodeId ?? claim.issue_node_id;
}

function setClaimState(action: IssueAction, claim?: ClaimRecord) {
  action.button.disabled = false;
  action.button.classList.remove("ql-accept-button-done", "ql-accept-button-progress");
  if (!claim || claim.status === "abandoned" || claim.status === "closed") {
    action.button.textContent = "Accept";
    return;
  }

  action.button.disabled = true;
  if (claim.status === "claimed") {
    action.button.classList.add("ql-accept-button-progress");
    action.button.textContent = "In-Progress";
    return;
  }
  if (claim.status === "submitted") {
    action.button.classList.add("ql-accept-button-progress");
    action.button.textContent = "In-Review";
    return;
  }
  action.button.classList.add("ql-accept-button-done");
  action.button.textContent = "Accepted";
}

function setLoadError(action: IssueAction, error?: unknown) {
  action.pill.classList.remove("ql-list-xp-loading");
  action.pill.textContent = "XP unavailable";
  action.button.textContent = "Accept";
  action.button.disabled = true;
  if (error instanceof Error) action.root.title = error.message;
}

function wireAccept(action: IssueAction, score: IssueScore, initialClaim?: ClaimRecord) {
  let claim = initialClaim;
  setClaimState(action, claim);

  action.button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (claim && claim.status !== "abandoned") return;

    const token = await storage.token();
    if (!token) {
      window.open(`${import.meta.env.VITE_DASHBOARD_URL || "http://localhost:5173"}/pair`, "_blank");
      return;
    }

    action.button.disabled = true;
    action.button.textContent = "Accepting…";
    action.button.removeAttribute("title");
    try {
      claim = (await api<{ claim: ClaimRecord }>("/claims", {
        method: "POST",
        body: JSON.stringify({ issueNodeId: score.issueNodeId }),
      })).claim;
      setClaimState(action, claim);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not accept this issue";
      if (message.toLowerCase().includes("already have an active claim")) {
        action.button.classList.add("ql-accept-button-done");
        action.button.textContent = "Accepted";
      } else {
        action.button.disabled = false;
        action.button.textContent = "Retry";
        action.button.title = message;
      }
    }
  });
}

export async function mountIssueList() {
  const candidates = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
    .filter(isIssueLink)
    .filter((link, index, all) => all.findIndex((other) => canonical(other.href) === canonical(link.href)) === index)
    .slice(0, 30);

  const actions = new Map<string, IssueAction>();
  for (const link of candidates) {
    const issueUrl = canonical(link.href);
    const row = findIssueRow(link);
    if (!row || pending.has(issueUrl) || existingAction(row, issueUrl)) continue;
    pending.add(issueUrl);
    actions.set(issueUrl, createAction(row, issueUrl, link.textContent?.trim() || "issue"));
  }
  if (!actions.size) return;

  try {
    const token = await storage.token();
    const [scoreResult, claimResult] = await Promise.all([
      api<{ scores: IssueScore[] }>("/issues/score", {
        method: "POST",
        body: JSON.stringify({ issueUrls: [...actions.keys()] }),
      }),
      token
        ? api<{ claims: ClaimRecord[] }>("/claims/mine").catch(() => ({ claims: [] }))
        : Promise.resolve({ claims: [] as ClaimRecord[] }),
    ]);

    const claims = new Map(
      claimResult.claims
        .map((claim) => [claimIssueNodeId(claim), claim] as const)
        .filter((entry): entry is [string, ClaimRecord] => Boolean(entry[0])),
    );
    const scoredUrls = new Set<string>();

    for (const score of scoreResult.scores) {
      const issueUrl = canonical(score.issueUrl);
      const action = actions.get(issueUrl);
      if (!action || !action.root.isConnected) continue;
      scoredUrls.add(issueUrl);
      action.pill.classList.remove("ql-list-xp-loading");
      action.pill.textContent = `${score.xp.toLocaleString()} XP`;
      action.pill.setAttribute("aria-label", `${score.xp.toLocaleString()} XP`);
      wireAccept(action, score, claims.get(score.issueNodeId));
    }

    for (const [issueUrl, action] of actions) {
      if (!scoredUrls.has(issueUrl)) setLoadError(action);
    }
  } catch (error) {
    console.warn("Questline could not score this issue list", error);
    actions.forEach((action) => setLoadError(action, error));
  } finally {
    actions.forEach((_, issueUrl) => pending.delete(issueUrl));
  }
}
