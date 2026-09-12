import type { LeaderboardEntry } from "@questline/shared";
import { Crown, Medal, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api<{ entries: LeaderboardEntry[] }>("/leaderboard?limit=50")
      .then((result) => setEntries(result.entries))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load standings"));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-5 py-20 fade-up">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] font-bold tracking-[.2em] text-acid">GLOBAL STANDINGS</p>
          <h1 className="mt-3 text-5xl font-black tracking-[-.05em]">The leaderboard</h1>
          <p className="mt-3 text-slate-500">Open source work, ranked by proof.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.025] px-4 py-2 font-mono text-[10px] text-slate-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> LIVE RANKINGS
        </div>
      </div>
      <div className="mt-10 overflow-hidden rounded-2xl border border-white/[.08] bg-panel/90 shadow-2xl">
        <div className="grid grid-cols-[55px_1fr_70px_80px_100px] border-b border-white/[.07] px-5 py-3 font-mono text-[9px] font-bold tracking-wider text-slate-600">
          <span>RANK</span>
          <span>PLAYER</span>
          <span>LEVEL</span>
          <span>QUESTS</span>
          <span className="text-right">TOTAL XP</span>
        </div>
        {error && <p className="p-8 text-center text-red-400">{error}</p>}
        {!error && !entries.length && <p className="p-12 text-center text-slate-600">No players yet. The first quest is yours.</p>}
        {entries.map((entry) => (
          <div key={entry.login} className="grid grid-cols-[55px_1fr_70px_80px_100px] items-center border-b border-white/[.055] px-5 py-4 last:border-0 hover:bg-white/[.025]">
            <span className={`font-mono text-sm font-bold ${entry.rank <= 3 ? "text-acid" : "text-slate-600"}`}>
              {entry.rank === 1 ? <Crown size={18} /> : entry.rank === 2 ? <Medal size={18} /> : entry.rank === 3 ? <Trophy size={17} /> : `#${entry.rank}`}
            </span>
            <span className="flex min-w-0 items-center gap-3">
              <img className="h-9 w-9 rounded-full bg-slate-800" src={entry.avatarUrl ?? ""} alt="" />
              <b className="truncate">{entry.login}</b>
            </span>
            <span className="font-mono text-xs text-slate-400">LVL {entry.level}</span>
            <span className="font-mono text-xs text-slate-400">{entry.questsCompleted ?? 0}</span>
            <strong className="text-right font-mono text-sm text-white">{entry.totalXp.toLocaleString()}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
