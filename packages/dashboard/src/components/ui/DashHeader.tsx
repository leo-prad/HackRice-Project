import { type ReactNode } from "react";
import ScrollReveal from "../../motion/ScrollReveal";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
};

/** Compact section header for dashboard pages — same type language as landing. */
export default function DashHeader({ eyebrow, title, subtitle, action, className = "" }: Props) {
  return (
    <ScrollReveal className={`flex flex-col justify-between gap-6 sm:flex-row sm:items-end ${className}`.trim()}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow && (
          <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-mist">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[clamp(1.85rem,4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-snow">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 font-body text-[15px] leading-relaxed text-fog [text-wrap:balance]">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </ScrollReveal>
  );
}
