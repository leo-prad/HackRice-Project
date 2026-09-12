const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

export function modKey(): string {
  return isMac ? "⌘" : "Ctrl";
}

type Props = {
  keys: string[];
  className?: string;
};

/** Minimal shortcut chips for toolbar hover hints. */
export function ShortcutHint({ keys, className = "" }: Props) {
  const normalized = keys.map((k) => (k === "⌘" ? modKey() : k));
  return (
    <span
      className={`pointer-events-none absolute -bottom-7 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-0.5 whitespace-nowrap group-hover:flex group-focus-within:flex ${className}`}
      aria-hidden
    >
      {normalized.map((k) => (
        <kbd
          key={k}
          className="rounded border border-incuria-border bg-incuria-canvas px-1 py-px font-landing-body text-[9px] font-medium text-incuria-ink-muted shadow-sm"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}
