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

  const topThree = entries.slice(0, 3);
  const remaining = entries.slice(3);

  // Arrange podium visual order: #2 (Silver, left), #1 (Gold, center), #3 (Bronze, right)
  const podiumOrder = [
    { entry: topThree[1], place: 2 },
    { entry: topThree[0], place: 1 },
    { entry: topThree[2], place: 3 },
  ].filter((p) => Boolean(p.entry));

  const podiumConfig = {
    1: {
      title: "CHAMPION",
      badge: "1ST PLACE",
      icon: Crown,
      ring: "border-amber-400/80 shadow-[0_0_30px_rgba(251,191,36,0.35)]",
      badgeBg: "bg-amber-400 text-ink shadow-[0_0_15px_rgba(251,191,36,0.5)]",
      pillarBg: "from-amber-500/20 via-amber-500/10 to-panel/90 border-amber-400/30",
      pillarHeight: "h-48 sm:h-52",
      avatarSize: "h-20 w-20 sm:h-24 sm:w-24",
      orderClass: "order-1 sm:order-2",
      accentText: "text-amber-300",
      pedestalNum: "1",
    },
    2: {
      title: "RUNNER UP",
      badge: "2ND PLACE",
      icon: Medal,
      ring: "border-slate-300/80 shadow-[0_0_24px_rgba(203,213,225,0.25)]",
      badgeBg: "bg-slate-200 text-ink shadow-[0_0_12px_rgba(203,213,225,0.4)]",
      pillarBg: "from-slate-400/15 via-slate-400/5 to-panel/90 border-slate-300/25",
      pillarHeight: "h-36 sm:h-40",
      avatarSize: "h-16 w-16 sm:h-20 sm:w-20",
      orderClass: "order-2 sm:order-1",
      accentText: "text-slate-200",
      pedestalNum: "2",
    },
    3: {
      title: "CONTENDER",
      badge: "3RD PLACE",
      icon: Trophy,
      ring: "border-amber-600/80 shadow-[0_0_24px_rgba(217,119,6,0.25)]",
      badgeBg: "bg-amber-600 text-white shadow-[0_0_12px_rgba(217,119,6,0.4)]",
      pillarBg: "from-amber-700/20 via-amber-700/10 to-panel/90 border-amber-600/30",
      pillarHeight: "h-32 sm:h-34",
      avatarSize: "h-16 w-16 sm:h-20 sm:w-20",
      orderClass: "order-3 sm:order-3",
      accentText: "text-amber-400",
      pedestalNum: "3",
    },
  } as const;

  return (
    <div className="mx-auto max-w-5xl px-5 py-16 fade-up">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] font-bold tracking-[.25em] text-acid uppercase">Global Standings</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-[-.04em]">Hall of Fame</h1>
          <p className="mt-2 text-sm sm:text-base text-slate-400">Open source contributions, ranked by cryptographic proof.</p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[.03] px-4 py-2 font-mono text-[11px] text-slate-400 backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" /> LIVE LEADERBOARD
        </div>
      </div>

      {error && (
        <div className="mt-10 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-sm font-mono text-red-300">
          {error}
        </div>
      )}

      {!error && !entries.length && (
        <div className="mt-16 rounded-2xl border border-white/[.08] bg-panel/80 p-16 text-center">
          <Trophy className="mx-auto h-12 w-12 text-slate-600" />
          <p className="mt-4 font-mono text-sm text-slate-400">No champions yet recorded in this realm.</p>
          <p className="mt-1 font-mono text-xs text-slate-600">The first quest is yours to claim.</p>
        </div>
      )}

      {/* Top 3 Podium */}
      {topThree.length > 0 && (
        <div className="mt-14 mb-16">
          <div className="relative flex flex-col sm:flex-row items-center sm:items-end justify-center gap-6 pt-12">
            {podiumOrder.map(({ entry, place }) => {
              const cfg = podiumConfig[place as 1 | 2 | 3];
              const IconComponent = cfg.icon;
              return (
                <div
                  key={entry.login}
                  className={`flex w-full sm:w-1/3 max-w-[280px] flex-col items-center ${cfg.orderClass} transition-all duration-300 hover:-translate-y-1`}
                >
                  {/* Player Avatar */}
                  <div className="relative mb-4 flex w-full flex-col items-center">
                    <div className="relative">
                      <img
                        className={`${cfg.avatarSize} rounded-full border-2 bg-slate-900 object-cover ${cfg.ring}`}
                        src={entry.avatarUrl || `https://github.com/${entry.login}.png`}
                        alt={entry.login}
                      />
                      <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-ink font-mono text-[10px] font-bold text-white shadow">
                        L{entry.level}
                      </div>
                    </div>

                    <div className="mt-3 w-full text-center px-2">
                      <a
                        href={`https://github.com/${entry.login}`}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex items-center justify-center max-w-full text-base font-bold text-white transition hover:text-acid"
                      >
                        <span className="truncate">{entry.login}</span>
                      </a>
                      <div className="mt-1 flex items-center justify-center gap-2 font-mono text-[11px] text-slate-400">
                        <span>{entry.questsCompleted} quests</span>
                        <span className="text-slate-600">•</span>
                        <span className={`font-bold ${cfg.accentText}`}>{entry.totalXp.toLocaleString()} XP</span>
                      </div>
                    </div>
                  </div>

                  {/* Podium Pedestal Pillar */}
                  <div
                    className={`relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border bg-gradient-to-b p-3.5 sm:p-4 text-center shadow-2xl backdrop-blur ${cfg.pillarBg} ${cfg.pillarHeight}`}
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    
                    <div className="font-mono text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                      {cfg.title}
                    </div>

                    <div className="flex flex-1 items-center justify-center py-1">
                      <span className={`font-mono text-4xl sm:text-5xl font-black opacity-30 select-none ${cfg.accentText}`}>
                        #{cfg.pedestalNum}
                      </span>
                    </div>

                    <div className="rounded-lg border border-white/5 bg-black/40 py-1 px-2.5 font-mono text-xs font-bold text-slate-300">
                      <span className={cfg.accentText}>{entry.totalXp.toLocaleString()}</span> XP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Standings Table (Ranks 4+) */}
      {remaining.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between px-2">
            <h2 className="font-mono text-xs font-bold tracking-wider text-slate-400 uppercase">All Contenders</h2>
            <span className="font-mono text-[11px] text-slate-600">{entries.length} Total Contenders</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[.08] bg-panel/90 shadow-2xl">
            <div className="grid grid-cols-[60px_1fr_80px_90px_110px] border-b border-white/[.07] px-5 py-3 font-mono text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <span>Rank</span>
              <span>Player</span>
              <span>Level</span>
              <span>Quests</span>
              <span className="text-right">Total XP</span>
            </div>
            {remaining.map((entry) => (
              <div
                key={entry.login}
                className="grid grid-cols-[60px_1fr_80px_90px_110px] items-center border-b border-white/[.05] px-5 py-3.5 last:border-0 transition-colors hover:bg-white/[.03]"
              >
                <span className="font-mono text-sm font-bold text-slate-500">
                  #{entry.rank}
                </span>
                <a
                  href={`https://github.com/${entry.login}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 items-center gap-3 group"
                >
                  <img
                    className="h-8 w-8 rounded-full border border-white/10 bg-slate-800 object-cover"
                    src={entry.avatarUrl || `https://github.com/${entry.login}.png`}
                    alt=""
                  />
                  <b className="truncate text-slate-200 group-hover:text-acid transition-colors">{entry.login}</b>
                </a>
                <span className="font-mono text-xs text-slate-400">LVL {entry.level}</span>
                <span className="font-mono text-xs text-slate-400">{entry.questsCompleted ?? 0}</span>
                <strong className="text-right font-mono text-sm text-white">{entry.totalXp.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
