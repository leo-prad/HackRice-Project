import type { SkillCategory, UserProfile, XpTimelinePoint } from "@questline/shared";
import { roman, skillProgress } from "@questline/shared";
import { ArrowUpRight, CheckCircle2, DatabaseZap, Link2, Swords, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../lib/api";

const CATEGORY_ORDER: SkillCategory[] = ["Backend", "Frontend", "Systems", "Data", "Practices", "Other"];

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [timeline, setTimeline] = useState<XpTimelinePoint[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    void Promise.all([
      api<UserProfile>("/users/me"),
      api<{ timeline: XpTimelinePoint[] }>("/users/me/timeline").catch(() => ({ timeline: [] })),
    ]).then(([nextProfile, nextTimeline]) => {
      setProfile(nextProfile);
      setTimeline(nextTimeline.timeline);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load profile"));
  }, []);
  if (error) return <p className="p-20 text-center text-red-400">{error}</p>;
  if (!profile) return <p className="p-20 text-center font-mono text-xs text-slate-600">LOADING PLAYER DATA…</p>;

  const double = async (claimId: number, choice: "take" | "risk") => {
    await api(`/claims/${claimId}/double`, { method: "POST", body: JSON.stringify({ choice }) });
    setProfile(await api<UserProfile>("/users/me"));
  };

  if (!profile.user.goals?.length) return <Navigate to="/onboard" replace />;

  const progress = Math.min(100, (profile.xpIntoLevel / Math.max(1, profile.xpForNextLevel)) * 100);
  const grouped = CATEGORY_ORDER
    .map((category) => ({ category, skills: profile.skills.filter((skill) => skill.category === category) }))
    .filter((group) => group.skills.length);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 fade-up">
      <div className="flex flex-col gap-7 sm:flex-row sm:items-center">
        <img className="h-24 w-24 rounded-3xl border-2 border-acid/50 bg-panel shadow-acid" src={profile.user.avatarUrl ?? ""} alt="" />
        <div className="flex-1">
          <p className="font-mono text-[10px] font-bold tracking-[.2em] text-acid">PLAYER</p>
          <h1 className="mt-1 text-4xl font-black tracking-tight">{profile.user.githubLogin.toUpperCase()}</h1>
          {profile.user.profileSummary && (
            <p className="mt-2 max-w-xl text-sm text-slate-400">{profile.user.profileSummary}</p>
          )}
          <div className="mt-4 max-w-lg">
            <div className="flex justify-between font-mono text-[10px] font-bold text-slate-500">
              <span>LEVEL {profile.level}</span>
              <span>{profile.xpIntoLevel.toLocaleString()} / {profile.xpForNextLevel.toLocaleString()} XP</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[.07]">
              <i className="block h-full rounded-full bg-acid shadow-[0_0_14px_#b9f456]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Link to="/next" className="rounded-xl bg-acid px-4 py-3 text-center text-sm font-extrabold text-ink">Find next quest</Link>
          <Link to="/pair" className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold hover:border-acid/30">
            <Link2 size={16} /> Pair extension
          </Link>
        </div>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <Stat icon={<Trophy />} label="Total XP" value={profile.user.totalXp.toLocaleString()} />
        <Stat icon={<CheckCircle2 />} label="Quests completed" value={String(profile.stats.questsCompleted)} />
        <Stat icon={<Trophy />} label="Global rank" value={profile.stats.globalRank ? `#${profile.stats.globalRank}` : "—"} />
      </div>

      <XpTimeline timeline={timeline} />

      <section className="mt-14">
        <h2 className="text-lg font-bold">Skill tree</h2>
        <p className="mt-1 text-sm text-slate-500">Persistent skills earned from real merged pull requests.</p>
        {grouped.length ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {grouped.map((group) => (
              <div key={group.category} className="rounded-2xl border border-white/[.08] bg-panel p-5">
                <p className="font-mono text-[10px] font-bold tracking-[.18em] text-slate-500">{group.category.toUpperCase()}</p>
                <div className="mt-4 space-y-4">
                  {group.skills.map((skill) => {
                    const bar = skillProgress(skill.xp);
                    const width = Math.min(100, (bar.xpIntoLevel / Math.max(1, bar.xpForNextLevel)) * 100);
                    return (
                      <div key={skill.name}>
                        <div className="flex justify-between text-sm">
                          <b>{skill.name} {roman(skill.level)}</b>
                          <span className="font-mono text-[11px] text-slate-500">{skill.xp.toLocaleString()} XP</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.07]">
                          <i className="block h-full rounded-full bg-acid/80" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-white/[.08] bg-panel p-8 text-sm text-slate-500">Complete a quest to grow your first skill.</p>
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-lg font-bold">Achievements</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profile.achievements.length ? profile.achievements.map((achievement) => (
            <div key={achievement.code} className="rounded-2xl border border-amber-400/20 bg-amber-400/[.06] p-5">
              <p className="font-mono text-[10px] font-bold tracking-[.16em] text-amber-300">UNLOCKED</p>
              <b className="mt-2 block">{achievement.name}</b>
              <p className="mt-1 text-sm text-slate-400">{achievement.description}</p>
            </div>
          )) : <p className="text-sm text-slate-500">Badges appear after your first verified merge.</p>}
        </div>
      </section>

      <div className="mt-14 grid gap-8 lg:grid-cols-[1.4fr_.6fr]">
        <section>
          <h2 className="mb-4 text-lg font-bold">Quest log</h2>
          {profile.claims.filter((claim) => claim.status === "merged" && !claim.doubleChoice).map((claim) => (
            <div key={`double-${claim.id}`} className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-300/[.07] p-4">
              <p className="font-mono text-[10px] font-bold tracking-[.16em] text-amber-200">💰 DOUBLE OR NOTHING</p>
              <p className="mt-1 text-sm text-slate-300">You received {claim.xpAwarded.toLocaleString()} XP. Keep it, or risk an equal bonus to double the reward.</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => void double(claim.id, "take")} className="rounded-lg bg-acid px-3 py-2 text-xs font-black text-ink">Take XP</button>
                <button onClick={() => void double(claim.id, "risk")} className="rounded-lg border border-amber-200/50 px-3 py-2 text-xs font-black text-amber-100">🎲 Risk 50/50</button>
              </div>
            </div>
          ))}
          <div className="overflow-hidden rounded-2xl border border-white/[.08] bg-panel">
            {profile.claims.length ? profile.claims.map((claim) => {
              const quest = claim.score;
              return (
                <a
                  key={claim.id}
                  href={quest?.issueUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 border-b border-white/[.06] p-5 last:border-0 hover:bg-white/[.025]"
                >
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${claim.status === "merged" ? "bg-acid/10 text-acid" : "bg-violet/10 text-violet"}`}>
                    {claim.status === "merged" ? <CheckCircle2 size={17} /> : <Swords size={17} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-sm">{quest?.title ?? claim.issueNodeId}</b>
                    <small className="font-mono text-[10px] uppercase text-slate-600">
                      {quest?.questKey ?? ""} · {claim.status}
                    </small>
                  </span>
                  <span className="font-mono text-xs font-bold text-acid">{(claim.xpAwarded || quest?.xp || 0).toLocaleString()} XP</span>
                  <ArrowUpRight className="text-slate-700" size={15} />
                </a>
              );
            }) : <p className="p-10 text-center text-sm text-slate-600">Open GitHub and claim your first quest.</p>}
          </div>
        </section>
        <section>
          <h2 className="mb-4 text-lg font-bold">Recent XP</h2>
          <div className="rounded-2xl border border-white/[.08] bg-panel p-5">
            {profile.recentEvents.length ? profile.recentEvents.map((event) => (
              <div key={event.id} className="flex justify-between border-b border-white/[.06] py-3 last:border-0">
                <span className="text-xs text-slate-500">{event.note || event.kind}</span>
                <b className="font-mono text-xs text-acid">+{event.delta.toLocaleString()}</b>
              </div>
            )) : <p className="py-8 text-center text-xs text-slate-600">Your XP history will appear here.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function XpTimeline({ timeline }: { timeline: XpTimelinePoint[] }) {
  const values = new Map(timeline.map((point) => [point.bucket.slice(0, 10), point]));
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (13 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" }),
      xp: values.get(key)?.xpEarned ?? 0,
    };
  });
  const maxXp = Math.max(1, ...days.map((day) => day.xp));

  return (
    <section className="mt-14 rounded-2xl border border-white/[.08] bg-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">XP velocity</h2>
          <p className="mt-1 text-xs text-slate-500">Daily XP earned over the last 14 days</p>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 font-mono text-[10px] font-bold tracking-wider text-orange-300">
          <DatabaseZap size={13} /> TIGER DATA LIVE ANALYTICS
        </span>
      </div>
      <div className="mt-7 flex h-40 items-end gap-2" aria-label="Daily XP chart">
        {days.map((day) => (
          <div key={day.key} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${day.label}: ${day.xp.toLocaleString()} XP`}>
            <span className="opacity-0 font-mono text-[9px] text-acid transition-opacity group-hover:opacity-100">{day.xp || ""}</span>
            <i
              className="w-full min-w-1 rounded-t bg-gradient-to-t from-orange-500/50 to-acid shadow-[0_0_12px_rgba(185,244,86,.2)]"
              style={{ height: `${day.xp ? Math.max(8, (day.xp / maxXp) * 112) : 3}px` }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[.08] bg-panel p-6">
      <span className="text-acid [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <b className="mt-5 block text-3xl font-black tracking-tight">{value}</b>
      <span className="mt-1 block text-xs text-slate-500">{label}</span>
    </div>
  );
}
