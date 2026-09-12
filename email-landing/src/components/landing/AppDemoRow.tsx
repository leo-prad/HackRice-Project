import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { ACCENT, EASE } from "./colors";
import SectionHeader from "./SectionHeader";
import { blurRevealChild, useParallaxY } from "./scrollMotion";

const recipients = ["DO", "MP", "SR", "JL", "AK"] as const;

function DemoPanel() {
  const [sent, setSent] = useState(false);
  const [hoverSend, setHoverSend] = useState(false);

  return (
    <div
      className="relative w-full max-w-[520px]"
      aria-label="Batch reply demo"
    >
      <div
        className="pointer-events-none absolute -inset-2 rounded-[24px] opacity-50 blur-xl"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 100%, rgba(79,70,229,0.16) 0%, transparent 70%)",
        }}
      />

      <div className="relative overflow-hidden rounded-[14px] border border-land-border/80 bg-white shadow-[0_20px_60px_-10px_rgba(23,23,30,0.2),0_0_0_1px_rgba(23,23,30,0.04)]">
        <div className="flex h-10 items-center gap-2 border-b border-land-border bg-[#F4F3F0] px-4">
          <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
          <span className="h-3 w-3 rounded-full bg-[#28C840]" />
          <span className="mx-auto font-landing-body text-[12px] font-medium text-land-ink-muted">
            Incuria · Batch reply · CS 3345
          </span>
          <span className="w-[52px]" aria-hidden />
        </div>

        <div className="min-h-[340px] p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-landing-body text-[14px] font-semibold text-land-ink">
              Re: Midterm room confusion
            </p>
            <span className="shrink-0 rounded-full bg-land-accent-soft px-2.5 py-0.5 font-landing-body text-[10px] font-medium text-land-accent-deep">
              Answering 5 students
            </span>
          </div>

          <motion.div
            className="mt-4 rounded-xl border border-land-border bg-[#F7F6F3] p-4"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            viewport={{ once: true }}
          >
            <p className="font-landing-body text-[13px] leading-[1.65] text-land-ink">
              Hi everyone. The midterm is in <strong>ECSS 2.410</strong>, Thursday at 10 AM. Bring your
              student ID. Calculators are fine; phones are not. See the exam section of the syllabus for
              full details.
            </p>
          </motion.div>

          <motion.div
            className="mt-3 flex items-center gap-2 rounded-lg border border-land-accent/20 bg-land-accent-soft/50 px-3 py-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.15, ease: EASE }}
            viewport={{ once: true }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M6 1l1.1 2.7L9.8 4.8 7.1 5.9 6 8.6 4.9 5.9 2.2 4.8l2.7-1.1z"
                fill={ACCENT}
                fillOpacity="0.8"
              />
            </svg>
            <span className="font-landing-body text-[11px] text-land-accent-deep">
              From CS 3345 Syllabus.pdf, page 2
            </span>
          </motion.div>

          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-1.5">
                {recipients.map((initials, i) => (
                  <motion.span
                    key={initials}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-land-accent-soft font-landing-body text-[9px] font-semibold text-land-accent-deep"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, delay: 0.2 + i * 0.05, ease: EASE }}
                    viewport={{ once: true }}
                  >
                    {initials}
                  </motion.span>
                ))}
              </div>
              <span className="font-landing-body text-[11px] text-land-ink-muted">5 similar questions</span>
            </div>

            <button
              type="button"
              onClick={() => setSent(true)}
              onMouseEnter={() => setHoverSend(true)}
              onMouseLeave={() => setHoverSend(false)}
              className={`rounded-full bg-land-accent px-5 py-2 font-landing-body text-[11.5px] font-semibold text-white transition-all duration-200 hover:bg-land-accent-hover active:scale-[0.98] ${
                hoverSend ? "shadow-[0_0_0_4px_rgba(79,70,229,0.2)]" : ""
              }`}
            >
              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.span
                    key="sent"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    Sent to all five
                  </motion.span>
                ) : (
                  <motion.span key="send" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Send to all five
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppDemoRow() {
  const ref = useRef<HTMLElement>(null);
  const y = useParallaxY(ref, [40, -40]);

  return (
    <section ref={ref} className="relative px-5 py-16 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <SectionHeader
              align="left"
              eyebrow="Workbench"
              title={
                <>
                  Your inbox,
                  <br />
                  made intelligent.
                </>
              }
            />
            <motion.p
              className="mt-5 font-landing-body text-[15px] leading-[1.75] text-land-ink-muted"
              variants={blurRevealChild}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
            >
              The mail you already use, with AI built in. Feed it your materials, set your rules,
              and draft from both without leaving your workflow.
            </motion.p>
            <motion.p
              className="mt-3 font-landing-body text-[15px] leading-[1.75] text-land-ink-muted"
              variants={blurRevealChild}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: 0.06 }}
            >
              Triage, summarize, and batch similar questions. You approve every send.
            </motion.p>
          </div>

          <motion.div
            className="order-1 flex justify-center md:order-2"
            style={{ y }}
            initial={{ opacity: 0, y: 40, scale: 0.97, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, amount: 0.35 }}
          >
            <DemoPanel />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
