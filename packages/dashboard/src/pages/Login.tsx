import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Chrome,
  Github,
  GitPullRequest,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { motion, MotionConfig, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  DIFFICULTY_WEIGHTS,
  MAX_QUEST_XP,
  xpFromDifficulty,
} from "@gitventure/shared";
import { API_BASE, session } from "../lib/api";
import { WORKFLOW } from "../lib/workflow";
import LandingNav from "../components/landing/LandingNav";
import TrailMap from "../components/landing/TrailMap";
import ProgressBar from "../components/ui/ProgressBar";
import SmoothScroll from "../motion/SmoothScroll";
import ScrollReveal from "../motion/ScrollReveal";
import SectionHeader from "../motion/SectionHeader";
import { EASE, cardReveal } from "../motion/scrollMotion";
import { GitVentureMark } from "../components/brand/GitVentureMark";

/** Demo quests — difficulty → XP via the real `xpFromDifficulty` formula. */
const DEMO_QUESTS = [
  {
    title: "[Bug] Connection pool exhausts under burst traffic",
    number: "#142",
    author: "alex-chen",
    difficulty: 7.8,
    skills: [
      { name: "Python", level: 3 },
      { name: "Concurrency", level: 3 },
    ],
    labels: ["bug"],
    action: "Claim quest",
    primary: true,
  },
  {
    title: "[Docs] Clarify webhook retry backoff in README",
    number: "#88",
    author: "samira-k",
    difficulty: 1.2,
    skills: [{ name: "Documentation", level: 1 }],
    labels: ["documentation", "good first issue"],
    action: "Inspect card",
    primary: false,
  },
  {
    title: "[Security] Sanitize search query to block reflected XSS",
    number: "#201",
    author: "jordan-lee",
    difficulty: 9.6,
    skills: [
      { name: "Security", level: 4 },
      { name: "Web", level: 3 },
    ],
    labels: ["bug", "security"],
    action: "Claim quest",
    primary: true,
  },
] as const;

const PREVIEW_DIFFICULTY = 7.6;
const PREVIEW_XP = xpFromDifficulty(PREVIEW_DIFFICULTY);

const LOOP_STEPS = [
  {
    icon: Brain,
    title: "AI scores the issue",
    desc: "Five weighted axes become a 0–10 difficulty. XP is difficulty × 100 — capped at 1,000. The model never invents XP.",
  },
  {
    icon: Target,
    title: "Claim a personalized quest",
    desc: "Lock an issue matched to your skill tree. You get objectives, required skills, and an XP bounty before you write a line.",
  },
  {
    icon: GitPullRequest,
    title: "Ship a real contribution",
    desc: "Open a PR that closes the issue. GitVenture watches GitHub — not a checkbox you tick yourself.",
  },
  {
    icon: Trophy,
    title: "Progress on merge",
    desc: "When the PR merges, XP lands, skills level up, your profile updates, and the next harder quest is recommended.",
  },
];

const SCORING_AXES = [
  { key: "technicalComplexity", label: "Technical complexity", weight: DIFFICULTY_WEIGHTS.technicalComplexity, hint: "Depth of engineering skill" },
  { key: "scope", label: "Scope", weight: DIFFICULTY_WEIGHTS.scope, hint: "How much code must change" },
  { key: "codebaseContext", label: "Codebase context", weight: DIFFICULTY_WEIGHTS.codebaseContext, hint: "Repo familiarity required" },
  { key: "verificationDifficulty", label: "Verification", weight: DIFFICULTY_WEIGHTS.verificationDifficulty, hint: "How hard to prove the fix" },
  { key: "ambiguity", label: "Ambiguity", weight: DIFFICULTY_WEIGHTS.ambiguity, hint: "How underspecified the issue is" },
] as const;

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"] as const;

