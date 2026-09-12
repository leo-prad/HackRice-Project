import { CheckCheck, FileText, Forward, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { Course, Email, EmailSummary } from "../../types";
import { AnimatedPopover } from "../motion/AnimatedPopover";
import { SmoothScrollPane } from "../motion/SmoothScrollPane";
import { motionPresets } from "../../theme/motion";
import { EmailHtmlBody } from "./EmailHtmlBody";
import { MailReaderToolbar } from "./MailReaderToolbar";
import { DraftReplyCard } from "./DraftReplyCard";
import { avatarColor, formatDetailDate, getInitials } from "./utils";

type Props = {
  email: Email | null;
  folderLabel: string;
  threadMessageCount?: number;
  loading: boolean;
  error: string | null;
  summary: EmailSummary | null;
  summaryVisible: boolean;
  summaryError: string | null;
  summarizing: boolean;
  generating: boolean;
  starred: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  searchRef?: React.RefObject<HTMLInputElement | null>;
  onSummarize: () => void;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onArchive: () => void;
  onJunk: () => void;
  onToggleStar: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
  onDismissSummary: () => void;
  tags: string[];
  emailTags: string[];
  onToggleTag: (tag: string) => void;
  onAddTag: () => void;
  onTagClick: (tag: string) => void;
  courses: Course[];
  emailCourseId: string | null;
  onAssignCourse: (courseId: string | null) => void;
  draftData?: { body: string; generating: boolean; status?: string; to?: string; cc?: string; bcc?: string };
  onUpdateDraft?: (updates: Partial<{ body: string; to: string; cc: string; bcc: string }>) => void;
  onSendDraft?: () => void;
  onRegenerateDraft?: () => void;
  draftSourceLabel?: string;
};

export function MailDetailPanel(props: Props) {
  const {
    email, folderLabel, threadMessageCount, loading, error, summary, summaryVisible, summaryError,
    summarizing, generating, starred, search, onSearchChange, searchRef, onSummarize, onReply,
    onReplyAll, onForward, onArchive, onJunk, onToggleStar, onMarkRead, onDelete, onDismissSummary,
    tags, emailTags, onToggleTag, onAddTag, onTagClick, courses, emailCourseId, onAssignCourse,
    draftData, onUpdateDraft, onSendDraft, onRegenerateDraft, draftSourceLabel,
  } = props;

  const bodyText = email?.body?.trim() || email?.preview?.trim() || "";
  const bodyHtml = email?.bodyHtml?.trim();
  const msgCount = Math.max(1, threadMessageCount ?? 1);
  const reduceMotion = useReducedMotion();

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-incuria-surface text-incuria-ink">
      <MailReaderToolbar
        disabled={!email}
        starred={starred}
        search={search}
        onSearchChange={onSearchChange}
        searchRef={searchRef}
        onReply={onReply}
        onReplyAll={onReplyAll}
        onForward={onForward}
        onArchive={onArchive}
        onDelete={onDelete}
        onJunk={onJunk}
        onToggleStar={onToggleStar}
        onMarkRead={onMarkRead}
      />

      <SmoothScrollPane className="mail-detail-scroll scrollbar-mail min-h-0 flex-1">
        {loading && !bodyHtml && !bodyText ? (
          <DetailSkeleton />
        ) : !email ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center">
            <p className="text-[17px] font-medium text-incuria-ink-muted">No message selected</p>
            <p className="mt-1.5 text-[13px] text-incuria-ink-muted/80">
              Choose an email or press <Kbd>↑</Kbd> <Kbd>↓</Kbd>
            </p>
          </div>
        ) : (
          <article key={email.id}>
            {/* Email header */}
            <header className="border-b border-incuria-border px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-incuria-ink-muted">{msgCount} Message{msgCount === 1 ? "" : "s"}</span>
                <button
                  type="button"
                  onClick={onSummarize}
                  disabled={summarizing}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-incuria-accent hover:text-incuria-accent-hover disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                  {summarizing ? "Summarizing…" : "Summarize"}
                </button>
              </div>

              <div className="mt-3 flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold ${avatarColor(email.from)}`}>
                  {getInitials(email.from)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold leading-tight text-incuria-ink">{email.from}</p>
                  <p className="mt-0.5 truncate text-[14px] text-incuria-ink-muted">{email.subject || "(No subject)"}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <time className="text-[13px] tabular-nums text-incuria-ink-muted">{formatDetailDate(email.date)}</time>
                  <span className="rounded-full bg-incuria-ink/[0.06] px-2 py-0.5 text-[11px] font-medium text-incuria-ink-muted">
                    {folderLabel}
                  </span>
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                {email.fromAddress ? (
                  <span className="text-[13px] text-incuria-ink-muted">To: {email.toAddresses?.[0] ?? "me"}</span>
                ) : null}
                {/* label + course assignment (functional) */}
                {emailTags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded bg-incuria-ink/[0.06] px-2 py-0.5 text-[11px] font-medium text-incuria-ink">
                    <button type="button" onClick={() => onTagClick(tag)} className="hover:underline">{tag}</button>
                    <button type="button" onClick={() => onToggleTag(tag)} className="text-incuria-ink-muted hover:text-incuria-ink">&times;</button>
                  </span>
                ))}
                <AnimatedPopover label="+ Label">
                  {tags.filter((t) => !emailTags.includes(t)).map((t) => (
                    <DropItem key={t} onClick={() => onToggleTag(t)}>{t}</DropItem>
                  ))}
                  <DropItem onClick={onAddTag} border>Create new…</DropItem>
                </AnimatedPopover>
                <AnimatedPopover label={emailCourseId ? courses.find((c) => c.id === emailCourseId)?.name || "Course" : "+ Course"}>
                  {emailCourseId ? <DropItem onClick={() => onAssignCourse(null)} danger border>Clear course</DropItem> : null}
                  {courses.map((c) => (
                    <DropItem key={c.id} onClick={() => onAssignCourse(c.id)} active={emailCourseId === c.id}>{c.name}</DropItem>
                  ))}
                </AnimatedPopover>
              </div>
            </header>

            {/* Inline AI summary card (beneath header) */}
            {summaryError ? (
              <div className="mx-6 mt-4 rounded-lg border border-incuria-needs-reply/30 bg-incuria-needs-reply-soft px-4 py-3 text-[13px] text-incuria-needs-reply">{summaryError}</div>
            ) : null}
            {summaryVisible && summary ? <AiSummaryCard summary={summary} onClose={onDismissSummary} /> : null}

            {/* Body */}
            <div className="px-6 py-5">
              {error ? (
                <p className="mb-4 rounded-lg border border-incuria-needs-reply/30 bg-incuria-needs-reply-soft px-4 py-3 text-[13px] text-incuria-needs-reply">{error}</p>
              ) : null}

              {bodyHtml ? (
                <div className="overflow-hidden rounded-lg border border-incuria-border bg-white">
                  <EmailHtmlBody html={bodyHtml} />
                </div>
              ) : bodyText ? (
                <div className="whitespace-pre-wrap break-words text-[15px] leading-[1.7] text-incuria-ink">{bodyText}</div>
              ) : (
                <span className="text-incuria-ink-muted">No message body.</span>
              )}

              {/* Smart reply suggestions */}
              <div className="mt-6 flex flex-wrap gap-2">
                <SmartPill icon={<Sparkles className="h-3.5 w-3.5" strokeWidth={2} />} primary onClick={onReply} disabled={generating}>
                  {generating ? "Drafting…" : "Reply with AI"}
                </SmartPill>
                <SmartPill icon={<CheckCheck className="h-3.5 w-3.5" strokeWidth={2} />} onClick={onMarkRead}>Mark as read</SmartPill>
                <SmartPill icon={<Forward className="h-3.5 w-3.5" strokeWidth={2} />} onClick={onForward}>Forward to TA</SmartPill>
              </div>

              {/* Inline draft editor */}
              {draftData && onUpdateDraft && onSendDraft && onRegenerateDraft ? (
                <DraftReplyCard
                  body={draftData.body}
                  generating={draftData.generating}
                  status={draftData.status}
                  sourceLabel={draftSourceLabel}
                  to={draftData.to}
                  cc={draftData.cc}
                  bcc={draftData.bcc}
                  fromAddress={email.fromAddress || email.from}
                  onUpdateDraft={onUpdateDraft}
                  onSend={onSendDraft}
                  onRegenerate={onRegenerateDraft}
                />
              ) : null}
            </div>
          </article>
        )}
      </SmoothScrollPane>
    </section>
  );
}

