/** In-page section targets. Navigation uses scroll, not URL hashes. */
export const LANDING_SECTION = {
  TOP: "top",
  HERO: "hero",
  FEATURES: "features",
  PRICING: "pricing",
  FAQ: "faq",
} as const;

export type LandingScrollState = {
  scrollTo?: string;
};

const NAV_OFFSET = 88;

export function scrollToLandingSection(sectionId: string): void {
  if (sectionId === LANDING_SECTION.TOP || sectionId === LANDING_SECTION.HERO) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const el = document.getElementById(sectionId);
  if (!el) return;

  const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

/** Remove hash from the URL so refresh always loads from the top. */
export function stripUrlHash(): void {
  if (!window.location.hash) return;
  window.history.replaceState(
    window.history.state,
    "",
    window.location.pathname + window.location.search,
  );
}
