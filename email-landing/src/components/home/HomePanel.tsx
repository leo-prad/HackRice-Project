import { useMemo } from "react";
import { Inbox, MessageCircleReply, BookOpen, Sparkles, X } from "lucide-react";
import type { Course, Email } from "../../types";
import type { EmailCluster } from "../mail/utils";
import { PriorityCard } from "./PriorityCard";
import { BatchOpportunityCard } from "./BatchOpportunityCard";
import { StaggerList, StaggerItem } from "../motion/StaggerList";
import { PageCanvas } from "../ui/PageCanvas";
import { Eyebrow } from "../ui/Eyebrow";
import { BrandButton } from "../ui/BrandButton";
import { BrandCard } from "../ui/BrandCard";
import { IncuriaMark } from "../brand/IncuriaLogo";
import { ROUTES } from "../../lib/routes";

type Props = {
  emails: Email[];
  clusters: EmailCluster[];
  courses: Course[];
  loading: boolean;
  displayName: string;
  onSelectEmail: (id: string) => void;
  showCoachMark?: boolean;
  onDismissCoachMark?: () => void;
};

const URGENT_RE = /urgent|asap|emergency|immediately|deadline|critical|important|today|tonight/i;
const MEDIUM_RE = /soon|tomorrow|next week|please|help|issue|grade|extension|exam|midterm|final/i;

