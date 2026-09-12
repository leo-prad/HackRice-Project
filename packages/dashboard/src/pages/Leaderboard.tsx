import type { LeaderboardEntry } from "@gitventure/shared";
import { Crown, Medal, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import PageShell from "../components/ui/PageShell";
import DashHeader from "../components/ui/DashHeader";
import { Surface } from "../components/ui/Surface";

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

  const podiumOrder = [
    { entry: topThree[1], place: 2 },
    { entry: topThree[0], place: 1 },
    { entry: topThree[2], place: 3 },
  ].filter((p) => Boolean(p.entry));

  const podiumConfig = {
    1: {
      title: "Champion",
      icon: Crown,
      ring: "border-trail/70 shadow-trail",
      badgeBg: "bg-trail text-void",
      pillarBg: "from-trail/20 via-trail/8 to-panel/90 border-trail/30",
      pillarHeight: "h-48 sm:h-52",
      avatarSize: "h-20 w-20 sm:h-24 sm:w-24",
      orderClass: "order-1 sm:order-2",
      accentText: "text-trail",
      pedestalNum: "1",
    },
    2: {
      title: "Runner up",
      icon: Medal,
      ring: "border-snow/50 shadow-[0_0_24px_rgba(232,237,242,0.12)]",
      badgeBg: "bg-snow text-void",
      pillarBg: "from-white/10 via-white/[0.04] to-panel/90 border-white/20",
      pillarHeight: "h-36 sm:h-40",
      avatarSize: "h-16 w-16 sm:h-20 sm:w-20",
      orderClass: "order-2 sm:order-1",
      accentText: "text-snow",
      pedestalNum: "2",
    },
    3: {
      title: "Contender",
      icon: Trophy,
      ring: "border-beacon/60 shadow-[0_0_24px_rgba(61,255,168,0.18)]",
      badgeBg: "bg-beacon text-void",
      pillarBg: "from-beacon/15 via-beacon/5 to-panel/90 border-beacon/25",
      pillarHeight: "h-32 sm:h-36",
      avatarSize: "h-16 w-16 sm:h-20 sm:w-20",
      orderClass: "order-3 sm:order-3",
      accentText: "text-beacon",
      pedestalNum: "3",
    },
  } as const;

  return (
    <PageShell className="max-w-5xl">
      <DashHeader
        eyebrow="Standings"
        title="Hall of Fame"
        subtitle="Open source contributions, ranked by verified merges."
        action={
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-[11px] text-fog">
            <span className="h-2 w-2 animate-pulse rounded-full bg-beacon shadow-[0_0_8px_rgba(61,255,168,0.5)]" />
            Live leaderboard
          </div>
        }
      />

      {error && (
        <Surface className="mt-10 border-red-500/20 bg-red-500/10 p-6 text-center font-mono text-sm text-red-300">
          {error}
        </Surface>
      )}

      {!error && !entries.length && (
        <Surface className="mt-16 p-16 text-center">
          <Trophy className="mx-auto h-12 w-12 text-mist" />
          <p className="mt-4 font-body text-sm text-fog">No champions yet recorded.</p>
          <p className="mt-1 font-mono text-xs text-mist">The first quest is yours to claim.</p>
        </Surface>
      )}

      {topThree.length > 0 && (
        <div className="mt-14 mb-16">
          <div className="relative flex flex-col items-center justify-center gap-6 pt-12 sm:flex-row sm:items-end">
            {podiumOrder.map(({ entry, place }) => {
              const cfg = podiumConfig[place as 1 | 2 | 3];
              return (
                <div
                  key={entry.login}
                  className={`flex w-full max-w-[280px] flex-col items-center sm:w-1/3 ${cfg.orderClass} transition-transform duration-300 hover:-translate-y-1`}
                >
                  <div className="relative mb-4 flex w-full flex-col items-center">
                    <div className="relative">
                      <img
                        className={`${cfg.avatarSize} rounded-full border-2 bg-panel object-cover ${cfg.ring}`}
                        src={entry.avatarUrl || `https://github.com/${entry.login}.png`}
                        alt={entry.login}
                      />
                      <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-void font-mono text-[10px] font-bold text-snow">
                        L{entry.level}
                      </div>
                    </div>

                    <div className="mt-3 w-full px-2 text-center">
                      <a
                        href={`https://github.com/${entry.login}`}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex max-w-full items-center justify-center font-body text-base font-semibold text-snow transition-colors hover:text-trail"
                      >
                        <span className="truncate">{entry.login}</span>
                      </a>
                      <div className="mt-1 flex items-center justify-center gap-2 font-mono text-[11px] text-mist">
                        <span>{entry.questsCompleted} quests</span>
                        <span className="text-white/20">·</span>
                        <span className={`font-bold ${cfg.accentText}`}>{entry.totalXp.toLocaleString()} XP</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`relative flex w-full flex-col justify-between overflow-hidden rounded-[18px] border bg-gradient-to-b p-3.5 text-center backdrop-blur sm:p-4 ${cfg.pillarBg} ${cfg.pillarHeight}`}
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-mist">
                      {cfg.title}
                    </div>
                    <div className="flex flex-1 items-center justify-center py-1">
                      <span
                        className={`select-none font-display text-4xl font-semibold opacity-30 sm:text-5xl ${cfg.accentText}`}
                      >
                        #{cfg.pedestalNum}
                      </span>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-void/50 px-2.5 py-1 font-mono text-xs font-bold text-fog">
                      <span className={cfg.accentText}>{entry.totalXp.toLocaleString()}</span> XP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {remaining.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between px-2">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-mist">All contenders</h2>
            <span className="font-mono text-[11px] text-mist">{entries.length} total</span>
          </div>

          <Surface className="overflow-hidden p-0">
            <div className="grid grid-cols-[60px_1fr_80px_90px_110px] border-b border-white/[0.07] px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-mist">
              <span>Rank</span>
              <span>Player</span>
              <span>Level</span>
              <span>Quests</span>
              <span className="text-right">Total XP</span>
            </div>
            {remaining.map((entry) => (
              <div
                key={entry.login}
                className="grid grid-cols-[60px_1fr_80px_90px_110px] items-center border-b border-white/[0.05] px-5 py-3.5 transition-colors last:border-0 hover:bg-white/[0.03]"
              >
                <span className="font-mono text-sm font-bold text-mist">#{entry.rank}</span>
                <a
                  href={`https://github.com/${entry.login}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-w-0 items-center gap-3"
                >
                  <img
                    className="h-8 w-8 rounded-full border border-white/10 bg-panel object-cover"
                    src={entry.avatarUrl || `https://github.com/${entry.login}.png`}
                    alt=""
                  />
                  <b className="truncate font-body text-snow transition-colors group-hover:text-trail">
                    {entry.login}
                  </b>
                </a>
                <span className="font-mono text-xs text-fog">LVL {entry.level}</span>
                <span className="font-mono text-xs text-fog">{entry.questsCompleted ?? 0}</span>
                <strong className="text-right font-mono text-sm text-trail">
                  {entry.totalXp.toLocaleString()}
                </strong>
              </div>
            ))}
          </Surface>
        </div>
      )}
    </PageShell>
  );
}
