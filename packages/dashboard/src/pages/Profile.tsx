import type { SkillCategory, UserProfile, XpTimelinePoint } from "@gitventure/shared";
import { roman, skillProgress } from "@gitventure/shared";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle2,
  DatabaseZap,
  Link2,
  Swords,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { notifyClaimsChanged, onClaimsChanged } from "../lib/claimSync";
import PageShell from "../components/ui/PageShell";
import DashHeader from "../components/ui/DashHeader";
import { Surface } from "../components/ui/Surface";
import ProgressBar from "../components/ui/ProgressBar";
import XpProgressBar from "../components/ui/XpProgressBar";
import ScrollReveal from "../motion/ScrollReveal";
import { cardReveal } from "../motion/scrollMotion";

const CATEGORY_ORDER: SkillCategory[] = ["Backend", "Frontend", "Systems", "Data", "Practices", "Other"];

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [timeline, setTimeline] = useState<XpTimelinePoint[]>([]);
  const [error, setError] = useState("");
  const [unclaimingId, setUnclaimingId] = useState<number | null>(null);

  const loadProfile = async () => {
    const [nextProfile, nextTimeline] = await Promise.all([
      api<UserProfile>("/users/me"),
      api<{ timeline: XpTimelinePoint[] }>("/users/me/timeline").catch(() => ({ timeline: [] as XpTimelinePoint[] })),
    ]);
    setProfile(nextProfile);
    setTimeline(nextTimeline.timeline);
  };

  useEffect(() => {
    void loadProfile().catch((reason) =>
      setError(reason instanceof Error ? reason.message : "Could not load profile"),
    );
  }, []);

  useEffect(() => {
    return onClaimsChanged(() => {
      void loadProfile().catch(() => {});
    });
  }, []);

  if (error) {
    return (
      <PageShell reveal={false}>
        <p className="py-20 text-center font-body text-sm text-red-400">{error}</p>
      </PageShell>
    );
  }

  if (!profile) {
    return (
      <PageShell reveal={false}>
        <p className="py-20 text-center font-mono text-xs uppercase tracking-[0.2em] text-mist">
          Loading player data…
        </p>
      </PageShell>
    );
  }

  const double = async (claimId: number, choice: "take" | "risk") => {
    await api(`/claims/${claimId}/double`, { method: "POST", body: JSON.stringify({ choice }) });
    notifyClaimsChanged(claimId);
    setProfile(await api<UserProfile>("/users/me"));
  };

  const unclaim = async (claimId: number) => {
    if (unclaimingId != null) return;
    setUnclaimingId(claimId);
    // Optimistic remove — feels instant across surfaces once sync fires.
    setProfile((current) =>
      current
        ? {
            ...current,
            claims: current.claims.filter((claim) => claim.id !== claimId),
            stats: {
              ...current.stats,
              activeQuests: Math.max(0, current.stats.activeQuests - 1),
            },
          }
        : current,
    );
    try {
      await api(`/claims/${claimId}/abandon`, { method: "POST" });
      notifyClaimsChanged(claimId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not unclaim quest");
      await loadProfile().catch(() => {});
    } finally {
      setUnclaimingId(null);
    }
  };

  if (!profile.user.goals?.length) return null;


  const grouped = CATEGORY_ORDER
    .map((category) => ({ category, skills: profile.skills.filter((skill) => skill.category === category) }))
    .filter((group) => group.skills.length);

  const pendingDouble = profile.claims.filter((claim) => claim.status === "merged" && !claim.doubleChoice);
  const visibleClaims = profile.claims.filter((claim) => claim.status !== "abandoned");


  return (
    <PageShell>
      {/* Hero identity */}
      <ScrollReveal>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <img
              className="h-24 w-24 rounded-[22px] border border-trail/40 bg-panel object-cover shadow-trail"
              src={profile.user.avatarUrl ?? ""}
              alt=""
            />
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-mist">
                Player profile
              </p>
              <h1 className="mt-2 font-display text-[clamp(1.85rem,4vw,2.75rem)] font-semibold tracking-[-0.03em] text-snow">
                @{profile.user.githubLogin}
              </h1>
              {profile.user.profileSummary && (
                <p className="mt-2 max-w-xl font-body text-sm leading-relaxed text-fog">
                  {profile.user.profileSummary}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:flex-col lg:items-stretch">
            <Link to="/next" className="gv-btn-primary px-5 py-3 text-sm">
              Find next quest
            </Link>
            <Link to="/pair" className="gv-btn-secondary px-5 py-3 text-sm text-snow">
              <Link2 size={16} /> Pair extension
            </Link>
          </div>
        </div>
      </ScrollReveal>

      {/* Canonical XP / level progress */}
      <ScrollReveal className="mt-10" delay={0.06}>
        <Surface className="p-6 sm:p-7">
          <XpProgressBar
            size="lg"
            totalXp={profile.user.totalXp}
            level={profile.level}
            xpIntoLevel={profile.xpIntoLevel}
            xpForNextLevel={profile.xpForNextLevel}
          />
          <p className="mt-4 border-t border-white/[0.06] pt-4 font-body text-xs leading-relaxed text-mist">
            XP is awarded only when a linked PR merges. Quest bounty = difficulty × 100 (max 1,000).
            Difficulty is a weighted score of five AI axes — harder issues pay more.
          </p>
        </Surface>
      </ScrollReveal>

      {/* Stats */}
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <StatCard index={0} icon={<Trophy />} label="Total XP" value={profile.user.totalXp.toLocaleString()} />
        <StatCard index={1} icon={<CheckCircle2 />} label="Quests completed" value={String(profile.stats.questsCompleted)} />
        <StatCard
          index={2}
          icon={<Trophy />}
          label="Global rank"
          value={profile.stats.globalRank ? `#${profile.stats.globalRank}` : "—"}
        />
      </div>

      <XpTimeline timeline={timeline} />

      {/* Skill tree */}
      <section className="mt-16">
        <DashHeader
          eyebrow="Progression"
          title="Skill tree"
          subtitle="Persistent skills earned from real merged pull requests."
        />
        {grouped.length ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {grouped.map((group, i) => (
              <Surface key={group.category} index={i} className="p-6 sm:p-7">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-mist">
                  {group.category}
                </p>
                <div className="mt-5 space-y-5">
                  {group.skills.map((skill) => {
                    const bar = skillProgress(skill.xp);
                    const width = Math.min(100, (bar.xpIntoLevel / Math.max(1, bar.xpForNextLevel)) * 100);
                    return (
                      <div key={skill.name}>
                        <div className="flex justify-between gap-3 text-sm">
                          <b className="font-display font-semibold text-snow">
                            {skill.name} {roman(skill.level)}
                          </b>
                          <span className="font-mono text-[11px] text-mist">
                            {skill.xp.toLocaleString()} XP
                          </span>
                        </div>
                        <ProgressBar
                          className="mt-2"
                          value={width}
                          size="sm"
                          label={`${skill.name} skill progress`}
                        />
                      </div>
                    );
                  })}
                </div>
              </Surface>
            ))}
          </div>
        ) : (
          <Surface className="mt-8 p-8">
            <p className="font-body text-sm text-mist">Complete a quest to grow your first skill.</p>
          </Surface>
        )}
      </section>

      {/* Achievements */}
      <section className="mt-16">
        <DashHeader
          eyebrow="Milestones"
          title="Achievements"
          subtitle="Unlocked when real merges clear the bar."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profile.achievements.length ? (
            profile.achievements.map((achievement, i) => (
              <Surface key={achievement.code} index={i} className="border-trail/20 bg-trail/[0.05] p-6">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-trail">
                  Unlocked
                </p>
                <b className="mt-2 block font-display text-lg font-semibold text-snow">
                  {achievement.name}
                </b>
                <p className="mt-1 font-body text-sm leading-relaxed text-fog">
                  {achievement.description}
                </p>
              </Surface>
            ))
          ) : (
            <p className="font-body text-sm text-mist">Badges appear after your first verified merge.</p>
          )}
        </div>
      </section>

      {/* Quest log + recent XP */}
      <div className="mt-16 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
        <section>
          <DashHeader eyebrow="History" title="Quest log" />
          <div className="mt-6 space-y-4">
            {pendingDouble.map((claim) => (
              <Surface key={`double-${claim.id}`} className="border-trail/25 bg-trail/[0.06] p-5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-trail">
                  Double or nothing
                </p>
                <p className="mt-2 font-body text-sm text-fog">
                  You received {claim.xpAwarded.toLocaleString()} XP. Keep it, or risk an equal bonus to
                  double the reward.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void double(claim.id, "take")}
                    className="gv-btn-primary px-4 py-2 text-xs"
                  >
                    Take XP
                  </button>
                  <button
                    type="button"
                    onClick={() => void double(claim.id, "risk")}
                    className="gv-btn-secondary border-trail/40 px-4 py-2 text-xs font-semibold text-trail hover:border-trail/55 hover:bg-trail/10"
                  >
                    Risk 50/50
                  </button>
                </div>
              </Surface>
            ))}

            <Surface className="overflow-hidden p-0">
              {visibleClaims.length ? (
                visibleClaims.map((claim) => {
                  const quest = claim.score;
                  const canUnclaim = claim.status === "claimed" || claim.status === "submitted";
                  return (
                    <div
                      key={claim.id}
                      className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4 last:border-0 transition-colors duration-300 hover:bg-white/[0.03]"
                    >
                      <a
                        href={quest?.issueUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-w-0 flex-1 items-center gap-4 text-inherit no-underline"
                      >
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                            claim.status === "merged"
                              ? "bg-trail/10 text-trail"
                              : "bg-beacon/10 text-beacon"
                          }`}
                        >
                          {claim.status === "merged" ? <CheckCircle2 size={17} /> : <Swords size={17} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <b className="block truncate font-body text-sm font-semibold text-snow">
                            {quest?.title ?? claim.issueNodeId}
                          </b>
                          <small className="font-mono text-[10px] uppercase tracking-wider text-mist">
                            {quest?.questKey ?? ""} · {claim.status}
                          </small>
                        </span>
                        <span className="font-mono text-xs font-bold text-trail">
                          {(claim.xpAwarded || quest?.xp || 0).toLocaleString()} XP
                        </span>
                        <ArrowUpRight className="shrink-0 text-mist" size={15} />
                      </a>
                      {canUnclaim && (
                        <button
                          type="button"
                          title="Unclaim quest"
                          aria-label="Unclaim quest"
                          disabled={unclaimingId === claim.id}
                          onClick={() => void unclaim(claim.id)}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/12 text-mist transition-colors hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                        >
                          <X size={14} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="p-10 text-center font-body text-sm text-mist">
                  Open GitHub and claim your first quest.
                </p>
              )}
            </Surface>
          </div>
        </section>

        <section>
          <DashHeader eyebrow="Ledger" title="Recent XP" />
          <Surface className="mt-6 p-5">
            {profile.recentEvents.length ? (
              profile.recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex justify-between gap-3 border-b border-white/[0.06] py-3 last:border-0"
                >
                  <span className="min-w-0 truncate font-body text-xs text-mist">
                    {event.note || event.kind}
                  </span>
                  <b className="shrink-0 font-mono text-xs text-trail">+{event.delta.toLocaleString()}</b>
                </div>
              ))
            ) : (
              <p className="py-8 text-center font-body text-xs text-mist">Your XP history will appear here.</p>
            )}
          </Surface>
        </section>
      </div>
    </PageShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  index,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  index: number;
}) {
  return (
    <Surface index={index} className="p-6">
      <span className="text-trail [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <b className="mt-5 block font-display text-3xl font-semibold tracking-tight text-snow">{value}</b>
      <span className="mt-1 block font-mono text-[11px] uppercase tracking-[0.14em] text-mist">{label}</span>
    </Surface>
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
    <ScrollReveal className="mt-12">
      <Surface className="p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-mist">
              Analytics
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-snow">
              XP velocity
            </h2>
            <p className="mt-1 font-body text-xs text-fog">Daily XP earned over the last 14 days</p>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-trail/25 bg-trail/10 px-3 py-1.5 font-mono text-[10px] font-bold tracking-wider text-trail">
            <DatabaseZap size={13} /> Tiger Data
          </span>
        </div>
        <div className="mt-7 flex h-40 items-end gap-2" aria-label="Daily XP chart">
          {days.map((day, i) => (
            <motion.div
              key={day.key}
              className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
              title={`${day.label}: ${day.xp.toLocaleString()} XP`}
              variants={cardReveal}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <span className="font-mono text-[9px] text-trail opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {day.xp || ""}
              </span>
              <i
                className="w-full min-w-1 rounded-t bg-gradient-to-t from-trail/40 to-trail shadow-[0_0_12px_rgba(255,107,53,0.2)]"
                style={{ height: `${day.xp ? Math.max(8, (day.xp / maxXp) * 112) : 3}px` }}
              />
            </motion.div>
          ))}
        </div>
      </Surface>
    </ScrollReveal>
  );
}
