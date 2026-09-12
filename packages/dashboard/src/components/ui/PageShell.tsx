import { MotionConfig } from "framer-motion";
import { type ReactNode } from "react";
import ScrollReveal from "../../motion/ScrollReveal";

type Props = {
  children: ReactNode;
  className?: string;
  /** Reveal the whole page shell on mount (dashboard routes). */
  reveal?: boolean;
};

/** Consistent page chrome for authenticated dashboard routes. */
export default function PageShell({ children, className = "", reveal = true }: Props) {
  const body = (
    <div className={`relative mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16 ${className}`.trim()}>
      {children}
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-[calc(100vh-4rem)] overflow-x-hidden bg-void font-body text-snow antialiased">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[320px]"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% -10%, rgba(255,107,53,0.09) 0%, transparent 70%)",
          }}
        />
        {reveal ? <ScrollReveal className="relative">{body}</ScrollReveal> : <div className="relative">{body}</div>}
      </div>
    </MotionConfig>
  );
}
