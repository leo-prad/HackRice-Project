import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BackToMailLink } from "../components/BackToMailLink";
import { PageCanvas } from "../components/ui/PageCanvas";
import { Eyebrow } from "../components/ui/Eyebrow";
import { AnimatedOverlay } from "../components/motion/AnimatedOverlay";
import { SmoothScrollPane } from "../components/motion/SmoothScrollPane";
import { motionPresets } from "../theme/motion";
import { useCourseSources } from "../hooks/useCourseSources";
import {
  createCourse,
  getCourse,
  listCourses,
  updateCourse,
} from "../lib/api";
import { getSubscriptionTier } from "../lib/subscription";
import type { Course, CourseDocument, SubscriptionTier } from "../types";

const LIMITS: Record<SubscriptionTier, number> = { free: 1, pro: 5, premium: 999 };

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [documentsByCourse, setDocumentsByCourse] = useState<Record<string, CourseDocument[]>>({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const tier = getSubscriptionTier();

  const refreshCourses = useCallback(async () => {
    setLoading(true);
    try {
      setCourses(await listCourses());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCourses();
  }, [refreshCourses]);

  async function loadDocuments(courseId: string) {
    const { course, documents } = await getCourse(courseId);
    setDocumentsByCourse((prev) => ({ ...prev, [courseId]: documents }));
    return course;
  }

  async function openCourse(course: Course) {
    setDetailCourse(course);
    setDetailLoading(true);
    try {
      const fresh = await loadDocuments(course.id);
      setDetailCourse(fresh);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to load course");
    } finally {
      setDetailLoading(false);
    }
  }

  async function onCreate(name: string, description: string) {
    if (courses.length >= LIMITS[tier]) {
      throw new Error(`Your ${tier} plan allows up to ${LIMITS[tier]} course(s).`);
    }
    const course = await createCourse(name, description);
    await refreshCourses();
    setDocumentsByCourse((prev) => ({ ...prev, [course.id]: [] }));
    setMsg(`Created ${course.name}`);
    setAddOpen(false);
    await openCourse(course);
  }

  return (
    <PageCanvas variant="workbench" gradient={false} className="scrollbar-mail">
      <SmoothScrollPane className="h-full">
      <div className="mx-auto flex min-h-full max-w-6xl flex-col px-6 py-8 sm:px-10">
        <BackToMailLink />

        <header className="mt-6 mb-8">
          <Eyebrow className="mb-2">Training</Eyebrow>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-landing-display text-3xl font-semibold tracking-[-0.02em] text-incuria-ink">
                Courses
              </h1>
              <p className="mt-2 text-sm text-incuria-ink-muted">
                {courses.length} / {LIMITS[tier]} courses · {tier} plan
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="rounded-full bg-incuria-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-incuria-accent/90 active:scale-[0.97]"
            >
              Add course
            </button>
          </div>
        </header>

        {error && !loading ? (
          <p className="mb-4 text-sm text-incuria-needs-reply">{error}</p>
        ) : null}
        {msg ? (
          <p className="mb-4 text-sm text-incuria-ink-muted" role="status">
            {msg}
          </p>
        ) : null}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
          <aside className="min-h-0 overflow-y-auto rounded-2xl border border-incuria-border bg-incuria-surface p-3 scrollbar-mail">
            {loading ? (
              <CourseListSkeleton />
            ) : courses.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-incuria-ink-muted">
                No courses yet. Add your first course to train Incuria.
              </p>
            ) : (
              <ul className="space-y-2">
                {courses.map((course) => {
                  const selected = detailCourse?.id === course.id;
                  const docCount = documentsByCourse[course.id]?.length;
                  return (
                    <li key={course.id}>
                      <button
                        type="button"
                        onClick={() => void openCourse(course)}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-colors active:scale-[0.99] ${
                          selected
                            ? "border-incuria-accent/30 bg-incuria-accent-soft"
                            : "border-incuria-border bg-incuria-canvas hover:border-incuria-accent/20 hover:bg-incuria-select"
                        }`}
                      >
                        <p className="truncate text-sm font-semibold text-incuria-ink">{course.name}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-incuria-ink-muted">
                            {docCount != null ? `${docCount} source${docCount === 1 ? "" : "s"}` : "…"}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              course.trainedAt
                                ? "bg-emerald-500/15 text-emerald-600"
                                : "bg-incuria-ink/[0.06] text-incuria-ink-muted"
                            }`}
                          >
                            {course.trainedAt ? "Trained" : "Not trained"}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <div className="min-h-[420px] overflow-hidden rounded-2xl border border-incuria-border bg-incuria-surface">
              {detailCourse ? (
                <motion.div
                  key={detailCourse.id}
                  initial={motionPresets.paneSlide.initial}
                  animate={motionPresets.paneSlide.animate}
                  transition={motionPresets.paneSlide.transition}
                  className="h-full"
                >
                <CourseDetailPane
                  course={detailCourse}
                  documents={documentsByCourse[detailCourse.id] ?? []}
                  loading={detailLoading}
                  onSaved={async (updated) => {
                    setDetailCourse(updated);
                    await refreshCourses();
                    setMsg("Course saved");
                  }}
                  onUpdated={async () => {
                    const fresh = await loadDocuments(detailCourse.id);
                    setDetailCourse(fresh);
                    await refreshCourses();
                  }}
                  onMessage={setMsg}
                />
                </motion.div>
              ) : (
                <div className="flex h-full min-h-[420px] flex-col items-center justify-center px-8 text-center">
                  <p className="font-landing-display text-lg font-semibold text-incuria-ink">Select a course</p>
                  <p className="mt-2 max-w-sm text-sm text-incuria-ink-muted">
                    Upload syllabi and policies, then train so drafts cite your materials.
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
      </SmoothScrollPane>

      <AddCourseModal open={addOpen} onClose={() => setAddOpen(false)} onCreate={onCreate} />
    </PageCanvas>
  );
}

function CourseListSkeleton() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="h-16 animate-pulse rounded-xl bg-incuria-ink/[0.06]" />
      ))}
    </ul>
  );
}

function AddCourseModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onCreate(name.trim(), description.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create course");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatedOverlay open={open} onClose={onClose} panelClassName="max-w-lg">
      <div className="max-h-[92vh] overflow-y-auto p-6 scrollbar-mail">
      <h2 className="text-center text-xl font-semibold text-incuria-ink">Add Course</h2>
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
        <Field label="Course name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Course Name"
            required
            autoFocus
            className={`${inputClass} text-center`}
          />
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={4}
            className={`${inputClass} text-center`}
          />
        </Field>
        {error ? <p className="text-center text-sm text-incuria-ink-muted">{error}</p> : null}
        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="glass-card rounded-lg px-4 py-2 text-sm text-incuria-ink-muted hover:text-incuria-ink hover:bg-incuria-ink/[0.04] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="glass-card rounded-lg px-4 py-2 text-sm font-medium text-incuria-ink disabled:opacity-40 hover:bg-incuria-ink/[0.04] hover:border-incuria-accent/30 transition-all"
          >
            {saving ? "Adding…" : "Add Course +"}
          </button>
        </div>
      </form>
      </div>
    </AnimatedOverlay>
  );
}

function CourseDetailPane({
  course,
  documents,
  loading,
  onSaved,
  onUpdated,
  onMessage,
}: {
  course: Course;
  documents: CourseDocument[];
  loading: boolean;
  onSaved: (course: Course) => Promise<void>;
  onUpdated: () => Promise<void>;
  onMessage: (m: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const sources = useCourseSources(course.id);
  const [name, setName] = useState(course.name);
  const [description, setDescription] = useState(course.description ?? "");
  const [kind, setKind] = useState<"syllabus" | "lecture" | "note">("syllabus");
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const docs = sources.documents.length > 0 ? sources.documents : documents;
  const busy = sources.busy;

  useEffect(() => {
    setName(course.name);
    setDescription(course.description ?? "");
  }, [course.id, course.name, course.description]);

  const dirty =
    name.trim() !== course.name.trim() ||
    description.trim() !== (course.description ?? "").trim();

  async function saveDetails() {
    if (!name.trim()) {
      setSaveError("Course name is required.");
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      const updated = await updateCourse(course.id, {
        name: name.trim(),
        description: description.trim(),
      });
      await onSaved(updated);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save course");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    void sources.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when course changes
  }, [course.id]);

  async function uploadFile(file: File) {
    await sources.uploadFile(file, kind);
    onMessage(`Uploaded ${file.name}`);
    await onUpdated();
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    await sources.uploadText(noteText.trim());
    setNoteText("");
    onMessage("Note added");
    await onUpdated();
  }

  async function removeDoc(docId: string) {
    if (!confirm("Remove this document?")) return;
    await sources.removeDocument(docId);
    onMessage("Document removed");
    await onUpdated();
  }

  async function onTrain() {
    const result = await sources.train();
    if (result) {
      onMessage(`Indexed ${result.result.chunksIndexed} chunks for RAG`);
      await onUpdated();
    } else if (sources.error) {
      onMessage(sources.error);
    }
  }

  return (
    <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-6 scrollbar-mail">
      <h2 className="font-landing-display text-xl font-semibold text-incuria-ink">{course.name}</h2>
      <p className="mt-1 text-sm text-incuria-ink-muted">Sources and training for this course</p>

      <div className="mt-6 space-y-6">
        <section className="space-y-4">
          <Field label="Course name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Course name"
              className={inputClass}
            />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Teaching rules or course description"
              rows={3}
              className={inputClass}
            />
          </Field>
          {saveError ? <p className="text-sm text-incuria-needs-reply">{saveError}</p> : null}
          <button
            type="button"
            onClick={() => void saveDetails()}
            disabled={saving || !dirty || !name.trim()}
            className="rounded-full border border-incuria-border px-4 py-2 text-sm font-medium text-incuria-ink transition-colors hover:bg-incuria-ink/[0.04] disabled:opacity-40 active:scale-[0.97]"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-incuria-ink-muted">
            Sources
          </h3>
          {loading && docs.length === 0 ? (
            <p className="mt-3 text-sm text-incuria-ink-muted">Loading documents…</p>
          ) : docs.length === 0 ? (
            <p className="mt-3 text-sm text-incuria-ink-muted">
              No documents yet. Upload files below to train Incuria.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {docs.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-incuria-border bg-incuria-canvas px-3 py-2"
                >
                  <span className="truncate text-sm text-incuria-ink">{doc.filename}</span>
                  <button
                    type="button"
                    onClick={() => void removeDoc(doc.id)}
                    disabled={busy}
                    className="shrink-0 text-xs text-incuria-ink-muted hover:text-incuria-needs-reply disabled:opacity-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-incuria-border bg-incuria-canvas p-4">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
              className="rounded-lg border border-incuria-border bg-incuria-surface px-2 py-1.5 text-sm text-incuria-ink"
            >
              <option value="syllabus">Syllabus</option>
              <option value="lecture">Lecture</option>
              <option value="note">Note</option>
            </select>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="rounded-full bg-incuria-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-incuria-accent/90 disabled:opacity-50 active:scale-[0.97]"
            >
              Upload file
            </button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadFile(file);
                e.target.value = "";
              }}
            />
          </div>

          <form onSubmit={(e) => void addNote(e)} className="mt-4">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              placeholder="Paste syllabus text or policies…"
              className={`${inputClass} mt-1`}
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={busy || !noteText.trim()}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-incuria-accent hover:bg-incuria-accent-soft disabled:opacity-50"
              >
                Add note
              </button>
            </div>
          </form>
        </section>

        {sources.stepLabel ? (
          <p className="flex items-center gap-2 text-sm text-incuria-ink-muted" role="status">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-incuria-accent/25 border-t-incuria-accent" />
            {sources.stepLabel}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void onTrain()}
          disabled={busy || docs.length === 0 || loading}
          className="w-full rounded-full bg-incuria-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-incuria-accent disabled:opacity-40 active:scale-[0.97]"
        >
          {sources.step === "training" ? "Training…" : "Train on documents"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-center text-xs font-medium uppercase tracking-wider text-incuria-ink-muted">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  "glass-input w-full rounded-lg px-3 py-2 text-sm text-incuria-ink placeholder:text-incuria-ink-muted/70 focus:border-incuria-accent focus:outline-none focus:ring-1 focus:ring-incuria-accent/30";