function priorityScore(email: Email): number {
  let score = 0;
  const text = `${email.subject} ${email.preview || email.body || ""}`;
  if (email.urgency === "high" || URGENT_RE.test(text)) score += 100;
  else if (email.urgency === "medium" || MEDIUM_RE.test(text)) score += 50;
  if (email.isRead === false) score += 25;
  score += Math.max(0, 20 - Math.floor((Date.now() - new Date(email.date).getTime()) / 86_400_000));
  return score;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function HomePanel({
  emails,
  clusters,
  courses,
  loading,
  displayName,
  onSelectEmail,
  showCoachMark = false,
  onDismissCoachMark,
}: Props) {
  const priorities = useMemo(
    () =>
      [...emails]
        .filter((e) => e.isRead !== true || URGENT_RE.test(`${e.subject} ${e.preview || ""}`))
        .sort((a, b) => priorityScore(b) - priorityScore(a))
        .slice(0, 3),
    [emails],
  );

  const topClusters = useMemo(() => clusters.slice(0, 3), [clusters]);

  const courseGaps = useMemo(() => {
    return courses
      .filter((c) => !c.trainedAt)
      .filter((c) => {
        const name = c.name.toLowerCase();
        return emails.some((e) => `${e.subject} ${e.preview || e.body || ""}`.toLowerCase().includes(name));
      })
      .slice(0, 3);
  }, [courses, emails]);

  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const firstName = displayName.trim().split(/\s+/)[0] || "there";
  const nothingToDo = !loading && priorities.length === 0 && topClusters.length === 0;

  return (
    <PageCanvas variant="workbench" gradient={false} className="px-5 py-10 sm:px-10 sm:py-14">
      <div className="mx-auto w-full max-w-3xl">
        {showCoachMark ? (
          <div className="mb-8 flex items-start gap-4 rounded-2xl border border-incuria-accent/30 bg-incuria-accent-soft/40 p-5">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-incuria-accent" strokeWidth={1.75} />
            <div className="min-w-0 flex-1">
              <p className="font-landing-body text-sm font-semibold text-incuria-ink">
                Your course is trained
              </p>
              <p className="mt-1 font-landing-body text-sm leading-relaxed text-incuria-ink-muted">
                Open <strong className="font-medium text-incuria-ink">Needs reply</strong> to draft your
                first AI reply.
              </p>
              <BrandButton variant="primary" to={ROUTES.NEEDS_REPLY} className="mt-3 px-4 py-2 text-xs">
                Go to Needs reply
              </BrandButton>
            </div>
            {onDismissCoachMark ? (
              <button
                type="button"
                onClick={onDismissCoachMark}
                className="shrink-0 rounded-full p-1 text-incuria-ink-muted hover:bg-incuria-ink/[0.06] hover:text-incuria-ink"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            ) : null}
          </div>
        ) : null}

        <header>
          <Eyebrow>{dateLabel}</Eyebrow>
          <h1 className="mt-3 font-landing-display text-[clamp(2rem,5vw,2.75rem)] font-semibold leading-tight tracking-[-0.02em] text-incuria-ink">
            {greeting()}, {firstName}.
          </h1>
        </header>

        {nothingToDo ? (
          <BrandCard className="mt-14 px-6 py-16 text-center sm:px-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-incuria-accent-soft/80">
              <IncuriaMark size={32} className="opacity-90" />
            </div>
            <h2 className="mt-6 font-landing-display text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.02em] text-incuria-ink">
              You&apos;re all caught up
            </h2>
            <p className="mx-auto mt-3 max-w-sm font-landing-body text-sm leading-[1.75] text-incuria-ink-muted">
              Nothing needs your attention right now. Back to teaching.
            </p>
          </BrandCard>
        ) : (
          <div className="mt-10 space-y-12 sm:mt-12">
            <Section
              eyebrow="Reply first"
              cta={<BrandButton variant="ghost" to={ROUTES.NEEDS_REPLY}>View all</BrandButton>}
            >
              {loading ? (
                <SkeletonRows />
              ) : priorities.length > 0 ? (
                <StaggerList animationKey="priorities" className="space-y-2">
                  {priorities.map((email, i) => (
                    <StaggerItem key={email.id}>
                      <PriorityCard email={email} rank={i + 1} onSelect={onSelectEmail} />
                    </StaggerItem>
                  ))}
                </StaggerList>
              ) : (
                <EmptyHint icon={<Inbox className="h-4 w-4" />} text="No messages waiting on a reply." />
              )}
            </Section>

            {topClusters.length > 0 ? (
              <Section eyebrow="Batch opportunities">
                <StaggerList animationKey="clusters" className="space-y-2">
                  {topClusters.map((cluster) => (
                    <StaggerItem key={cluster.key}>
                      <BatchOpportunityCard cluster={cluster} />
                    </StaggerItem>
                  ))}
                </StaggerList>
              </Section>
            ) : null}

            {courseGaps.length > 0 ? (
              <Section eyebrow="Course gaps">
                <div className="space-y-2">
                  {courseGaps.map((c) => (
                    <BrandCard key={c.id} className="flex items-center gap-4 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-incuria-accent-soft text-incuria-accent">
                        <BookOpen className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-landing-body text-sm font-semibold text-incuria-ink">
                          {c.name}
                        </span>
                        <span className="mt-0.5 block font-landing-body text-xs leading-[1.75] text-incuria-ink-muted">
                          Emails mention this course, but no materials are trained yet.
                        </span>
                      </span>
                      <BrandButton variant="primary" to={ROUTES.COURSES} className="shrink-0 px-4 py-2 text-xs">
                        Train
                      </BrandButton>
                    </BrandCard>
                  ))}
                </div>
              </Section>
            ) : null}
          </div>
        )}
      </div>
    </PageCanvas>
  );
}

function Section({
  eyebrow,
  cta,
  children,
}: {
  eyebrow: string;
  cta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Eyebrow as="span" className="normal-case tracking-[0.12em] text-incuria-ink-muted">
            {eyebrow}
          </Eyebrow>
          <MessageCircleReply className="h-3.5 w-3.5 text-incuria-accent" strokeWidth={1.75} aria-hidden />
        </div>
        {cta}
      </div>
      {children}
    </section>
  );
}

function EmptyHint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-dashed border-incuria-border px-4 py-6 font-landing-body text-sm text-incuria-ink-muted">
      <span className="text-incuria-ink-faint">{icon}</span>
      {text}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[88px] rounded-2xl border border-incuria-border bg-incuria-surface">
          <div className="mail-skeleton h-full w-full rounded-2xl" />
        </div>
      ))}
    </div>
  );
}
