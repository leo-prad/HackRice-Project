import { scrollToLandingSection } from "../../lib/landingScroll";

type Props = {
  label: string;
  sectionId: string;
  className?: string;
};

export function LandingNavButton({ label, sectionId, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={() => scrollToLandingSection(sectionId)}
      className={
        className ||
        "font-landing-body text-sm font-medium text-land-ink-muted transition-colors duration-200 hover:text-land-ink"
      }
    >
      {label}
    </button>
  );
}
