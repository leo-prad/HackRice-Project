import { ArrowRight, Chrome, Github, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/api";

export default function Login() {
  return (
    <>
      <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-14 px-5 py-20 lg:grid-cols-[1.1fr_.9fr]">
        <div className="fade-up">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-acid/20 bg-acid/[.06] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-acid">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-acid" /> Level up by solving real software problems
          </div>
          <h1 className="max-w-3xl text-6xl font-black leading-[.94] tracking-[-.065em] text-white sm:text-7xl">
            GitHub already has millions of <span className="text-glow text-acid">quests.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
            GitQuest is an AI game engine for open source. Live issues become rated quests. Real merges become XP, skills, and a path to harder work.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href={`${API_BASE}/auth/github`} className="flex items-center gap-2 rounded-xl bg-acid px-5 py-3.5 font-extrabold text-ink shadow-acid transition hover:-translate-y-0.5 hover:brightness-110">
              <Github size={19} /> Continue with GitHub <ArrowRight size={18} />
            </a>
            <Link to="/leaderboard" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-5 py-3.5 font-bold text-white hover:border-white/25">
              <Trophy size={18} /> View leaderboard
            </Link>
          </div>
          <div className="mt-8 flex gap-6 font-mono text-[10px] uppercase tracking-wider text-slate-600">
            <span className="flex items-center gap-2"><ShieldCheck size={14} /> Read:user</span>
            <span className="flex items-center gap-2"><ShieldCheck size={14} /> Repo</span>
          </div>
        </div>
        <QuestPreview />
      </section>
      <section className="border-y border-white/[.06] bg-white/[.018]">
        <div className="mx-auto grid max-w-6xl gap-px px-5 py-0 sm:grid-cols-3">
          {[
            [Chrome, "Quest Board on GitHub", "Open issues become XP bounties right on the GitHub list."],
            [Sparkles, "One canonical XP value", "AI analyzes the issue. The backend assigns XP. Every player sees the same bounty."],
            [Trophy, "Proof over promises", "Link a PR you authored. XP unlocks when a maintainer approves or merges it."],
          ].map(([Icon, title, body]) => (
            <div key={String(title)} className="border-white/[.06] px-8 py-12 sm:border-l last:border-r">
              <Icon className="mb-5 text-acid" size={22} />
              <h2 className="font-bold text-white">{String(title)}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{String(body)}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function QuestPreview() {
  return (
    <div className="fade-up relative mx-auto w-full max-w-[410px] [animation-delay:120ms]">
      <div className="absolute -inset-12 rounded-full bg-violet/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-panel shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-transparent via-violet to-transparent" />
        <div className="p-8">
          <p className="font-mono text-[10px] font-bold tracking-[.22em] text-violet">QUEST BOUNTY</p>
          <p className="mt-3 font-semibold">Fix Concurrent Cache Mutation</p>
          <div className="mt-2 text-6xl font-black tracking-[-.07em] text-violet text-glow">760 <span className="text-base tracking-normal">XP</span></div>
          <p className="mt-4 font-mono text-[11px] text-slate-500">Python · Concurrency · open 12 days</p>
          <button className="mt-7 flex w-full items-center justify-between rounded-xl bg-violet px-4 py-3.5 font-extrabold text-ink">
            Claim quest <ArrowRight size={18} />
          </button>
          <div className="mt-7 border-t border-white/[.07] pt-5">
            <div className="flex justify-between font-mono text-[10px] font-bold tracking-wider text-slate-500">
              <span>LEVEL 7</span>
              <span className="text-slate-300">8,420 XP</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.07]">
              <i className="block h-full w-[68%] rounded-full bg-violet shadow-[0_0_12px_#a78bfa]" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -right-5 top-16 rounded-xl border border-acid/20 bg-[#10150f] px-4 py-3 shadow-xl">
        <span className="font-mono text-[9px] text-slate-500">GLOBAL RANK</span>
        <b className="block text-xl text-acid">#42</b>
      </div>
    </div>
  );
}
