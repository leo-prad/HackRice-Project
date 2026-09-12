import { motion } from "framer-motion";
import { useRef } from "react";
import { ACCENT } from "./colors";
import SectionHeader from "./SectionHeader";
import { blurRevealChild, useParallaxY } from "./scrollMotion";

const steps = [
  {
    num: "01",
    title: "Connect your inbox",
    text: "Sign in with your university email. Your real mail, no migration.",
  },
  {
    num: "02",
    title: "Feed it and tailor it",
    text: "Upload course materials and set your teaching rules. You train the assistant.",
  },
  {
    num: "03",
    title: "Review and send",
    text: "Incuria drafts and triages. You approve every message before it sends.",
  },
];

/* Stacked "flow" visual — three connected cards mirroring the steps. */
function FlowVisual() {
  return (
    <div className="relative w-full max-w-[380px]" aria-hidden>
      {/* Connector spine */}
      <span className="absolute bottom-10 left-[26px] top-10 w-px bg-gradient-to-b from-land-accent/40 via-land-accent/20 to-transparent" />

      <div className="space-y-5">
        {/* Step 1 card */}
        <div className="relative ml-0 rounded-2xl border border-land-border bg-white p-4 shadow-land-card">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-land-accent-soft">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2.5" y="3.5" width="11" height="9.5" rx="2" stroke={ACCENT} strokeWidth="1.3" />
                <path d="m3.5 5.5 4.5 3 4.5-3" stroke={ACCENT} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="font-landing-body text-[12px] font-semibold text-land-ink">Inbox connected</p>
              <p className="font-landing-body text-[10.5px] text-land-ink-faint">r.sharma@university.edu</p>
            </div>
            <span className="ml-auto rounded-full bg-[#E5F4EC] px-2 py-0.5 font-landing-body text-[9px] font-medium text-[#1F7A4D]">
              Secure
            </span>
          </div>
        </div>

        {/* Step 2 card */}
        <div className="relative ml-6 rounded-2xl border border-land-border bg-white p-4 shadow-land-card">
          <p className="font-landing-body text-[10px] font-semibold uppercase tracking-wide text-land-ink-faint">
            Course materials
          </p>
          <div className="mt-2.5 space-y-1.5">
            {["CS 3345 Syllabus.pdf", "Late-work policy.docx", "Week 9 lecture notes.pdf"].map((doc) => (
              <div key={doc} className="flex items-center gap-2 rounded-lg bg-land-canvas px-2.5 py-1.5">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M3 1.5h4L9.5 4v6.5h-6.5z" stroke={ACCENT} strokeWidth="1.1" strokeLinejoin="round" />
                </svg>
                <span className="font-landing-body text-[10.5px] text-land-ink-muted">{doc}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 font-landing-body text-[10px] font-semibold uppercase tracking-wide text-land-ink-faint">
            Teaching rules
          </p>
          <p className="mt-1.5 font-landing-body text-[10.5px] leading-relaxed text-land-ink-muted">
            Formal tone. Extensions require documentation.
          </p>
        </div>

        {/* Step 3 card */}
        <div className="relative ml-12 rounded-2xl border border-land-accent/30 bg-white p-4 shadow-land-card-hover">
          <div className="flex items-center gap-1.5">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M6 1l1.1 2.7L9.8 4.8 7.1 5.9 6 8.6 4.9 5.9 2.2 4.8l2.7-1.1z" fill={ACCENT} fillOpacity="0.8" />
            </svg>
            <span className="font-landing-body text-[10px] font-semibold text-land-accent-deep">
              Draft ready for your review
            </span>
          </div>
          <div className="mt-2 space-y-1.5">
            <span className="block h-1.5 w-full rounded-full bg-land-ink/[0.1]" />
            <span className="block h-1.5 w-[82%] rounded-full bg-land-ink/[0.08]" />
          </div>
          <div className="mt-3 flex gap-2">
            <span className="rounded-full bg-land-accent px-3 py-1 font-landing-body text-[9.5px] font-semibold text-white">
              Approve &amp; send
            </span>
            <span className="rounded-full border border-land-border px-3 py-1 font-landing-body text-[9.5px] font-medium text-land-ink-muted">
              Edit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const visualY = useParallaxY(sectionRef, [56, -56]);

  return (
    <section ref={sectionRef} id="how-it-works" className="relative scroll-mt-24 px-5 py-20 sm:px-10">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 border-t border-land-border pt-16 md:grid-cols-2 md:gap-16">
        <div>
          <SectionHeader
            align="left"
            eyebrow="Setup"
            title="Three steps"
            subtitle="Familiar mail. An assistant that knows your courses and follows your rules."
          />

          <div className="mt-10">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                className="flex items-start gap-6 border-t border-land-border py-6"
                variants={blurRevealChild}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                transition={{ delay: i * 0.08 }}
              >
                <span className="shrink-0 font-landing-display text-lg font-semibold italic text-land-accent">
                  {step.num}
                </span>
                <div>
                  <h3 className="font-landing-body text-base font-semibold text-land-ink">{step.title}</h3>
                  <p className="mt-1 font-landing-body text-[15px] leading-relaxed text-land-ink-muted">
                    {step.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          className="flex items-center justify-center"
          style={{ y: visualY }}
          initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.35 }}
        >
          <FlowVisual />
        </motion.div>
      </div>
    </section>
  );
}