export default function Login() {
  const [activeTab, setActiveTab] = useState<"github" | "gitventure">("gitventure");
  const [claimed, setClaimed] = useState(false);
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const signedIn = Boolean(session.get());

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const headlineY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -90]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55, 0.9], [1, 1, reduceMotion ? 1 : 0]);
  const mapY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 70]);
  const mapScale = useTransform(scrollYProgress, [0, 0.7], [1, reduceMotion ? 1 : 1.06]);

  const rise = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 32, filter: "blur(10px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { duration: 0.9, delay, ease: EASE },
        };

  // Signed-in visitors never stay on the marketing layer — route by workflow.
  if (signedIn) return <Navigate to={WORKFLOW.continue} replace />;

  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll>
        <div className="relative min-h-screen overflow-x-hidden bg-void font-body text-snow antialiased">
          <LandingNav />

          {/* ── Hero ─────────────────────────────────────────────── */}
          <section
            ref={heroRef}
            id="hero"
            className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden px-5 pb-16 pt-28 sm:px-10 sm:pb-24"
          >
            <motion.div className="absolute inset-0" style={{ y: mapY, scale: mapScale }}>
              <TrailMap />
            </motion.div>
            {/* Readability veil so CTAs and type stay crisp over the map */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void via-void/75 to-void/25"
              aria-hidden
            />

            <motion.div className="relative z-10 mx-auto w-full max-w-5xl" style={{ opacity: contentOpacity }}>
              <motion.div style={{ y: headlineY }}>
                <motion.div className="flex items-center gap-3" {...rise(0.05)}>
                  <GitVentureMark size={44} />
                  <p className="font-display text-[clamp(2.75rem,8vw,5.25rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-snow">
                    GitVenture
                  </p>
                </motion.div>

                <motion.h1
                  className="mt-6 max-w-2xl font-display text-[clamp(1.6rem,3.8vw,2.75rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-snow"
                  {...rise(0.12)}
                >
                  Level up on real code.
                </motion.h1>

                <motion.p
                  className="mt-4 max-w-lg font-body text-base leading-relaxed text-fog sm:text-lg"
                  {...rise(0.18)}
                >
                  Turn real GitHub issues into personalized quests, build your developer skill tree, and progress by shipping real contributions.
                </motion.p>

                <motion.div className="mt-9 flex flex-wrap items-center gap-3" {...rise(0.26)}>
                  <a
                    href={`${API_BASE}/auth/github`}
                    className="gv-btn-primary group min-h-[52px] px-7 font-body text-[15px]"
                  >
                    <Github size={18} className="text-void" strokeWidth={2.25} />
                    Continue with GitHub
                    <ArrowRight
                      size={16}
                      className="text-void transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </a>
                  <button
                    type="button"
                    onClick={() => document.getElementById("gap")?.scrollIntoView({ behavior: "smooth" })}
                    className="gv-btn-secondary min-h-[52px] px-6 font-body text-[15px] text-snow backdrop-blur-sm"
                  >
                    See how it works
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>
          </section>

          {/* ── The gap ──────────────────────────────────────────── */}
          <section id="gap" className="relative scroll-mt-24 border-t border-white/[0.07] px-5 py-24 sm:px-10">
            <SectionHeader
              className="mb-14"
              eyebrow="The problem"
              title="Learning to code has a gap."
              subtitle="Tutorials teach syntax. LeetCode teaches isolated algorithms. Real production codebases are unstructured and intimidating — and that is where most developers stall."
            />

            <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
              {[
                {
                  title: "Tutorials",
                  body: "Syntax, frameworks, happy-path demos. Useful — but they never ask you to change someone else's system.",
                },
                {
                  title: "LeetCode",
                  body: "Isolated puzzles with a known answer. Real issues have ambiguity, context, and verification cost.",
                },
                {
                  title: "GitHub",
                  body: "Millions of real engineering problems — unranked, unlabeled for difficulty, and hard to enter as a beginner.",
                },
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  className="rounded-[20px] border border-white/[0.08] bg-panel/80 p-6"
                  variants={cardReveal}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.25 }}
                >
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-mist">
                    0{i + 1}
                  </p>
                  <h3 className="mt-3 font-display text-xl font-semibold tracking-tight text-snow">
                    {card.title}
                  </h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-fog">{card.body}</p>
                </motion.div>
              ))}
            </div>

            <ScrollReveal className="mx-auto mt-12 max-w-2xl text-center">
              <p className="font-display text-[clamp(1.35rem,2.8vw,1.85rem)] font-medium leading-snug tracking-[-0.02em] text-snow">
                GitVenture turns those problems into a progression path.
              </p>
            </ScrollReveal>
          </section>

          {/* ── Loop ─────────────────────────────────────────────── */}
          <section id="loop" className="relative scroll-mt-24 border-t border-white/[0.07] bg-panel/40 px-5 py-24 sm:px-10">
            <SectionHeader
              className="mb-16"
              eyebrow="How GitVenture works"
              title="Real issues become a continuous progression loop."
              subtitle="AI analyzes difficulty and required skills. You complete a real contribution. Merged PRs become XP, skill levels, and the next harder quest."
            />

            <div className="relative mx-auto grid max-w-6xl gap-y-12 md:grid-cols-4 md:gap-x-8">
              <div className="pointer-events-none absolute left-6 right-6 top-6 hidden h-px bg-gradient-to-r from-transparent via-trail/35 to-transparent md:block" />
              {LOOP_STEPS.map((step, index) => (
                <motion.div
                  key={step.title}
                  className="relative"
                  variants={cardReveal}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                >
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-trail/30 bg-void text-trail">
                    <step.icon size={20} />
                  </div>
                  <span className="mt-5 block font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-mist">
                    Step {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-semibold tracking-tight text-snow">
                    {step.title}
                  </h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-fog">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── Scoring (real formula) ───────────────────────────── */}
          <section id="scoring" className="relative scroll-mt-24 border-t border-white/[0.07] px-5 py-24 sm:px-10">
            <SectionHeader
              className="mb-14"
              eyebrow="Scoring system"
              title="Difficulty is computed. XP is deterministic."
              subtitle="Gemini scores five axes. The backend applies fixed weights, then XP = difficulty × 100 (max 1,000). The model never returns XP — only the axes."
            />

            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <ScrollReveal className="rounded-[22px] border border-white/[0.08] bg-panel/90 p-6 sm:p-8">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-trail">
                  Weighted axes → difficulty
                </p>
                <ul className="mt-6 space-y-4">
                  {SCORING_AXES.map((axis) => (
                    <li key={axis.key}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-body text-sm font-medium text-snow">{axis.label}</span>
                        <span className="font-mono text-xs text-trail">{Math.round(axis.weight * 100)}%</span>
                      </div>
                      <p className="mt-0.5 text-xs text-mist">{axis.hint}</p>
                      <ProgressBar
                        className="mt-2"
                        value={axis.weight * 100}
                        size="sm"
                        label={`${axis.label} weight`}
                      />
                    </li>
                  ))}
                </ul>
                <p className="mt-6 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3 font-mono text-xs leading-relaxed text-fog">
                  difficulty = Σ (axis × weight) · clamped 0–10
                  <br />
                  xp = min({MAX_QUEST_XP}, max(1, round(difficulty × 100)))
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.08} className="rounded-[22px] border border-white/[0.08] bg-panel/90 p-6 sm:p-8">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-beacon">
                  XP is the only metric
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    { difficulty: 1.2, label: "Docs / small fix" },
                    { difficulty: 4.5, label: "Multi-file feature" },
                    { difficulty: 7.8, label: "Hard bug / concurrency" },
                    { difficulty: 9.6, label: "Security / deep systems" },
                  ].map((row) => (
                    <li
                      key={row.difficulty}
                      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/25 px-4 py-3"
                    >
                      <div>
                        <span className="font-mono text-xs font-bold tracking-wider text-snow">
                          {row.difficulty.toFixed(1)} / 10
                        </span>
                        <p className="mt-0.5 text-[11px] text-mist">{row.label}</p>
                      </div>
                      <span className="font-mono text-sm font-bold text-trail">
                        {xpFromDifficulty(row.difficulty)} XP
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 font-body text-sm leading-relaxed text-fog">
                  Harder work pays more XP. Skills split that XP by weight — XP is the only bounty metric.
                </p>
              </ScrollReveal>
            </div>
          </section>

          {/* ── Interactive demo ─────────────────────────────────── */}
          <section id="demo" className="relative scroll-mt-24 border-t border-white/[0.07] px-5 py-24 sm:px-10">
            <SectionHeader
              className="mb-12"
              eyebrow="GitHub, upgraded"
              title="Same issues. Structured as quests."
              subtitle="Plain GitHub is a wall of unranked tickets. GitVenture prices every issue with difficulty, XP, and skills — using the same formula as production."
            />

            <ScrollReveal className="mx-auto mb-8 flex justify-center">
              <div className="inline-flex rounded-full border border-white/10 bg-panel p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("github")}
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-mono text-xs font-bold transition-colors duration-300 ${
                    activeTab === "github" ? "bg-white/10 text-snow" : "text-mist hover:text-fog"
                  }`}
                >
                  <Github size={15} /> Plain GitHub
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("gitventure")}
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-mono text-xs font-bold transition-colors duration-300 ${
                    activeTab === "gitventure" ? "bg-snow text-void" : "text-mist hover:text-fog"
                  }`}
                >
                  <Zap size={15} /> With GitVenture
                </button>
              </div>
            </ScrollReveal>

            <ScrollReveal className="mx-auto max-w-5xl overflow-hidden rounded-[22px] border border-white/[0.1] bg-[#0b0f16] shadow-[0_24px_64px_-24px_rgba(0,0,0,0.65)]">
              <div className="flex items-center justify-between border-b border-white/[0.07] bg-[#121722] px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#fa7970]/80" />
                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#faa356]/80" />
                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#7ce38b]/80" />
                  <span className="ml-2 truncate font-mono text-xs text-mist">
                    github.com/acme/orbit-api/issues
                  </span>
                </div>
                {activeTab === "gitventure" && (
                  <span className="ml-3 flex shrink-0 items-center gap-1.5 rounded-full border border-trail/30 bg-trail/10 px-3 py-0.5 font-mono text-[10px] font-bold text-trail">
                    <Chrome size={12} /> GitVenture active
                  </span>
                )}
              </div>

              <div className="divide-y divide-white/[0.05]">
                {DEMO_QUESTS.map((quest) => (
                  <IssueRow key={quest.number} tab={activeTab} quest={quest} />
                ))}
              </div>
            </ScrollReveal>
          </section>

          {/* ── Progression preview ──────────────────────────────── */}
          <section id="progress" className="relative scroll-mt-24 border-t border-white/[0.07] bg-panel/40 px-5 py-24 sm:px-10">
            <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <SectionHeader
                  align="left"
                  className="mb-8"
                  eyebrow="Personalized progression"
                  title="Skills level up. The next quest gets harder."
                  subtitle="Built for students, self-taught developers, and early-career engineers moving from exercises into real software."
                />
                <ul className="space-y-4">
                  {[
                    "Skill XP is split across the skills the issue actually requires — by weight.",
                    "Your profile starts from GitHub history + growth goals, then evolves with merged work.",
                    "Next Quest recommends challenges matched to your current ability — not random issues.",
                  ].map((line) => (
                    <li key={line} className="flex gap-3 font-body text-sm leading-relaxed text-fog">
                      <Sparkles size={16} className="mt-0.5 shrink-0 text-trail" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <ScrollReveal delay={0.1}>
                <QuestPreview
                  claimed={claimed}
                  onClaim={() => setClaimed(true)}
                  onReset={() => setClaimed(false)}
                />
              </ScrollReveal>
            </div>
          </section>

          {/* ── Closing CTA ──────────────────────────────────────── */}
          <section className="relative border-t border-white/[0.07] px-5 py-24 sm:px-10">
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <GitVentureMark size={48} className="mx-auto" />
              <h2 className="mt-6 font-display text-[clamp(2.2rem,4.5vw,3.5rem)] font-semibold tracking-[-0.03em] text-snow">
                Start your progression path.
              </h2>
              <p className="mx-auto mt-4 max-w-lg font-body text-base leading-relaxed text-fog">
                Sign in with GitHub, pick your growth goals, and claim a quest sized to where you are — then level up by shipping.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <a
                  href={`${API_BASE}/auth/github`}
                  className="gv-btn-primary px-8 py-4 font-body text-base"
                >
                  <Github size={18} className="text-void" /> Sign in with GitHub
                </a>
                <Link
                  to="/leaderboard"
                  className="gv-btn-secondary px-6 py-4 font-body text-base text-snow"
                >
                  <Trophy size={17} /> View standings
                </Link>
              </div>
            </ScrollReveal>
          </section>

          <footer className="border-t border-white/[0.06] px-5 py-8 sm:px-10">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2.5">
                <GitVentureMark size={22} />
                <span className="font-display text-sm font-semibold tracking-tight text-snow">GitVenture</span>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist">
                Level up on real code.
              </p>
            </div>
          </footer>
        </div>
      </SmoothScroll>
    </MotionConfig>
  );
}

function IssueRow({
  tab,
  quest,
}: {
  tab: "github" | "gitventure";
  quest: (typeof DEMO_QUESTS)[number];
}) {
  const xp = xpFromDifficulty(quest.difficulty);

  return (
    <div className="flex flex-col gap-4 p-4 transition-colors duration-300 hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-4 w-4 items-center justify-center rounded-full border border-beacon/70">
          <div className="h-1.5 w-1.5 rounded-full bg-beacon" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-snow">{quest.title}</span>
            <span className="font-mono text-xs text-mist">{quest.number}</span>
            {tab === "gitventure" && (
              <span className="rounded-full border border-trail/40 bg-trail/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-trail">
                +{xp} XP
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-mist">
            opened recently by <span className="font-medium text-fog">{quest.author}</span>
          </p>
          {tab === "gitventure" && (
            <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[10px]">
              <span className="rounded border border-white/10 bg-black/40 px-2 py-0.5 text-fog">
                Difficulty: {quest.difficulty.toFixed(1)} / 10
              </span>
              {quest.skills.map((skill) => (
                <span key={skill.name} className="rounded border border-white/10 bg-black/40 px-2 py-0.5 text-fog">
                  {skill.name} {ROMAN[skill.level]}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {tab === "gitventure" ? (
        <span
          className={`shrink-0 self-start rounded-full px-3.5 py-2 font-mono text-xs font-bold sm:self-center ${
            quest.primary
              ? "bg-snow font-black text-void"
              : "border border-white/20 bg-white/5 text-snow"
          }`}
        >
          {quest.action}
        </span>
      ) : (
        <div className="flex gap-1.5 self-start text-xs text-mist sm:self-center">
          {quest.labels.map((label) => (
            <span key={label} className="rounded-full border border-white/10 bg-[#1a2030] px-2.5 py-0.5">
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestPreview({
  claimed,
  onClaim,
  onReset,
}: {
  claimed: boolean;
  onClaim: () => void;
  onReset: () => void;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <div className="absolute -inset-8 rounded-full bg-trail/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-panel shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-transparent via-trail to-beacon/60" />
        <div className="p-7 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-trail">
              Active quest
            </p>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-fog">
              {PREVIEW_DIFFICULTY.toFixed(1)} / 10
            </span>
          </div>

          <h3 className="mt-3 font-display text-xl font-semibold leading-snug tracking-tight text-snow">
            Fix concurrent cache stampede
          </h3>
          <div className="mt-3 font-display text-5xl font-semibold tracking-[-0.05em] text-trail sm:text-6xl">
            {PREVIEW_XP}{" "}
            <span className="text-base font-medium tracking-normal text-mist">XP</span>
          </div>
          <p className="mt-1 font-mono text-[10px] text-mist">
            xp = round({PREVIEW_DIFFICULTY} × 100)
          </p>

          <div className="mt-4 flex flex-wrap gap-2 font-mono text-[10px]">
            <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-fog">Python IV</span>
            <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-fog">Concurrency IV</span>
            <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-fog">Redis</span>
          </div>

          {claimed ? (
            <div className="mt-6 rounded-2xl border border-beacon/30 bg-beacon/10 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-beacon">
                <CheckCircle2 size={18} /> Quest claimed
              </div>
              <p className="mt-1 font-mono text-xs text-mist">
                Open a PR closing the issue — XP awards only when it merges.
              </p>
              <button
                type="button"
                onClick={onReset}
                className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-mist transition-colors hover:text-snow"
              >
                <RotateCcw size={12} /> Reset demo
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClaim}
              className="gv-btn-primary mt-6 w-full justify-between rounded-2xl px-5 py-4"
            >
              <span>Claim quest</span>
              <ArrowRight size={18} />
            </button>
          )}

          <div className="mt-7 border-t border-white/[0.07] pt-5">
            <div className="flex justify-between font-mono text-[10px] font-bold tracking-wider text-mist">
              <span>Player level 7</span>
              <span className="text-fog">8,420 XP</span>
            </div>
            <ProgressBar className="mt-2.5" value={68} size="sm" label="Demo player level progress" />
          </div>
        </div>
      </div>

      <div className="absolute -bottom-4 -right-4 rounded-2xl border border-white/10 bg-panel/95 px-4 py-3 shadow-xl backdrop-blur">
        <span className="font-mono text-[9px] text-mist">Global rank</span>
        <b className="block font-mono text-xl text-trail">#42</b>
      </div>
    </div>
  );
}
