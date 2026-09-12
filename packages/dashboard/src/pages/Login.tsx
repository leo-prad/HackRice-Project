import {
  ArrowDown,
  ArrowRight,
  Brain,
  CheckCircle2,
  Chrome,
  Flame,
  Github,
  GitPullRequest,
  Layers,
  RotateCcw,
  ShieldCheck,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/api";

export default function Login() {
  const [activeTab, setActiveTab] = useState<"github" | "gitquest">("gitquest");
  const [claimed, setClaimed] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number>(0);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const skillDomains = [
    {
      category: "Backend & Systems",
      range: "500 - 950 XP",
      difficulty: "5.0 - 9.5 / 10",
      color: "text-acid",
      border: "border-acid/30 bg-acid/10",
      desc: "Concurrency issues, database migrations, connection pool tuning, and cache stampede prevention.",
      skills: ["Python IV", "Node.js", "PostgreSQL", "Redis", "Distributed Systems"],
      example: "Fix race condition in router middleware dispatcher under heavy concurrency",
    },
    {
      category: "Frontend & UI Engineering",
      range: "250 - 700 XP",
      difficulty: "2.5 - 7.0 / 10",
      color: "text-sky-300",
      border: "border-sky-400/30 bg-sky-400/10",
      desc: "State synchronization, hydration errors, bundle optimization, and responsive design systems.",
      skills: ["React 18", "TypeScript", "Tailwind CSS", "Vite", "Accessibility"],
      example: "Prevent re-render cascades across dynamic tree views in large project hierarchies",
    },
    {
      category: "Security & Authentication",
      range: "450 - 850 XP",
      difficulty: "4.5 - 8.5 / 10",
      color: "text-violet-300",
      border: "border-violet-400/30 bg-violet-400/10",
      desc: "OAuth 2.0 PKCE flows, session rotation, CSRF/XSS remediation, and header validation.",
      skills: ["OAuth 2.0", "JWT Tokens", "Cryptography", "Express Security"],
      example: "Enforce cryptographic verification on webhook payloads and rotate expired JWT claims",
    },
    {
      category: "DevOps & Tooling",
      range: "300 - 800 XP",
      difficulty: "3.0 - 8.0 / 10",
      color: "text-amber-300",
      border: "border-amber-400/30 bg-amber-400/10",
      desc: "CI/CD build pipelines, containerized orchestration, automated integration suites, and linting rules.",
      skills: ["GitHub Actions", "Docker", "Jest", "Bash", "Turborepo"],
      example: "Parallelize test matrix runners in GitHub Actions to cut build durations by 60%",
    },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.1fr_.9fr]">
        {/* Left side: Push-in from Left */}
        <div className="animate-push-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-acid/25 bg-acid/[.07] px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[.2em] text-acid">
            <span className="h-2 w-2 animate-pulse rounded-full bg-acid shadow-[0_0_8px_#b9f456]" />
            Turn GitHub Into An RPG
          </div>

          <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white sm:text-6xl md:text-7xl">
            GitHub already has millions of <span className="text-glow text-acid">quests.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-slate-300 font-normal">
            GitQuest injects an AI gaming engine directly into your browser. Real GitHub issues are scored by difficulty, claims are tracked, and merged PRs are cryptographically verified into XP, skill tree mastery, and global rank.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={`${API_BASE}/auth/github`}
              className="flex items-center gap-2 rounded-xl bg-acid px-6 py-4 font-extrabold text-ink shadow-acid transition duration-200 hover:-translate-y-0.5 hover:brightness-110"
            >
              <Github size={20} /> Continue with GitHub <ArrowRight size={18} />
            </a>
            <button
              onClick={() => scrollToSection("interactive-demo")}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-5 py-4 font-bold text-white transition duration-200 hover:border-acid/40 hover:bg-white/[.08]"
            >
              See It In Action <ArrowDown size={17} className="text-acid animate-bounce" />
            </button>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-6 font-mono text-[11px] tracking-wider text-slate-500 uppercase">
            <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-emerald-400" /> Read:user</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-emerald-400" /> Public Repos</span>
            <span className="flex items-center gap-1.5"><Zap size={15} className="text-acid" /> Zero-Trust Verified Merges</span>
          </div>
        </div>

        {/* Right side: Push-in from Right & subtle floating hover */}
        <div className="animate-push-right animate-float">
          <QuestPreview claimed={claimed} onClaim={() => setClaimed(true)} onReset={() => setClaimed(false)} />
        </div>
      </section>

      {/* Stats Ticker */}
      <section className="border-y border-white/[.08] bg-panel/60 py-6 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 sm:grid-cols-4">
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Scoring Engine</p>
            <p className="mt-1 font-mono text-2xl font-black text-acid">Gemini 3.8 Flash</p>
            <p className="text-[11px] text-slate-400">Deterministic Code & Scope Scoring</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">XP Proof Model</p>
            <p className="mt-1 font-mono text-2xl font-black text-white">0% Self-Reported</p>
            <p className="text-[11px] text-slate-400">Cryptographically Merged PRs Only</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">XP Scaling</p>
            <p className="mt-1 font-mono text-2xl font-black text-violet">Difficulty × 100</p>
            <p className="text-[11px] text-slate-400">Pure Complexity-Based Formula</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Supported Repos</p>
            <p className="mt-1 font-mono text-2xl font-black text-amber-400">Any Public Repo</p>
            <p className="text-[11px] text-slate-400">Express, FastAPI, Prisma & More</p>
          </div>
        </div>
      </section>

      {/* Interactive Feature: Before vs. After GitHub Simulator */}
      <section id="interactive-demo" className="mx-auto max-w-6xl px-5 py-24">
        <div className="text-center max-w-3xl mx-auto">
          <p className="font-mono text-xs font-bold tracking-[.25em] text-acid uppercase">The Solution</p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight text-white">
            How GitQuest rewires your GitHub workflow
          </h2>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            Standard GitHub issues are overwhelming, unranked, and lack clear complexity estimates. GitQuest analyzes issues with AI and awards verified XP straight onto github.com.
          </p>

          {/* Switcher Tabs */}
          <div className="mt-8 inline-flex rounded-2xl border border-white/10 bg-panel p-1.5 shadow-2xl">
            <button
              onClick={() => setActiveTab("github")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-mono text-xs font-bold transition duration-200 ${
                activeTab === "github" ? "bg-white/10 text-white shadow" : "text-slate-500 hover:text-white"
              }`}
            >
              <Github size={16} /> Plain GitHub (Before)
            </button>
            <button
              onClick={() => setActiveTab("gitquest")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-mono text-xs font-bold transition duration-200 ${
                activeTab === "gitquest" ? "bg-acid text-ink shadow-acid font-black" : "text-slate-500 hover:text-white"
              }`}
            >
              <Zap size={16} /> GitQuest Layer (After)
            </button>
          </div>
        </div>

        {/* Interactive GitHub Issue Box */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-white/[.12] bg-[#0d1117] shadow-2xl transition-all duration-300">
          {/* GitHub Header Mockup */}
          <div className="flex items-center justify-between border-b border-white/[.08] bg-[#161b22] px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-[#fa7970]/80" />
              <span className="h-3 w-3 rounded-full bg-[#faa356]/80" />
              <span className="h-3 w-3 rounded-full bg-[#7ce38b]/80" />
              <span className="font-mono text-xs text-slate-400 ml-2">github.com/expressjs/express/issues</span>
            </div>
            {activeTab === "gitquest" && (
              <span className="flex items-center gap-1.5 rounded-full border border-acid/30 bg-acid/10 px-3 py-0.5 font-mono text-[10px] font-bold text-acid">
                <Chrome size={12} /> GitQuest Active
              </span>
            )}
          </div>

          {/* Issue Rows */}
          <div className="divide-y divide-white/[.06]">
            {/* Row 1 */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[.02] transition">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <div className="h-4 w-4 rounded-full border border-emerald-400 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-white hover:text-blue-400 cursor-pointer">
                      Fix race condition in router middleware dispatcher
                    </span>
                    <span className="font-mono text-xs text-slate-500">#5921</span>
                    {activeTab === "gitquest" && (
                      <span className="rounded-full border border-acid/40 bg-acid/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-acid shadow-[0_0_12px_rgba(185,244,86,0.2)]">
                        +780 XP
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    opened 2 days ago by <span className="text-slate-300 font-medium">octocat</span>
                  </p>
                  {activeTab === "gitquest" && (
                    <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[10px]">
                      <span className="rounded border border-white/10 bg-black/40 px-2 py-0.5 text-slate-300">Node.js IV</span>
                      <span className="rounded border border-white/10 bg-black/40 px-2 py-0.5 text-slate-300">Concurrency III</span>
                      <span className="rounded border border-white/10 bg-black/40 px-2 py-0.5 text-slate-300">Difficulty: 7.8 / 10</span>
                    </div>
                  )}
                </div>
              </div>

              {activeTab === "gitquest" ? (
                <Link
                  to="/pair"
                  className="self-start sm:self-center shrink-0 rounded-lg bg-acid px-3.5 py-2 font-mono text-xs font-black text-ink shadow-acid hover:brightness-110"
                >
                  Claim Quest
                </Link>
              ) : (
                <div className="flex gap-1.5 text-xs text-slate-400 self-start sm:self-center">
                  <span className="rounded-full bg-[#1f242c] px-2.5 py-0.5 border border-white/10">bug</span>
                  <span className="rounded-full bg-[#1f242c] px-2.5 py-0.5 border border-white/10">help wanted</span>
                </div>
              )}
            </div>

            {/* Row 2 */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[.02] transition">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <div className="h-4 w-4 rounded-full border border-emerald-400 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-white hover:text-blue-400 cursor-pointer">
                      Typo in error handler response status documentation
                    </span>
                    <span className="font-mono text-xs text-slate-500">#5928</span>
                    {activeTab === "gitquest" && (
                      <span className="rounded-full border border-slate-500/40 bg-slate-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-slate-300">
                        +120 XP
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    opened 4 hours ago by <span className="text-slate-300 font-medium">junior-dev</span>
                  </p>
                  {activeTab === "gitquest" && (
                    <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[10px]">
                      <span className="rounded border border-white/10 bg-black/40 px-2 py-0.5 text-slate-300">Markdown I</span>
                      <span className="rounded border border-white/10 bg-black/40 px-2 py-0.5 text-slate-300">Difficulty: 1.2 / 10</span>
                    </div>
                  )}
                </div>
              </div>

              {activeTab === "gitquest" ? (
                <Link
                  to="/pair"
                  className="self-start sm:self-center shrink-0 rounded-lg border border-white/20 bg-white/5 px-3.5 py-2 font-mono text-xs font-bold text-white hover:bg-white/10"
                >
                  Inspect Card
                </Link>
              ) : (
                <div className="flex gap-1.5 text-xs text-slate-400 self-start sm:self-center">
                  <span className="rounded-full bg-[#1f242c] px-2.5 py-0.5 border border-white/10">documentation</span>
                </div>
              )}
            </div>

            {/* Row 3 */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[.02] transition">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <div className="h-4 w-4 rounded-full border border-emerald-400 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-white hover:text-blue-400 cursor-pointer">
                      Eliminate memory leak in HTTP/2 multiplexed stream parser
                    </span>
                    <span className="font-mono text-xs text-slate-500">#5890</span>
                    {activeTab === "gitquest" && (
                      <span className="rounded-full border border-violet/40 bg-violet/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-violet shadow-[0_0_12px_rgba(167,139,250,0.3)]">
                        +960 XP
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    opened 1 week ago by <span className="text-slate-300 font-medium">maintainer-prime</span>
                  </p>
                  {activeTab === "gitquest" && (
                    <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[10px]">
                      <span className="rounded border border-white/10 bg-black/40 px-2 py-0.5 text-slate-300">C++ Addons</span>
                      <span className="rounded border border-white/10 bg-black/40 px-2 py-0.5 text-slate-300">Memory Mgmt IV</span>
                      <span className="rounded border border-white/10 bg-black/40 px-2 py-0.5 text-slate-300">Difficulty: 9.6 / 10</span>
                    </div>
                  )}
                </div>
              </div>

              {activeTab === "gitquest" ? (
                <Link
                  to="/pair"
                  className="self-start sm:self-center shrink-0 rounded-lg bg-acid px-3.5 py-2 font-mono text-xs font-black text-ink shadow-acid hover:brightness-110"
                >
                  Claim Quest
                </Link>
              ) : (
                <div className="flex gap-1.5 text-xs text-slate-400 self-start sm:self-center">
                  <span className="rounded-full bg-[#1f242c] px-2.5 py-0.5 border border-white/10">performance</span>
                  <span className="rounded-full bg-[#1f242c] px-2.5 py-0.5 border border-white/10">high priority</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* The 4-Step Quest Loop */}
      <section className="border-t border-white/[.08] bg-panel/40 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="font-mono text-xs font-bold tracking-[.25em] text-acid uppercase">The Game Loop</p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight text-white">
              From issue to XP in four steps
            </h2>
            <p className="mt-4 text-slate-400 text-base">
              Every point of XP is verified by GitHub's official API. No cheating. No self-attestation.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-white/[.08] bg-panel/80 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-acid/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-acid/10 border border-acid/30 text-acid mb-6">
                <Brain size={24} />
              </div>
              <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider">Step 01</span>
              <h3 className="mt-2 text-xl font-bold text-white">AI Complexity Rating</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Gemini 3.8 Flash reads the issue description, comments, and repo structure to assign a deterministic difficulty from 1.0 to 10.0.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-white/[.08] bg-panel/80 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-400/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-400/10 border border-sky-400/30 text-sky-400 mb-6">
                <Target size={24} />
              </div>
              <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider">Step 02</span>
              <h3 className="mt-2 text-xl font-bold text-white">Claim Your Quest</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Lock in the issue directly from github.com or your GitQuest dashboard. You get a personalized objective checklist and skill hints.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-white/[.08] bg-panel/80 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-violet/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet/10 border border-violet/30 text-violet mb-6">
                <GitPullRequest size={24} />
              </div>
              <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider">Step 03</span>
              <h3 className="mt-2 text-xl font-bold text-white">Code & Ship the PR</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Submit your pull request closing the issue. The GitQuest background worker monitors the repo for maintainer merges.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative rounded-2xl border border-white/[.08] bg-panel/80 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-400/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 mb-6">
                <Trophy size={24} />
              </div>
              <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider">Step 04</span>
              <h3 className="mt-2 text-xl font-bold text-white">Unlock XP & Level Up</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Once merged, your skill points distribute, you trigger level-up animations, unlock rare achievements, and climb the Global Standings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Domain & Skill Progression Showcase */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="font-mono text-xs font-bold tracking-[.25em] text-acid uppercase">Skill Tree Domains</p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight text-white">
            Level up across real technical domains
          </h2>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            Every issue you solve awards XP directly into relevant skill branches to build your verifiable developer profile.
          </p>
        </div>

        {/* Category Selector Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
          {skillDomains.map((domain, idx) => (
            <button
              key={domain.category}
              onClick={() => setActiveCategory(idx)}
              className={`rounded-xl px-4 py-2 font-mono text-xs font-bold transition-all duration-200 ${
                activeCategory === idx
                  ? `${domain.border} ${domain.color} scale-105 border shadow-lg`
                  : "border border-white/10 bg-panel/60 text-slate-400 hover:text-white"
              }`}
            >
              {domain.category}
            </button>
          ))}
        </div>

        {/* Active Domain Display Card */}
        <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-panel/90 p-8 sm:p-10 shadow-2xl backdrop-blur transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[.08] pb-6">
            <div>
              <span className={`font-mono text-xs font-bold uppercase tracking-widest ${skillDomains[activeCategory].color}`}>
                Domain Focus
              </span>
              <h3 className="mt-1 text-3xl font-black text-white">{skillDomains[activeCategory].category}</h3>
            </div>
            <div className="text-left sm:text-right">
              <span className="font-mono text-2xl font-black text-white">{skillDomains[activeCategory].range}</span>
              <p className="font-mono text-xs text-slate-500">Typical Difficulty: {skillDomains[activeCategory].difficulty}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-slate-300 text-base leading-relaxed">{skillDomains[activeCategory].desc}</p>

            <div className="mt-6 rounded-2xl border border-white/[.06] bg-black/40 p-5">
              <p className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">Example Challenge</p>
              <p className="mt-2 text-sm sm:text-base font-semibold text-white">
                "{skillDomains[activeCategory].example}"
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {skillDomains[activeCategory].skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg border border-white/10 bg-white/[.04] px-3 py-1 font-mono text-xs text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Section */}
      <section className="border-t border-white/[.08] bg-gradient-to-b from-panel/40 to-ink py-20">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-acid/10 border border-acid/30 text-acid shadow-acid">
            <Zap size={32} />
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            Ready to claim your first quest?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
            Sign in with your GitHub account, pick your preferred stack and growth goals, and start ranking up on verified code.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href={`${API_BASE}/auth/github`}
              className="flex items-center gap-2 rounded-xl bg-acid px-8 py-4 text-base font-extrabold text-ink shadow-acid transition duration-200 hover:-translate-y-0.5 hover:brightness-110"
            >
              <Github size={20} /> Sign In With GitHub
            </a>
            <Link
              to="/leaderboard"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-6 py-4 text-base font-bold text-white transition hover:border-white/25"
            >
              <Trophy size={18} /> View Standings
            </Link>
          </div>
        </div>
      </section>
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
      <div className="absolute -inset-10 rounded-full bg-violet/15 blur-3xl" />
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-panel shadow-2xl backdrop-blur">
        <div className="h-1 bg-gradient-to-r from-transparent via-violet to-transparent" />
        <div className="p-7 sm:p-8">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] font-bold tracking-[.22em] text-acid uppercase">Active Quest</p>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-slate-300">
              Difficulty 7.6 / 10
            </span>
          </div>

          <h3 className="mt-3 text-xl font-bold text-white leading-snug">Fix Concurrent Cache Stampede</h3>
          <div className="mt-3 text-5xl sm:text-6xl font-black tracking-[-.07em] text-acid text-glow">
            760 <span className="text-base font-bold tracking-normal text-slate-400">XP</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 font-mono text-[10px]">
            <span className="rounded border border-white/10 bg-white/[.04] px-2 py-0.5 text-slate-300">Python IV</span>
            <span className="rounded border border-white/10 bg-white/[.04] px-2 py-0.5 text-slate-300">Concurrency IV</span>
            <span className="rounded border border-white/10 bg-white/[.04] px-2 py-0.5 text-slate-300">Redis</span>
          </div>

          {claimed ? (
            <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 size={18} /> Quest Claimed!
              </div>
              <p className="mt-1 text-xs text-slate-400 font-mono">
                Now open a PR closing the issue to claim 760 XP.
              </p>
              <button
                onClick={onReset}
                className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-slate-500 hover:text-white transition"
              >
                <RotateCcw size={12} /> Reset demo
              </button>
            </div>
          ) : (
            <button
              onClick={onClaim}
              className="mt-6 flex w-full items-center justify-between rounded-xl bg-acid px-5 py-4 font-extrabold text-ink shadow-acid transition hover:brightness-110 active:scale-[0.98]"
            >
              <span>Claim quest</span>
              <ArrowRight size={18} />
            </button>
          )}

          <div className="mt-7 border-t border-white/[.08] pt-5">
            <div className="flex justify-between font-mono text-[10px] font-bold tracking-wider text-slate-500">
              <span>PLAYER LEVEL 7</span>
              <span className="text-slate-300">8,420 XP</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[.07]">
              <i className="block h-full w-[68%] rounded-full bg-acid shadow-[0_0_12px_#b9f456]" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Badges */}
      <div className="absolute -right-4 top-14 rounded-2xl border border-acid/20 bg-[#10150f]/90 px-4 py-3 shadow-xl backdrop-blur">
        <span className="font-mono text-[9px] text-slate-500">GLOBAL RANK</span>
        <b className="block text-xl font-mono text-acid">#42</b>
      </div>
      <div className="absolute -left-4 bottom-10 rounded-2xl border border-white/10 bg-panel/90 px-4 py-3 shadow-xl backdrop-blur">
        <span className="font-mono text-[9px] text-slate-500">BOUNTY STATUS</span>
        <b className="block text-sm font-mono text-emerald-400 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> READY
        </b>
      </div>
    </div>
  );
}
