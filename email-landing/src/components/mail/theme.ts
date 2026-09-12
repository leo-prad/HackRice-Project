/**
 * Mail UI class map — warm paper panes with indigo accent (aligned with landing).
 *
 * Neutral soft-indigo drives selection / active / focus; land-accent is reserved
 * for AI moments, unread indicators, and the primary AI CTA.
 */
export const mail = {
  page: "bg-incuria-canvas text-incuria-ink font-landing-body",
  panel: "bg-incuria-sidebar",
  panelAlt: "bg-incuria-surface",
  border: "border-incuria-border",
  borderStrong: "border-incuria-border",
  text: "text-incuria-ink",
  textMuted: "text-incuria-ink-muted",
  textSoft: "text-incuria-ink-muted",
  textDim: "text-incuria-ink-muted/70",
  hover: "hover:bg-incuria-ink/[0.04] transition-colors duration-200",
  active: "bg-incuria-select text-incuria-ink",
  activeRow: "bg-incuria-select text-incuria-ink",
  activeRowAccent: "bg-incuria-select text-incuria-ink ring-1 ring-incuria-select-ring",
  input:
    "border border-incuria-border bg-incuria-surface text-incuria-ink placeholder:text-incuria-ink-muted/70 focus:border-incuria-select-ring focus:outline-none focus:ring-2 focus:ring-incuria-ink/10 transition-all duration-200",
  btnCompose:
    "border border-white/10 bg-white/[0.08] text-incuria-side-ink hover:bg-white/[0.14] active:scale-[0.98] rounded-lg transition-all duration-200",
  btnPrimary:
    "border border-incuria-accent/20 bg-incuria-accent text-white hover:bg-incuria-accent-hover active:scale-[0.98] rounded-lg transition-all duration-200",
  btnSecondary:
    "border border-incuria-border bg-incuria-surface text-incuria-ink hover:bg-incuria-ink/[0.04] active:scale-[0.98] rounded-lg transition-all duration-200",
  btnGhost: "text-incuria-ink-muted hover:bg-incuria-ink/[0.05] hover:text-incuria-ink rounded-lg transition-all duration-200",
  summaryCard: "rounded-2xl border border-incuria-accent/20 bg-incuria-accent-soft/50 shadow-land-card",
  link: "text-incuria-ink-muted underline-offset-2 hover:text-incuria-ink hover:underline transition-colors duration-200",
  scroll: "scrollbar-mail overflow-y-auto overflow-x-hidden",
  kbd: "rounded-md border border-incuria-border bg-incuria-surface px-1.5 py-0.5 text-[10px] font-medium text-incuria-ink-muted shadow-sm",
  transition: "transition-all duration-200 ease-out",
  fadeIn: "animate-mail-fade-in",
} as const;

export const LIST_VISIBLE_ROWS = 6;
