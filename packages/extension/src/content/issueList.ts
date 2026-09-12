import type { IssueScore } from "@questline/shared";
import { XP_LADDER } from "@questline/shared";
import { api } from "../lib/api";

const canonical = (href: string) => {
  const url = new URL(href, location.origin);
  return `${url.origin}${url.pathname.replace(/\/$/, "")}`;
};

export async function mountIssueList() {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
    .filter((a) => /^\/[^/]+\/[^/]+\/issues\/\d+$/.test(new URL(a.href).pathname))
    .filter((a, i, all) => all.findIndex((other) => canonical(other.href) === canonical(a.href)) === i)
    .slice(0, 30);
  const fresh = links.filter((link) => !link.parentElement?.querySelector(':scope > [data-questline="1"]'));
  if (!fresh.length) return;
  const chips = new Map<string, HTMLElement>();
  for (const link of fresh) {
    const chip = document.createElement("span");
    chip.className = "ql-chip ql-skeleton";
    chip.dataset.questline = "1";
    chip.dataset.questlineRoot = "1";
    chip.innerHTML = '<span class="ql-chip-xp">•••</span><span class="ql-chip-label">XP</span>';
    link.insertAdjacentElement("afterend", chip);
    chips.set(canonical(link.href), chip);
  }
  try {
    const result = await api<{ scores: IssueScore[] }>("/issues/score", { method: "POST", body: JSON.stringify({ issueUrls: [...chips.keys()] }) });
    for (const score of result.scores) {
      const chip = chips.get(canonical(score.issueUrl));
      if (!chip) continue;
      const rung = XP_LADDER.indexOf(score.xp as typeof XP_LADDER[number]);
      chip.className = `ql-chip ql-rung-${Math.max(0, rung)}`;
      chip.innerHTML = `<span class="ql-chip-xp">${score.xp.toLocaleString()}</span><span class="ql-chip-label">XP</span>`;
    }
    for (const [url, chip] of chips) if (!result.scores.some((score) => canonical(score.issueUrl) === url)) chip.remove();
  } catch (error) {
    console.warn("Questline could not score this issue list", error);
    chips.forEach((chip) => chip.remove());
  }
}
