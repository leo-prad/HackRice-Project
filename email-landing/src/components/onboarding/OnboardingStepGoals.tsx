const PROMPTS = [
  "Use a formal, professional tone.",
  "Extensions require documentation per syllabus.",
  "Never promise grade changes in email.",
  "Office hours: refer to syllabus schedule.",
  "Keep replies concise — under 150 words when possible.",
];

type Props = {
  teachingRules: string;
  onTeachingRulesChange: (v: string) => void;
  onContinue: () => void;
};

export function OnboardingStepGoals({ teachingRules, onTeachingRulesChange, onContinue }: Props) {
  function appendPrompt(line: string) {
    const trimmed = teachingRules.trim();
    if (trimmed.includes(line)) return;
    onTeachingRulesChange(trimmed ? `${trimmed}\n${line}` : line);
  }

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="font-landing-display text-[clamp(1.75rem,4.5vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-incuria-ink">
          How should Incuria draft for you?
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-incuria-ink-muted">
          Set your teaching voice and boundaries. Every reply will follow these rules.
        </p>
      </header>

      <div className="flex flex-wrap justify-center gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => appendPrompt(p)}
            className="rounded-full border border-incuria-border bg-incuria-surface px-3 py-1.5 text-xs font-medium text-incuria-ink-muted transition-colors hover:border-incuria-accent/40 hover:bg-incuria-accent-soft hover:text-incuria-accent"
          >
            + {p.slice(0, 36)}{p.length > 36 ? "…" : ""}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-incuria-ink-muted">
          Your teaching rules
        </span>
        <textarea
          value={teachingRules}
          onChange={(e) => onTeachingRulesChange(e.target.value)}
          rows={6}
          placeholder="Formal tone. Extensions require documentation. Never promise grade changes."
          className="w-full resize-none rounded-xl border border-incuria-border bg-incuria-surface px-4 py-3 text-sm text-incuria-ink placeholder:text-incuria-ink-muted/60 focus:border-incuria-accent/50 focus:outline-none focus:ring-2 focus:ring-incuria-accent/20"
        />
      </label>

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="w-full max-w-sm rounded-full bg-incuria-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-incuria-accent/90"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
