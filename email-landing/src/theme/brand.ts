/**
 * Shared Incuria design tokens — single source for landing + authenticated app.
 * Tailwind classes use the `land-*` and remapped `incuria-*` namespaces;
 * hex values here are for inline SVG / JS where classes can't reach.
 */
export const brand = {
  canvas: "#FAF9F6",
  surface: "#FFFFFF",
  ink: "#14141B",
  inkMuted: "#5C5C66",
  inkFaint: "#9A9AA3",
  border: "#E8E6E0",
  accent: "#4F46E5",
  accentHover: "#4338CA",
  accentDeep: "#3730A3",
  accentSoft: "#EEEDFC",
  select: "#EEEDFC",
  selectRing: "#C9C5F4",
  needsReply: "#D1453B",
  needsReplySoft: "#FBEAE8",
  batch: "#4F46E5",
  batchSoft: "#EEEDFC",
  sideBg: "#17171E",
  sideInk: "#F2F2F7",
  sideInkMuted: "#9A9AA0",
} as const;

/** Accent at fixed alphas — illustrations and gradients. */
export const accentAlpha = {
  a04: "rgba(79, 70, 229, 0.04)",
  a06: "rgba(79, 70, 229, 0.06)",
  a10: "rgba(79, 70, 229, 0.10)",
  a14: "rgba(79, 70, 229, 0.14)",
  a20: "rgba(79, 70, 229, 0.20)",
  a28: "rgba(79, 70, 229, 0.28)",
} as const;

/** Ink at fixed alphas — skeleton lines inside mockups. */
export const inkAlpha = {
  i08: "rgba(20, 20, 27, 0.08)",
  i14: "rgba(20, 20, 27, 0.14)",
  i22: "rgba(20, 20, 27, 0.22)",
} as const;

/** Shared motion language (framer-motion). */
export const EASE = [0.22, 1, 0.36, 1] as const;
export const VIEWPORT = { once: true, amount: 0.25 } as const;

export const motionDuration = {
  fast: 0.18,
  base: 0.28,
  slow: 0.4,
} as const;

/** Reusable Tailwind class fragments. */
export const brandClasses = {
  canvas: "bg-land-canvas",
  surface: "bg-land-surface",
  ink: "text-land-ink",
  inkMuted: "text-land-ink-muted",
  inkFaint: "text-land-ink-faint",
  border: "border-land-border",
  display: "font-landing-display",
  body: "font-landing-body",
  card:
    "rounded-2xl border border-land-border bg-land-surface shadow-land-card transition-shadow hover:shadow-land-card-hover",
  tag: "rounded-full bg-land-accent-soft px-2 py-0.5 font-landing-body text-[11px] font-medium text-land-accent-deep",
  eyebrow:
    "font-landing-body text-[11px] font-medium uppercase tracking-[0.22em] text-land-ink-faint",
  headline:
    "font-landing-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-tight tracking-[-0.02em] text-land-ink",
  bodyLead: "font-landing-body leading-[1.75] text-land-ink-muted",
  btnPrimary:
    "inline-flex items-center justify-center rounded-full bg-land-ink px-5 py-2.5 font-landing-body text-sm font-medium text-white transition-colors hover:bg-land-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-land-accent",
  btnSecondary:
    "inline-flex items-center justify-center rounded-full border border-land-border bg-land-surface px-5 py-2.5 font-landing-body text-sm font-medium text-land-ink transition-colors hover:border-land-accent/30 hover:bg-land-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-land-accent",
  btnGhost:
    "inline-flex items-center justify-center rounded-full px-3 py-1.5 font-landing-body text-sm font-medium text-land-accent transition-colors hover:bg-land-accent-soft hover:text-land-accent-deep",
  pageGradient:
    "pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(79,70,229,0.08),transparent_70%)]",
} as const;

// Backward-compatible aliases used by landing illustrations.
export const ACCENT = brand.accent;
export const ACCENT_DEEP = brand.accentDeep;
export const INK = brand.ink;
export const PAPER = brand.canvas;
export const A04 = accentAlpha.a04;
export const A06 = accentAlpha.a06;
export const A10 = accentAlpha.a10;
export const A14 = accentAlpha.a14;
export const A20 = accentAlpha.a20;
export const A28 = accentAlpha.a28;
export const INK08 = inkAlpha.i08;
export const INK14 = inkAlpha.i14;
export const INK22 = inkAlpha.i22;
