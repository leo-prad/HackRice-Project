import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { motionPresets } from "../../theme/motion";
import { GENERAL_COURSE_ID } from "../../types";
import type { Course } from "../../types";
import { IconClose } from "./icons";
import { mail } from "./theme";
import { ROUTES } from "../../lib/routes";

type Props = {
  open: boolean;
  onClose: () => void;
  replyTo: string;
  replySubject: string;
  replyBody: string;
  onReplyToChange: (v: string) => void;
  onReplySubjectChange: (v: string) => void;
  onReplyBodyChange: (v: string) => void;
  replyInstructions: string;
  onReplyInstructionsChange: (v: string) => void;
  courses: Course[];
  coursesLoading: boolean;
  coursesError: string | null;
  onRetryCourses: () => void;
  courseId: string;
  onCourseChange: (id: string) => void;
  onGenerate: () => void;
  onSend: () => void;
  generating: boolean;
  sending: boolean;
  statusNote: string | null;
};

export function ReplyComposer({
  open,
  onClose,
  replyTo,
  replySubject,
  replyBody,
  onReplyToChange,
  onReplySubjectChange,
  onReplyBodyChange,
  replyInstructions,
  onReplyInstructionsChange,
  courses,
  coursesLoading,
  coursesError,
  onRetryCourses,
  courseId,
  onCourseChange,
  onGenerate,
  onSend,
  generating,
  sending,
  statusNote,
}: Props) {
  const reduceMotion = useReducedMotion();

  const options = [
    { id: GENERAL_COURSE_ID, label: "General" },
    ...courses.map((c) => ({ id: c.id, label: c.name })),
  ];

  const selectedCourse =
    courseId !== GENERAL_COURSE_ID ? courses.find((c) => c.id === courseId) : undefined;
  const showUntrainedBanner = Boolean(selectedCourse && !selectedCourse.trainedAt && !coursesLoading);

  return (
    <AnimatePresence>
      {open ? (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-incuria-ink/40 p-4 backdrop-blur-md sm:items-center"
      initial={motionPresets.overlay.initial}
      animate={motionPresets.overlay.animate}
      exit={motionPresets.overlay.exit}
      transition={motionPresets.overlay.transition}
    >
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <motion.div
        initial={reduceMotion ? undefined : motionPresets.modal.initial}
        animate={reduceMotion ? undefined : motionPresets.modal.animate}
        exit={reduceMotion ? undefined : motionPresets.modal.exit}
        transition={motionPresets.modal.transition}
        className={`relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border ${mail.borderStrong || mail.border} ${mail.panelAlt} shadow-incuria-pop`}
      >
        <div className={`flex items-center justify-between border-b ${mail.border} px-5 py-4`}>
          <h3 className={`text-lg font-semibold ${mail.text}`}>Reply with AI</h3>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-2 ${mail.btnGhost}`}
          >
            <IconClose />
          </button>
        </div>

        <div className={`min-h-0 flex-1 px-5 py-4 ${mail.scroll}`}>
          <div className="mb-4">
            <p className={`mb-2 text-xs font-semibold uppercase tracking-wide text-incuria-ink-muted`}>Course</p>
            {coursesError ? (
              <p className="mb-2 text-sm text-incuria-ink-muted">
                {coursesError}{" "}
                <button type="button" onClick={onRetryCourses} className={`${mail.link} underline`}>
                  Retry
                </button>
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {coursesLoading ? (
                <span className={mail.textMuted}>Loading courses…</span>
              ) : (
                options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onCourseChange(opt.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium ${mail.transition} ${
                      courseId === opt.id
                        ? "border-incuria-accent bg-incuria-accent-soft text-incuria-accent"
                        : "border-incuria-border text-incuria-ink-muted hover:border-incuria-accent/40 hover:text-incuria-ink"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
            {courses.length === 0 && !coursesLoading ? (
              <p className={`mt-2 text-xs ${mail.textMuted}`}>
                <Link to={ROUTES.COURSES} className={mail.link}>
                  Add courses
                </Link>{" "}
                for RAG-powered replies.
              </p>
            ) : null}
            {showUntrainedBanner ? (
              <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-incuria-ink-muted">
                This course has no trained materials yet.{" "}
                <Link to={ROUTES.COURSES} className={`${mail.link} font-medium`}>
                  Upload &amp; train
                </Link>
              </p>
            ) : null}
          </div>

          <label className="mb-4 block">
            <span className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide text-incuria-ink-muted`}>
              Additional notes
            </span>
            <textarea
              value={replyInstructions}
              onChange={(e) => onReplyInstructionsChange(e.target.value)}
              placeholder="Tone, policies, meeting time (e.g. Tuesday 2pm for a calendar invite)…"
              rows={3}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm ${mail.input}`}
            />
          </label>

          <label className="mb-3 block">
            <span className={`mb-1 block text-xs font-medium ${mail.textDim}`}>To</span>
            <input
              value={replyTo}
              onChange={(e) => onReplyToChange(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${mail.input}`}
            />
          </label>
          <label className="mb-3 block">
            <span className={`mb-1 block text-xs font-medium ${mail.textDim}`}>Subject</span>
            <input
              value={replySubject}
              onChange={(e) => onReplySubjectChange(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${mail.input}`}
            />
          </label>
          <label className="block">
            <span className={`mb-1 block text-xs font-medium ${mail.textDim}`}>Message</span>
            <textarea
              value={replyBody}
              onChange={(e) => onReplyBodyChange(e.target.value)}
              rows={10}
              placeholder="Click Generate draft to create a reply…"
              className={`w-full rounded-xl border px-3 py-2.5 text-base leading-relaxed ${mail.input}`}
            />
          </label>
          {statusNote ? <p className={`mt-3 text-sm ${mail.textMuted}`}>{statusNote}</p> : null}
        </div>

        <div className={`flex flex-wrap gap-2 border-t ${mail.border} bg-incuria-canvas px-5 py-4`}>
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50 ${mail.btnPrimary}`}
          >
            {generating ? "Generating…" : "Generate draft"}
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={sending || !replyBody.trim()}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50 ${mail.btnSecondary}`}
          >
            {sending ? "Sending…" : "Send"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`ml-auto rounded-xl px-4 py-2.5 text-sm font-medium ${mail.btnGhost}`}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
