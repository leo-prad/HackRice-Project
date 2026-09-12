import type { Rarity } from "@questline/shared";
import { rarityLabel } from "@questline/shared";

export const RARITY_STYLE: Record<Rarity, string> = {
  common: "text-slate-300 border-slate-500/40 bg-slate-500/10",
  rare: "text-sky-300 border-sky-400/40 bg-sky-400/10",
  epic: "text-violet-300 border-violet-400/40 bg-violet-400/10",
  legendary: "text-amber-300 border-amber-400/40 bg-amber-400/10",
  mythic: "text-rose-300 border-rose-400/40 bg-rose-400/10",
};

export const RARITY_GLOW: Record<Rarity, string> = {
  common: "shadow-[0_0_24px_rgba(148,163,184,.12)]",
  rare: "shadow-[0_0_28px_rgba(56,189,248,.16)]",
  epic: "shadow-[0_0_28px_rgba(167,139,250,.18)]",
  legendary: "shadow-[0_0_28px_rgba(251,191,36,.18)]",
  mythic: "shadow-[0_0_32px_rgba(251,113,133,.22)]",
};

export { rarityLabel };
