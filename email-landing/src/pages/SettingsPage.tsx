import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ChevronDown, Sparkles, User } from "lucide-react";
import { AnimatedExpand } from "../components/motion/AnimatedExpand";
import { SmoothScrollPane } from "../components/motion/SmoothScrollPane";
import { BackToMailLink } from "../components/BackToMailLink";
import { PageCanvas } from "../components/ui/PageCanvas";
import { Eyebrow } from "../components/ui/Eyebrow";
import { useCourseSources } from "../hooks/useCourseSources";
import { listCourses } from "../lib/api";
import { getTeachingRules, ROUTES, setTeachingRules } from "../lib/routes";
import type { Course } from "../types";

function SettingsCourseRow({ course, onMessage }: { course: Course; onMessage: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const sources = useCourseSources(open ? course.id : null);

  useEffect(() => {
    if (open) void sources.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, course.id]);

  return (
    <li className="overflow-hidden rounded-xl border border-incuria-border bg-incuria-canvas">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-incuria-ink/[0.03]"
      >
        <span className="truncate text-sm font-medium text-incuria-ink">{course.name}</span>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              course.trainedAt
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-incuria-ink/[0.06] text-incuria-ink-muted"
            }`}
          >
            {course.trainedAt ? "AI trained" : "Not trained"}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-incuria-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth={1.75}
          />
        </div>
      </button>

      <AnimatedExpand open={open}>
        <div className="border-t border-incuria-border px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={sources.busy}
              className="rounded-full border border-incuria-border bg-incuria-surface px-3 py-1.5 text-xs font-medium text-incuria-ink transition-colors hover:bg-incuria-select disabled:opacity-50 active:scale-[0.97]"
            >
              Upload source
            </button>
            <button
              type="button"
              disabled={sources.busy || sources.documents.length === 0}
              onClick={() =>
                void sources.train().then((r) => {
                  if (r) onMessage(`Trained ${course.name}`);
                  else if (sources.error) onMessage(sources.error);
                })
              }
              className="rounded-full bg-incuria-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-incuria-accent/90 disabled:opacity-50 active:scale-[0.97]"
            >
              {sources.step === "training" ? "Training…" : "Train"}
            </button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void sources.uploadFile(file).then(() => onMessage(`Uploaded to ${course.name}`));
                }
                e.target.value = "";
              }}
            />
          </div>
          {sources.stepLabel ? (
            <p className="mt-2 text-xs text-incuria-ink-muted">{sources.stepLabel}</p>
          ) : null}
          {sources.documents.length > 0 ? (
            <p className="mt-2 text-xs text-incuria-ink-muted">
              {sources.documents.length} source{sources.documents.length === 1 ? "" : "s"} on file
            </p>
          ) : (
            <p className="mt-2 text-xs text-incuria-ink-muted">No sources yet for this course.</p>
          )}
        </div>
      </AnimatedExpand>
    </li>
  );
}

export default function SettingsPage() {
  const [rules, setRules] = useState(() => getTeachingRules());
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const refreshCourses = useCallback(async () => {
    setLoading(true);
    try {
      setCourses(await listCourses());
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCourses();
  }, [refreshCourses]);

  function saveRules() {
    setTeachingRules(rules);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <PageCanvas variant="workbench" gradient={false} className="px-6 py-8 sm:px-10">
      <SmoothScrollPane className="h-full">
      <div className="mx-auto w-full max-w-2xl pb-8">
        <BackToMailLink />

        <header className="mt-6">
          <Eyebrow className="mb-2">Preferences</Eyebrow>
          <h1 className="font-landing-display text-3xl font-semibold tracking-[-0.02em] text-incuria-ink">
            Settings
          </h1>
          <p className="mt-2 text-sm text-incuria-ink-muted">
            Train Incuria on your materials and set how it drafts replies.
          </p>
        </header>

        {msg ? (
          <p className="mt-4 text-sm text-incuria-ink-muted" role="status">
            {msg}
          </p>
        ) : null}

        <section className="mt-8 overflow-hidden rounded-2xl border border-incuria-border bg-incuria-surface">
          <div className="flex items-center gap-3 border-b border-incuria-border px-5 py-3">
            <Sparkles className="h-4 w-4 text-incuria-accent" strokeWidth={1.75} />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-incuria-ink-muted">
              Teaching voice
            </h2>
          </div>
          <div className="px-5 py-4">
            <p className="mb-3 text-sm text-incuria-ink-muted">
              Default instructions for AI drafts — tone, policies, and boundaries.
            </p>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={5}
              placeholder="Formal tone. Extensions require documentation. Never promise grade changes."
              className="w-full resize-none rounded-xl border border-incuria-border bg-incuria-canvas px-4 py-3 text-sm text-incuria-ink placeholder:text-incuria-ink-muted/60 focus:border-incuria-accent/50 focus:outline-none focus:ring-2 focus:ring-incuria-accent/20"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={saveRules}
                className="rounded-full bg-incuria-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-incuria-accent/90 active:scale-[0.97]"
              >
                Save rules
              </button>
              {saved ? (
                <span className="text-sm text-incuria-ink-muted" role="status">
                  Saved
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-incuria-border bg-incuria-surface">
          <div className="flex items-center justify-between gap-3 border-b border-incuria-border px-5 py-3">
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-incuria-accent" strokeWidth={1.75} />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-incuria-ink-muted">
                Per-course training
              </h2>
            </div>
            <Link
              to={ROUTES.COURSES}
              className="text-sm font-medium text-incuria-accent hover:underline"
            >
              Full courses
            </Link>
          </div>
          <div className="px-5 py-4">
            {loading ? (
              <p className="text-sm text-incuria-ink-muted">Loading courses…</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-incuria-ink-muted">
                No courses yet.{" "}
                <Link to={ROUTES.COURSES} className="font-medium text-incuria-accent hover:underline">
                  Add your first course
                </Link>
              </p>
            ) : (
              <ul className="space-y-2">
                {courses.map((c) => (
                  <SettingsCourseRow key={c.id} course={c} onMessage={setMsg} />
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-incuria-border bg-incuria-surface">
          <div className="flex items-center gap-3 border-b border-incuria-border px-5 py-3">
            <User className="h-4 w-4 text-incuria-accent" strokeWidth={1.75} />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-incuria-ink-muted">
              Account
            </h2>
          </div>
          <Link
            to={ROUTES.PROFILE}
            className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-incuria-ink transition-colors hover:bg-incuria-ink/[0.04]"
          >
            View profile &amp; subscription
          </Link>
        </section>
      </div>
      </SmoothScrollPane>
    </PageCanvas>
  );
}