function SmartPill({ icon, children, onClick, primary, disabled }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={reduceMotion || disabled ? undefined : motionPresets.tap}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-50 ${
        primary
          ? "border-incuria-accent bg-incuria-accent text-white hover:bg-incuria-accent-hover"
          : "border-incuria-border bg-white text-incuria-ink hover:bg-incuria-ink/[0.04]"
      }`}
    >
      {icon}
      {children}
    </motion.button>
  );
}

function DropItem({ children, onClick, active, danger, border }: { children: React.ReactNode; onClick: () => void; active?: boolean; danger?: boolean; border?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full rounded px-2 py-1.5 text-left text-[12px] transition-colors hover:bg-incuria-select ${border ? "mt-1 border-t border-incuria-border" : ""} ${
        danger ? "text-incuria-needs-reply" : active ? "bg-incuria-accent-soft font-semibold text-incuria-accent" : "text-incuria-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-incuria-border bg-incuria-canvas px-1.5 py-0.5 text-[10px] font-medium text-incuria-ink-muted">{children}</kbd>;
}

function DetailSkeleton() {
  return (
    <div className="px-6 py-5">
      <div className="mail-skeleton h-9 w-9 rounded-full" />
      <div className="mail-skeleton mt-4 h-5 w-2/3 max-w-md rounded-lg" />
      <div className="mail-skeleton mt-6 h-4 w-full rounded" />
      <div className="mail-skeleton mt-3 h-4 w-11/12 rounded" />
      <div className="mail-skeleton mt-3 h-4 w-4/5 rounded opacity-60" />
    </div>
  );
}

function AiSummaryCard({ summary, onClose }: { summary: EmailSummary; onClose: () => void }) {
  const points = [summary.tldr, ...summary.keyPoints, summary.actionRequired ? `Action: ${summary.actionRequired}` : null].filter(Boolean) as string[];
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="mx-6 mt-4 rounded-xl border border-incuria-border bg-incuria-canvas p-4"
      initial={reduceMotion ? false : motionPresets.modal.initial}
      animate={reduceMotion ? undefined : motionPresets.modal.animate}
      transition={motionPresets.modal.transition}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-incuria-ink">
          <FileText className="h-4 w-4 text-incuria-accent" />
          AI summary
        </div>
        <button type="button" onClick={onClose} className="text-[12px] font-medium text-incuria-ink-muted hover:text-incuria-ink">Dismiss</button>
      </div>
      <ul className="mt-3 space-y-2">
        {points.map((point) => (
          <li key={point} className="flex gap-2.5 text-[13px] leading-relaxed text-incuria-ink">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-incuria-accent" />
            {point}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
