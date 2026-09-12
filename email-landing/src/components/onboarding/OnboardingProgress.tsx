type Props = {
  step: 1 | 2 | 3;
  labels?: [string, string, string];
};

const DEFAULT_LABELS: [string, string, string] = ["Your voice", "Your materials", "See it work"];

export function OnboardingProgress({ step, labels = DEFAULT_LABELS }: Props) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = step > n;
        const current = step === n;
        return (
          <div key={label} className="flex items-center gap-2 sm:gap-3">
            {i > 0 ? (
              <span
                className={`hidden h-px w-6 sm:block sm:w-10 ${done || current ? "bg-incuria-accent/40" : "bg-incuria-border"}`}
                aria-hidden
              />
            ) : null}
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  done
                    ? "bg-incuria-accent text-white"
                    : current
                      ? "border-2 border-incuria-accent bg-incuria-accent-soft text-incuria-accent"
                      : "border border-incuria-border bg-incuria-surface text-incuria-ink-muted"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span
                className={`hidden text-[10px] font-medium sm:block ${
                  current ? "text-incuria-ink" : "text-incuria-ink-muted"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
