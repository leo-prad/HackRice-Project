import { motion } from "framer-motion";
import { ACCENT } from "./colors";
import ConnectedContext from "./ConnectedContext";
import SectionHeader from "./SectionHeader";
import { cardReveal } from "./scrollMotion";

/* ── Mini-mockup illustrations (HTML, not wireframe SVG) ────────────── */

function TriageIllustration() {
  return (
    <div className="w-full max-w-[270px] space-y-2" aria-hidden>
      {[
        { from: "Maya Patel", tag: "Needs reply", strong: true },
        { from: "Daniel Okafor", tag: "Batch · 5", strong: false },
        { from: "Sofia Reyes", tag: null, strong: false },
      ].map((row) => (
        <div
          key={row.from}
          className={`flex items-center justify-between rounded-xl border bg-white px-3.5 py-2.5 ${
            row.strong ? "border-land-accent/30 shadow-land-card" : "border-land-border"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-land-accent-soft font-landing-body text-[10px] font-semibold text-land-accent-deep">
              {row.from.split(" ").map((w) => w[0]).join("")}
            </span>
            <div>
              <p className="font-landing-body text-[11px] font-semibold text-land-ink">{row.from}</p>
              <span className="block h-1.5 w-24 rounded-full bg-land-ink/[0.08]" />
            </div>
          </div>
          {row.tag ? (
            <span className="rounded-full bg-land-accent-soft px-2 py-0.5 font-landing-body text-[9px] font-medium text-land-accent-deep">
              {row.tag}
            </span>
          ) : (
            <span className="font-landing-body text-[9px] text-land-ink-faint">Can wait</span>
          )}
        </div>
      ))}
    </div>
  );
}

function SyllabusIllustration() {
  return (
    <div className="relative w-full max-w-[270px]" aria-hidden>
      <div className="absolute -left-2 -top-2 h-full w-full rounded-xl border border-land-border bg-land-canvas" />
      <div className="relative rounded-xl border border-land-border bg-white p-4 shadow-land-card">
        <p className="font-landing-body text-[10px] font-semibold uppercase tracking-wide text-land-ink-faint">
          CS 3345 · Materials
        </p>
        <p className="mt-2 font-landing-body text-[11px] leading-relaxed text-land-ink">
          “Documented illness qualifies for a 48-hour extension on problem sets.”
        </p>
        <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-land-accent-soft/70 px-2.5 py-1.5">
          <SparkGlyph />
          <span className="font-landing-body text-[10px] font-medium text-land-accent-deep">
            Cited in 3 drafts this week
          </span>
        </div>
      </div>
    </div>
  );
}

function ApproveIllustration() {
  return (
    <div className="w-full max-w-[270px] rounded-xl border border-land-border bg-white p-4 shadow-land-card" aria-hidden>
      <div className="flex items-center gap-1.5">
        <SparkGlyph />
        <span className="font-landing-body text-[10px] font-semibold text-land-accent-deep">Draft ready</span>
      </div>
      <div className="mt-2.5 space-y-1.5">
        <span className="block h-1.5 w-full rounded-full bg-land-ink/[0.1]" />
        <span className="block h-1.5 w-[88%] rounded-full bg-land-ink/[0.08]" />
        <span className="block h-1.5 w-[70%] rounded-full bg-land-ink/[0.08]" />
      </div>
      <div className="mt-3.5 flex items-center gap-2">
        <span className="rounded-full bg-land-accent px-3.5 py-1.5 font-landing-body text-[10px] font-semibold text-white">
          Approve &amp; send
        </span>
        <span className="rounded-full border border-land-border px-3.5 py-1.5 font-landing-body text-[10px] font-medium text-land-ink-muted">
          Edit first
        </span>
      </div>
    </div>
  );
}

function BatchIllustration() {
  return (
    <div className="relative w-full max-w-[270px]" aria-hidden>
      <div className="absolute -top-3 left-3 right-3 h-10 rounded-xl border border-land-border bg-land-canvas" />
      <div className="absolute -top-1.5 left-1.5 right-1.5 h-10 rounded-xl border border-land-border bg-white" />
      <div className="relative rounded-xl border border-land-accent/30 bg-white p-4 shadow-land-card">
        <div className="flex items-center justify-between">
          <p className="font-landing-body text-[11px] font-semibold text-land-ink">
            “Where is the midterm?”
          </p>
          <span className="rounded-full bg-land-accent-soft px-2 py-0.5 font-landing-body text-[9px] font-medium text-land-accent-deep">
            5 students
          </span>
        </div>
        <span className="mt-2 block h-1.5 w-[80%] rounded-full bg-land-ink/[0.08]" />
        <div className="mt-3">
          <span className="rounded-full bg-land-accent px-3.5 py-1.5 font-landing-body text-[10px] font-semibold text-white">
            Answer all five at once
          </span>
        </div>
      </div>
    </div>
  );
}

function SparkGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M6 1l1.1 2.7L9.8 4.8 7.1 5.9 6 8.6 4.9 5.9 2.2 4.8l2.7-1.1z" fill={ACCENT} fillOpacity="0.8" />
    </svg>
  );
}

/* ── Data ────────────────────────────────────────────────────────────── */

const features = [
  {
    title: "Feed your materials",
    description:
      "Upload syllabi, policies, and notes. The AI draws from what you provide, not the open web.",
    illustration: <SyllabusIllustration />,
  },
  {
    title: "Set your rules",
    description:
      "Tell Incuria how you teach: tone, extension policy, what to prioritize. Your bot, your judgment.",
    illustration: <ApproveIllustration />,
  },
  {
    title: "Draft from both",
    description:
      "Replies combine your sources and your instructions. Every answer shows where it came from.",
    illustration: <BatchIllustration />,
  },
  {
    title: "Triage your inbox",
    description:
      "See what needs a reply, batch similar questions, and clear student mail in one sitting.",
    illustration: <TriageIllustration />,
  },
];

/* ── Section ─────────────────────────────────────────────────────────── */

export default function FeatureGrid() {
  return (
    <section id="features" className="relative scroll-mt-24 overflow-hidden px-5 py-24 sm:px-10">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: [
            "radial-gradient(ellipse 75% 48% at 50% 30%, rgba(79,70,229,0.05) 0%, transparent 70%)",
            "linear-gradient(180deg, rgba(238,237,252,0.35) 0%, rgba(250,249,246,0) 55%)",
          ].join(", "),
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <SectionHeader
          className="mb-14"
          eyebrow="How it works"
          title="Your materials, your rules, your inbox"
          subtitle="Feed it your courses and your judgment. It drafts and triages from what you teach it."
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              className="group flex flex-col overflow-hidden rounded-[22px] border border-land-border bg-white/85 shadow-land-card backdrop-blur-sm transition-shadow duration-300 hover:shadow-land-card-hover"
              variants={cardReveal}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.12 }}
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 24 } }}
            >
              <div className="px-7 pt-7 sm:px-8 sm:pt-8">
                <h3 className="font-landing-display text-[1.3rem] font-semibold tracking-tight text-land-ink">
                  {feat.title}
                </h3>
                <p className="mt-2 font-landing-body text-[15px] leading-relaxed text-land-ink-muted">
                  {feat.description}
                </p>
              </div>
              <div className="mt-auto flex items-center justify-center px-6 pb-8 pt-7">
                {feat.illustration}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-28">
          <SectionHeader
            className="mb-2"
            eyebrow="Inbox"
            title="AI-native where you already work"
            subtitle="Familiar mail with intelligence built in. Your inbox, augmented, not replaced."
          />
          <ConnectedContext />
        </div>
      </div>
    </section>
  );
}
