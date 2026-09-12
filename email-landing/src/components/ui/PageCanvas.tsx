import { brandClasses } from "../../theme/brand";

type Props = {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  scroll?: boolean;
  /** Marketing pages use land-* tokens; in-app aux pages use incuria workbench chrome. */
  variant?: "marketing" | "workbench";
};

export function PageCanvas({
  children,
  className = "",
  gradient = true,
  scroll = true,
  variant = "marketing",
}: Props) {
  const workbench = variant === "workbench";
  const surface = workbench
    ? "bg-incuria-canvas font-landing-body text-incuria-ink"
    : `${brandClasses.canvas} ${brandClasses.body} text-land-ink`;

  return (
    <div
      className={`relative ${scroll ? "h-full overflow-y-auto" : ""} ${surface} ${className}`.trim()}
    >
      {gradient && !workbench ? <div className={brandClasses.pageGradient} aria-hidden /> : null}
      <div className="relative">{children}</div>
    </div>
  );
}
