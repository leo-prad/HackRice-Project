import { useCallback, useRef, useState } from "react";
import { ClipboardPaste, Upload } from "lucide-react";

export type PendingFile = { file: File; id: string };
export type PendingText = { text: string; id: string };

type Props = {
  courseName: string;
  onCourseNameChange: (v: string) => void;
  files: PendingFile[];
  pastedTexts: PendingText[];
  onFilesChange: (files: PendingFile[]) => void;
  onPastedTextsChange: (texts: PendingText[]) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function OnboardingStepSources({
  courseName,
  onCourseNameChange,
  files,
  pastedTexts,
  onFilesChange,
  onPastedTextsChange,
  onBack,
  onContinue,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const sourceCount = files.length + pastedTexts.length;
  const canContinue = courseName.trim().length > 0 && sourceCount > 0;

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const next = Array.from(list).map((file) => ({
        file,
        id: `${file.name}-${file.size}-${Date.now()}`,
      }));
      onFilesChange([...files, ...next]);
    },
    [files, onFilesChange],
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  function addPaste() {
    const text = pasteValue.trim();
    if (!text) return;
    onPastedTextsChange([...pastedTexts, { text, id: `paste-${Date.now()}` }]);
    setPasteValue("");
    setPasteOpen(false);
  }

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="font-landing-display text-[clamp(1.75rem,4.5vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-incuria-ink">
          Add your course materials
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-incuria-ink-muted">
          Syllabi, policies, and notes become the source of truth for every draft.
        </p>
      </header>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-incuria-ink-muted">
          Course name
        </span>
        <input
          value={courseName}
          onChange={(e) => onCourseNameChange(e.target.value)}
          placeholder="e.g. CS 3345 — Data Structures"
          className="w-full rounded-xl border border-incuria-border bg-incuria-surface px-4 py-3 text-sm text-incuria-ink placeholder:text-incuria-ink-muted/60 focus:border-incuria-accent/50 focus:outline-none focus:ring-2 focus:ring-incuria-accent/20"
        />
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragOver
            ? "border-incuria-accent bg-incuria-accent-soft/30"
            : "border-incuria-border bg-incuria-surface/50"
        }`}
      >
        <p className="font-landing-display text-lg font-semibold text-incuria-ink">Drop files here</p>
        <p className="mt-2 text-sm text-incuria-ink-muted">PDF, DOCX, TXT, MD, and more</p>

        {(files.length > 0 || pastedTexts.length > 0) && (
          <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left">
            {files.map(({ file, id }) => (
              <li
                key={id}
                className="flex items-center justify-between gap-2 rounded-lg bg-incuria-canvas px-3 py-2 text-sm"
              >
                <span className="truncate text-incuria-ink">{file.name}</span>
                <button
                  type="button"
                  onClick={() => onFilesChange(files.filter((f) => f.id !== id))}
                  className="shrink-0 text-xs text-incuria-ink-muted hover:text-incuria-ink"
                >
                  Remove
                </button>
              </li>
            ))}
            {pastedTexts.map(({ text, id }) => (
              <li
                key={id}
                className="flex items-center justify-between gap-2 rounded-lg bg-incuria-canvas px-3 py-2 text-sm"
              >
                <span className="truncate text-incuria-ink-muted">{text.slice(0, 48)}…</span>
                <button
                  type="button"
                  onClick={() => onPastedTextsChange(pastedTexts.filter((p) => p.id !== id))}
                  className="shrink-0 text-xs text-incuria-ink-muted hover:text-incuria-ink"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-incuria-border bg-incuria-surface px-4 py-2 text-sm font-medium text-incuria-ink transition-colors hover:border-incuria-accent/40 hover:bg-incuria-ink/[0.04]"
          >
            <Upload className="h-4 w-4" strokeWidth={1.75} />
            Upload files
          </button>
          <button
            type="button"
            onClick={() => setPasteOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-incuria-border bg-incuria-surface px-4 py-2 text-sm font-medium text-incuria-ink transition-colors hover:border-incuria-accent/40 hover:bg-incuria-ink/[0.04]"
          >
            <ClipboardPaste className="h-4 w-4" strokeWidth={1.75} />
            Paste text
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {pasteOpen ? (
        <div className="rounded-xl border border-incuria-border bg-incuria-surface p-4">
          <textarea
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            rows={4}
            placeholder="Paste syllabus text, policies, or lecture notes…"
            className="w-full resize-none rounded-lg border border-incuria-border bg-incuria-canvas px-3 py-2 text-sm text-incuria-ink placeholder:text-incuria-ink-muted/60 focus:border-incuria-accent/50 focus:outline-none"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPasteOpen(false)}
              className="rounded-lg px-3 py-1.5 text-sm text-incuria-ink-muted hover:text-incuria-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addPaste}
              className="rounded-lg bg-incuria-accent-soft px-3 py-1.5 text-sm font-medium text-incuria-accent"
            >
              Add
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-incuria-border px-6 py-3 text-sm font-medium text-incuria-ink-muted transition-colors hover:bg-incuria-ink/[0.04] hover:text-incuria-ink"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="rounded-full bg-incuria-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-incuria-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Train Incuria
        </button>
      </div>
    </div>
  );
}
