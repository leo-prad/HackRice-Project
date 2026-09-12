import { motion, useInView } from "framer-motion";
import { type ReactNode, useRef } from "react";
import { ACCENT, EASE } from "./colors";

const sources = [
  {
    label: "Syllabus",
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M3.5 13.5V3.5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v10" stroke={ACCENT} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M5.8 5.5h4.4M5.8 8h4.4M5.8 10.5h2.6" stroke={ACCENT} strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
      </svg>
    ),
  },
  {
    label: "Inbox",
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2.5 9h3l1 1.6h3L10.5 9h3" stroke={ACCENT} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2.5" y="3.5" width="11" height="9.5" rx="2" stroke={ACCENT} strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    label: "Policies",
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 2.5 13 4.5v3.6c0 3-2 5-5 5.9-3-.9-5-2.9-5-5.9V4.5z" stroke={ACCENT} strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M5.8 7.8l1.6 1.6 2.8-3" stroke={ACCENT} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Calendar",
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="2.5" y="3.5" width="11" height="10" rx="2" stroke={ACCENT} strokeWidth="1.3" />
        <path d="M2.5 6.8h11M5.5 2.5v2M10.5 2.5v2" stroke={ACCENT} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Lecture notes",
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2.8 11.5 10 4.3a1.5 1.5 0 0 1 2.1 2.1l-7.2 7.2-2.8.7z" stroke={ACCENT} strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Students",
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="5.5" r="2.3" stroke={ACCENT} strokeWidth="1.3" />
        <path d="M3.5 13a4.5 4.5 0 0 1 9 0" stroke={ACCENT} strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

const topRow = sources.slice(0, 3);
const bottomRow = sources.slice(3);

function SourceTile({
  label,
  icon,
  index,
  inView,
}: {
  label: string;
  icon: ReactNode;
  index: number;
  inView: boolean;
}) {
  return (
    <motion.div
      className="flex min-h-[92px] flex-col items-center justify-center gap-2.5 rounded-2xl border border-land-border bg-white px-3 py-4 shadow-land-card sm:min-h-[100px]"
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.55, delay: 0.08 + index * 0.06, ease: EASE }}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-land-accent-soft">
        {icon}
      </span>
      <span className="text-center font-landing-body text-[12px] font-medium leading-tight text-land-ink sm:text-[13px]">
        {label}
      </span>
    </motion.div>
  );
}

function ConnectorColumn({ inView, delay }: { inView: boolean; delay: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-1">
      <motion.span
        className="h-5 w-px bg-gradient-to-b from-land-border to-land-accent/35"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={inView ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
        transition={{ duration: 0.4, delay, ease: EASE }}
        style={{ originY: 0 }}
      />
      <motion.span
        className="my-1 h-1.5 w-1.5 rounded-full bg-land-accent/40"
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 0.35, delay: delay + 0.12, ease: EASE }}
      />
      <motion.span
        className="h-5 w-px bg-gradient-to-b from-land-accent/35 to-land-border"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={inView ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
        transition={{ duration: 0.4, delay: delay + 0.06, ease: EASE }}
        style={{ originY: 0 }}
      />
    </div>
  );
}

export default function ConnectedContext() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <div ref={ref} className="mx-auto mt-12 max-w-[640px]">
      <div className="rounded-[28px] border border-land-border bg-land-canvas/60 p-4 shadow-land-card backdrop-blur-sm sm:p-5">
        {/* Top row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {topRow.map((source, i) => (
            <SourceTile key={source.label} {...source} index={i} inView={inView} />
          ))}
        </div>

        {/* Connectors + hub */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <ConnectorColumn inView={inView} delay={0.28} />
          <ConnectorColumn inView={inView} delay={0.34} />
          <ConnectorColumn inView={inView} delay={0.4} />
        </div>

        <motion.div
          className="relative overflow-hidden rounded-2xl border border-land-accent/20 bg-white px-5 py-5 text-center shadow-land-card sm:py-6"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.65, delay: 0.32, ease: EASE }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(79,70,229,0.06) 0%, transparent 70%)",
            }}
          />
          <div className="relative flex items-center justify-center gap-3">
            <span className="hidden h-px flex-1 bg-gradient-to-r from-transparent to-land-accent/25 sm:block" aria-hidden />
            <div>
              <p className="font-landing-display text-xl font-semibold italic tracking-tight text-land-accent sm:text-[1.35rem]">
                Incuria
              </p>
              <p className="mt-1 font-landing-body text-[11px] font-medium uppercase tracking-[0.18em] text-land-ink-faint">
                Your teaching context
              </p>
            </div>
            <span className="hidden h-px flex-1 bg-gradient-to-l from-transparent to-land-accent/25 sm:block" aria-hidden />
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <ConnectorColumn inView={inView} delay={0.48} />
          <ConnectorColumn inView={inView} delay={0.54} />
          <ConnectorColumn inView={inView} delay={0.6} />
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {bottomRow.map((source, i) => (
            <SourceTile key={source.label} {...source} index={i + 3} inView={inView} />
          ))}
        </div>
      </div>
    </div>
  );
}
