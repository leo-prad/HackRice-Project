import {
  ArrowDown,
  ArrowRight,
  Brain,
  CheckCircle2,
  Chrome,
  Github,
  GitPullRequest,
  RotateCcw,
  ShieldCheck,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/api";

const STEPS = [
  {
    icon: Brain,
    title: "AI complexity rating",
    desc: "The issue, its comments, and the surrounding repo are read once and scored on a fixed 1.0–10.0 difficulty scale — the same issue always lands on the same number.",
  },
  {
    icon: Target,
    title: "Claim your quest",
    desc: "Lock in an issue from github.com or the dashboard. You get an objective checklist and the skills it will move.",
  },
  {
    icon: GitPullRequest,
    title: "Code and ship the PR",
    desc: "Open a pull request that closes the issue. A background worker watches the repo for the maintainer's merge.",
  },
  {
    icon: Trophy,
    title: "XP lands on merge",
    desc: "Once merged, skill points distribute, rank recalculates, and the quest moves into your permanent history.",
  },
];

const SKILL_DOMAINS = [
  {
    category: "Backend & Systems",
    range: "500 – 950 XP",
    difficulty: "5.0 – 9.5 / 10",
    desc: "Concurrency issues, database migrations, connection pool tuning, and cache stampede prevention.",
    skills: ["Python IV", "Node.js", "PostgreSQL", "Redis", "Distributed Systems"],
    example: "Fix race condition in router middleware dispatcher under heavy concurrency",
  },
  {
    category: "Frontend & UI",
    range: "250 – 700 XP",
    difficulty: "2.5 – 7.0 / 10",
    desc: "State synchronization, hydration errors, bundle optimization, and responsive design systems.",
    skills: ["React 18", "TypeScript", "Tailwind CSS", "Vite", "Accessibility"],
    example: "Prevent re-render cascades across dynamic tree views in large project hierarchies",
  },
  {
    category: "Security & Auth",
    range: "450 – 850 XP",
    difficulty: "4.5 – 8.5 / 10",
    desc: "OAuth 2.0 PKCE flows, session rotation, CSRF/XSS remediation, and header validation.",
    skills: ["OAuth 2.0", "JWT Tokens", "Cryptography", "Express Security"],
    example: "Enforce cryptographic verification on webhook payloads and rotate expired JWT claims",
  },
  {
    category: "DevOps & Tooling",
    range: "300 – 800 XP",
    difficulty: "3.0 – 8.0 / 10",
    desc: "CI/CD build pipelines, containerized orchestration, automated integration suites, and linting rules.",
    skills: ["GitHub Actions", "Docker", "Jest", "Bash", "Turborepo"],
    example: "Parallelize test matrix runners in GitHub Actions to cut build durations by 60%",
  },
];

export default function Login() {
  const [activeTab, setActiveTab] = useState<"github" | "gitquest">("gitquest");
  const [claimed, setClaimed] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-16 px-5 py-16 lg:grid-cols-[1.1fr_.9fr]">
        <div className="animate-push-left">
          <p className="font-mono text-xs font-bold uppercase tracking-[.3em] text-slate-500">GitQuest</p>

          <h1 className="mt-5 max-w-2xl text-5xl font-black leading-[0.97] tracking-[-0.03em] text-white sm:text-6xl md:text-[4.5rem]">
            GitHub already has millions of <span className="text-glow text-acid">quests.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-400">
            Every open issue gets a difficulty score, a claim, and an XP payout the moment your pull request merges.
            No self-reporting — GitHub's own API is the only source of truth.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href={`${API_BASE}/auth/github`}
              className="flex items-center gap-2 rounded-xl bg-acid px-6 py-4 font-extrabold text-ink shadow-acid transition hover:-translate-y-0.5 hover:brightness-110"
            >
              <Github size={20} /> Continue with GitHub <ArrowRight size={18} />
            </a>
            <button
              onClick={() => scrollToSection("interactive-demo")}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-4 font-bold text-slate-300 transition hover:border-white/25 hover:text-white"
            >
              See it in action <ArrowDown size={16} />
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> read:user only</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> public repos</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> merges verified server-side</span>
          </div>
        </div>

        <div className="animate-push-right">
          <QuestPreview claimed={claimed} onClaim={() => setClaimed(true)} onReset={() => setClaimed(false)} />
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[.08] bg-panel/60 py-6 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 sm:grid-cols-4">
          <Stat label="Scoring engine" value="Gemini 3.8 Flash" hint="Deterministic difficulty from issue + repo context" accent />
          <Stat label="XP proof model" value="0% self-reported" hint="Only cryptographically verified merges pay out" />
          <Stat label="XP formula" value="Difficulty × 100" hint="One fixed curve, no hidden multipliers" />
          <Stat label="Supported repos" value="GitPathDemo" hint="All quests from tejaspalukuri/GitPathDemo" />
        </div>
      </section>

      {/* Before / after */}
      <section id="interactive-demo" className="mx-auto max-w-6xl px-5 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-[.25em] text-slate-500">The layer on top</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Same issue tracker. A completely different incentive.
          </h2>
          <p className="mt-4 text-base text-slate-400 sm:text-lg">
            Plain GitHub gives you a wall of unranked issues. GitQuest reads the same list and prices every one of them.
          </p>

          <div className="mt-8 inline-flex rounded-xl border border-white/10 bg-panel p-1">
            <button
              onClick={() => setActiveTab("github")}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 font-mono text-xs font-bold transition ${
                activeTab === "github" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Github size={15} /> Plain GitHub
            </button>
            <button
              onClick={() => setActiveTab("gitquest")}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 font-mono text-xs font-bold transition ${
                activeTab === "gitquest" ? "bg-acid text-ink" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Zap size={15} /> With GitQuest
            </button>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/[.12] bg-[#0d1117] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/[.08] bg-[#161b22] px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-[#fa7970]/80" />
              <span className="h-3 w-3 rounded-full bg-[#faa356]/80" />
              <span className="h-3 w-3 rounded-full bg-[#7ce38b]/80" />
              <span className="ml-2 font-mono text-xs text-slate-400">github.com/tejaspalukuri/GitPathDemo/issues</span>
            </div>
            {activeTab === "gitquest" && (
              <span className="flex items-center gap-1.5 rounded-full border border-acid/30 bg-acid/10 px-3 py-0.5 font-mono text-[10px] font-bold text-acid">
                <Chrome size={12} /> GitQuest active
              </span>
            )}
          </div>

          <div className="divide-y divide-white/[.06]">
            <IssueRow
              tab={activeTab}
              title="[Bug] Rankings parser drops tied ranks and crashes on empty rows"
              number="#5"
              opened="opened recently by"
              author="tejaspalukuri"
              xp="+780 XP"
              xpTone="acid"
              tags={["Python III", "Parsing III", "Difficulty: 7.8 / 10"]}
              labels={["bug"]}
              action="Claim quest"
              primary
            />
            <IssueRow
              tab={activeTab}
              title="[Documentation] Fix hardcoded CI runner path in README.md"
              number="#7"
              opened="opened recently by"
              author="tejaspalukuri"
              xp="+120 XP"
              xpTone="slate"
              tags={["Markdown I", "Difficulty: 1.2 / 10"]}
              labels={["documentation", "good first issue"]}
              action="Inspect card"
            />
            <IssueRow
              tab={activeTab}
              title="[Security] Reflected Cross-Site Scripting (XSS) in player search query"
              number="#2"
              opened="opened recently by"
              author="tejaspalukuri"
              xp="+960 XP"
              xpTone="violet"
              tags={["Security IV", "Web III", "Difficulty: 9.6 / 10"]}
              labels={["bug", "security"]}
              action="Claim quest"
              primary
            />
          </div>
        </div>
      </section>

      {/* Game loop */}
      <section className="border-t border-white/[.08] bg-panel/40 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto mb-16 max-w-xl text-center">
            <p className="font-mono text-xs font-bold uppercase tracking-[.25em] text-slate-500">The loop</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">From issue to XP, four steps</h2>
            <p className="mt-4 text-base text-slate-400">Every point of XP traces back to a merged pull request. Nothing is self-attested.</p>
          </div>

          <div className="relative grid gap-y-12 md:grid-cols-4 md:gap-x-8">
            <div className="pointer-events-none absolute left-6 right-6 top-6 hidden h-px bg-white/10 md:block" />
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative">
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-ink text-acid">
                  <step.icon size={20} />
                </div>
                <span className="mt-5 block font-mono text-[11px] font-bold uppercase tracking-[.2em] text-slate-600">
                  Step {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skill domains */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-[.25em] text-slate-500">Skill tree domains</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Level up across real domains</h2>
          <p className="mt-4 text-base text-slate-400 sm:text-lg">Every merged quest pushes XP into the skill branches it actually touched.</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {SKILL_DOMAINS.map((domain, index) => (
            <button
              key={domain.category}
              onClick={() => setActiveCategory(index)}
              className={`rounded-lg px-4 py-2 font-mono text-xs font-bold transition ${
                activeCategory === index
                  ? "border border-acid/30 bg-acid/10 text-acid"
                  : "border border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {domain.category}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-panel/90 p-8 sm:p-10">
          <div className="flex flex-col justify-between gap-4 border-b border-white/[.08] pb-6 sm:flex-row sm:items-center">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-acid">Domain focus</span>
              <h3 className="mt-1 text-3xl font-black text-white">{SKILL_DOMAINS[activeCategory].category}</h3>
            </div>
            <div className="text-left sm:text-right">
              <span className="font-mono text-2xl font-black text-white">{SKILL_DOMAINS[activeCategory].range}</span>
              <p className="font-mono text-xs text-slate-500">Typical difficulty: {SKILL_DOMAINS[activeCategory].difficulty}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-base leading-relaxed text-slate-300">{SKILL_DOMAINS[activeCategory].desc}</p>
            <div className="mt-6 rounded-xl border border-white/[.06] bg-black/40 p-5">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500">Example challenge</p>
              <p className="mt-2 text-sm font-semibold text-white sm:text-base">"{SKILL_DOMAINS[activeCategory].example}"</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {SKILL_DOMAINS[activeCategory].skills.map((skill) => (
                  <span key={skill} className="rounded-lg border border-white/10 bg-white/[.04] px-3 py-1 font-mono text-xs text-slate-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-white/[.08] py-24">
        <div className="mx-auto max-w-2xl px-5 text-center">
          <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Ready to claim your first quest?</h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-slate-400">
            Sign in with GitHub, pick your growth goals, and start ranking up on code that actually shipped.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href={`${API_BASE}/auth/github`}
              className="flex items-center gap-2 rounded-xl bg-acid px-8 py-4 text-base font-extrabold text-ink shadow-acid transition hover:-translate-y-0.5 hover:brightness-110"
            >
              <Github size={20} /> Sign in with GitHub
            </a>
            <Link
              to="/leaderboard"
              className="flex items-center gap-2 rounded-xl border border-white/10 px-6 py-4 text-base font-bold text-slate-300 transition hover:border-white/25 hover:text-white"
            >
              <Trophy size={18} /> View standings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: string; hint: string; accent?: boolean }) {
  return (
    <div className="text-center sm:text-left">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-1 font-mono text-xl font-black sm:text-2xl ${accent ? "text-acid" : "text-white"}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>
    </div>
  );
}

function IssueRow({
  tab,
  title,
  number,
  opened,
  author,
  xp,
  xpTone,
  tags,
  labels,
  action,
  primary,
}: {
  tab: "github" | "gitquest";
  title: string;
  number: string;
  opened: string;
  author: string;
  xp: string;
  xpTone: "acid" | "slate" | "violet";
  tags: string[];
  labels: string[];
  action: string;
  primary?: boolean;
}) {
  const xpStyle = {
    acid: "border-acid/40 bg-acid/10 text-acid",
    slate: "border-slate-500/40 bg-slate-500/10 text-slate-300",
    violet: "border-violet/40 bg-violet/10 text-violet",
  }[xpTone];

  return (
    <div className="flex flex-col gap-4 p-4 transition hover:bg-white/[.02] sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-4 w-4 items-center justify-center rounded-full border border-emerald-400">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="cursor-pointer text-base font-semibold text-white hover:text-blue-400">{title}</span>
            <span className="font-mono text-xs text-slate-500">{number}</span>
            {tab === "gitquest" && (
              <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold ${xpStyle}`}>{xp}</span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {opened} <span className="font-medium text-slate-300">{author}</span>
          </p>
          {tab === "gitquest" && (
            <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[10px]">
              {tags.map((tag) => (
                <span key={tag} className="rounded border border-white/10 bg-black/40 px-2 py-0.5 text-slate-300">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {tab === "gitquest" ? (
        <Link
          to="/pair"
          className={`shrink-0 self-start rounded-lg px-3.5 py-2 font-mono text-xs font-bold sm:self-center ${
            primary ? "bg-acid font-black text-ink hover:brightness-110" : "border border-white/20 bg-white/5 text-white hover:bg-white/10"
          }`}
        >
          {action}
        </Link>
      ) : (
        <div className="flex gap-1.5 self-start text-xs text-slate-400 sm:self-center">
          {labels.map((label) => (
            <span key={label} className="rounded-full border border-white/10 bg-[#1f242c] px-2.5 py-0.5">{label}</span>
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
      <div className="absolute -inset-10 rounded-full bg-violet/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-transparent via-violet to-transparent" />
        <div className="p-7 sm:p-8">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.22em] text-acid">Active quest</p>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-slate-300">
              Difficulty 7.6 / 10
            </span>
          </div>

          <h3 className="mt-3 text-xl font-bold leading-snug text-white">Fix concurrent cache stampede</h3>
          <div className="mt-3 text-5xl font-black tracking-[-.05em] text-acid sm:text-6xl">
            760 <span className="text-base font-bold tracking-normal text-slate-400">XP</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 font-mono text-[10px]">
            <span className="rounded border border-white/10 bg-white/[.04] px-2 py-0.5 text-slate-300">Python IV</span>
            <span className="rounded border border-white/10 bg-white/[.04] px-2 py-0.5 text-slate-300">Concurrency IV</span>
            <span className="rounded border border-white/10 bg-white/[.04] px-2 py-0.5 text-slate-300">Redis</span>
          </div>

          {claimed ? (
            <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                <CheckCircle2 size={18} /> Quest claimed
              </div>
              <p className="mt-1 font-mono text-xs text-slate-400">Open a PR closing the issue to collect the 760 XP.</p>
              <button onClick={onReset} className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-slate-500 transition hover:text-white">
                <RotateCcw size={12} /> Reset demo
              </button>
            </div>
          ) : (
            <button
              onClick={onClaim}
              className="mt-6 flex w-full items-center justify-between rounded-xl bg-acid px-5 py-4 font-extrabold text-ink transition hover:brightness-110 active:scale-[0.98]"
            >
              <span>Claim quest</span>
              <ArrowRight size={18} />
            </button>
          )}

          <div className="mt-7 border-t border-white/[.08] pt-5">
            <div className="flex justify-between font-mono text-[10px] font-bold tracking-wider text-slate-500">
              <span>Player level 7</span>
              <span className="text-slate-300">8,420 XP</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[.07]">
              <i className="block h-full w-[68%] rounded-full bg-acid" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-4 -right-4 rounded-xl border border-white/10 bg-panel/95 px-4 py-3 shadow-xl backdrop-blur">
        <span className="font-mono text-[9px] text-slate-500">Global rank</span>
        <b className="block font-mono text-xl text-acid">#42</b>
      </div>
    </div>
  );
}
