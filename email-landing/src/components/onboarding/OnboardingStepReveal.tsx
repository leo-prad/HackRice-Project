import { Sparkles } from "lucide-react";
import { useLineReveal } from "../../hooks/useLineReveal";

type Props = {
  courseName: string;
  sourceLabel: string;
  teachingRules: string;
  phase: "training" | "reveal" | "done";
  onEnterInbox: () => void;
};

function buildMockDraftLines(courseName: string, teachingRules: string): string[] {
  const course = courseName.trim() || "your course";
  const hasExtensionRule = /extension|deadline|syllabus/i.test(teachingRules);
  const lines = [
    `Hi — thanks for reaching out about ${course}.`,
    hasExtensionRule
      ? "Per the syllabus, documented illness qualifies for a 48-hour extension on this assignment."
      : "I've reviewed your message and will follow the policies outlined in the course materials.",
    "Let me know if you have any other questions.",
  ];
  return lines;
}

export function OnboardingStepReveal({
  courseName,
  sourceLabel,
  teachingRules,
  phase,
  onEnterInbox,
}: Props) {
  const draftLines = buildMockDraftLines(courseName, teachingRules);
  const visible = useLineReveal(draftLines, phase === "reveal" || phase === "done", courseName);

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="font-landing-display text-[clamp(1.75rem,4.5vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-incuria-ink">
          {phase === "training" ? "Training your assistant…" : "This is Incuria at work"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-incuria-ink-muted">
          {phase === "training"
            ? "Indexing your materials so drafts cite what you actually teach."
            : "Replies grounded in your syllabus and rules — ready when students email."}
        </p>
      </header>

      {phase === "training" ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-incuria-accent/25 border-t-incuria-accent" />
          <p className="text-sm text-incuria-ink-muted" role="status">
            Uploading sources and building your knowledge base…
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-incuria-accent/25 bg-gradient-to-b from-incuria-accent-soft/70 to-incuria-accent-soft/40 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-incuria-accent" strokeWidth={1.75} />
              <span className="text-xs font-semibold text-incuria-accent">
                Draft ready · From your materials and rules
              </span>
            </div>
            <div className="mt-4 space-y-1.5">
              {draftLines.map((line, i) => (
                <p
                  key={i}
                  className={`text-sm leading-relaxed text-incuria-ink transition-opacity duration-200 ${
                    i < visible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {line}
                  {i === visible - 1 && visible < draftLines.length ? (
                    <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-incuria-accent align-middle" />
                  ) : null}
                </p>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-1.5 rounded-lg border border-incuria-accent/15 bg-white/60 px-2.5 py-1.5">
              <Sparkles className="h-3 w-3 text-incuria-accent" strokeWidth={1.75} />
              <span className="text-[10px] text-incuria-accent">{sourceLabel}</span>
            </div>
          </div>

          <ul className="mx-auto max-w-md space-y-2 text-sm text-incuria-ink-muted">
            <li className="flex gap-2">
              <span className="text-incuria-accent">✓</span>
              Needs-reply triage surfaces urgent student emails first
            </li>
            <li className="flex gap-2">
              <span className="text-incuria-accent">✓</span>
              Batch similar questions into one personalized reply
            </li>
            <li className="flex gap-2">
              <span className="text-incuria-accent">✓</span>
              You approve every send — Incuria drafts, you decide
            </li>
          </ul>

          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={onEnterInbox}
              disabled={visible < draftLines.length}
              className="w-full max-w-sm rounded-full bg-incuria-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-incuria-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enter your inbox
            </button>
          </div>
        </>
      )}
    </div>
  );
}
