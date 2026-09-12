import { Sparkles } from "lucide-react";
import { useLineReveal } from "../../hooks/useLineReveal";

type Props = {
  body: string;
  generating: boolean;
  status?: string;
  sourceLabel?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  fromAddress?: string;
  onUpdateDraft: (updates: Partial<{ body: string; to: string; cc: string; bcc: string }>) => void;
  onSend: () => void;
  onRegenerate: () => void;
  onEditInComposer?: () => void;
};

function bodyLines(body: string): string[] {
  return body
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function DraftReplyCard({
  body,
  generating,
  status,
  sourceLabel,
  to,
  cc,
  bcc,
  fromAddress,
  onUpdateDraft,
  onSend,
  onRegenerate,
  onEditInComposer,
}: Props) {
  const lines = bodyLines(body);
  const revealActive = !generating && lines.length > 0;
  const visible = useLineReveal(lines, revealActive, body);

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-incuria-accent/25 bg-gradient-to-b from-incuria-accent-soft/70 to-incuria-accent-soft/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-incuria-accent" strokeWidth={1.75} />
          <span className="text-xs font-semibold text-incuria-accent">
            {generating ? "Drafting…" : "Draft ready"} · From your materials and rules
          </span>
        </div>
        {status ? <span className="text-[11px] text-incuria-ink-muted">{status}</span> : null}
      </div>

      {(["to", "cc", "bcc"] as const).map((field) => (
        <div key={field} className="mt-3 flex items-center gap-2 border-b border-incuria-accent/15 pb-1">
          <span className="w-8 text-[11px] font-medium capitalize text-incuria-ink-muted">{field}</span>
          <input
            type="text"
            value={field === "to" ? (to || fromAddress || "") : (field === "cc" ? cc : bcc) || ""}
            onChange={(e) => onUpdateDraft({ [field]: e.target.value })}
            placeholder={field === "to" ? "" : `Add ${field.toUpperCase()}…`}
            className="w-full bg-transparent text-[13px] text-incuria-ink outline-none placeholder:text-incuria-ink-muted/70"
          />
        </div>
      ))}

      {generating ? (
        <div className="mt-4 flex items-center gap-2 py-6 text-sm text-incuria-ink-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-incuria-accent/25 border-t-incuria-accent" />
          Generating draft…
        </div>
      ) : lines.length > 0 ? (
        <div className="mt-3 space-y-1.5">
          {lines.map((line, i) => (
            <p
              key={`${i}-${line.slice(0, 24)}`}
              className={`text-[13px] leading-relaxed text-incuria-ink transition-opacity duration-200 ${
                i < visible ? "opacity-100" : "opacity-0"
              }`}
            >
              {line}
              {i === visible - 1 && visible < lines.length ? (
                <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-incuria-accent align-middle" />
              ) : null}
            </p>
          ))}
        </div>
      ) : (
        <textarea
          value={body}
          onChange={(e) => onUpdateDraft({ body: e.target.value })}
          rows={6}
          placeholder="Draft will appear here…"
          className="mt-3 min-h-[120px] w-full resize-none rounded-lg border border-incuria-accent/15 bg-white/70 px-3 py-2.5 text-[13px] leading-relaxed text-incuria-ink focus:border-incuria-accent/40 focus:outline-none focus:ring-2 focus:ring-incuria-accent/15"
        />
      )}

      {sourceLabel ? (
        <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-incuria-accent/15 bg-white/60 px-2.5 py-1.5">
          <Sparkles className="h-3 w-3 text-incuria-accent" strokeWidth={1.75} />
          <span className="text-[10px] text-incuria-accent">{sourceLabel}</span>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onSend}
          disabled={generating || !body.trim()}
          className="rounded-full bg-incuria-accent px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-incuria-accent/90 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]"
        >
          Approve &amp; send
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={generating}
          className="rounded-full border border-incuria-border bg-white/80 px-4 py-1.5 text-[12px] font-medium text-incuria-ink transition-colors hover:bg-incuria-ink/[0.04] disabled:opacity-50 active:scale-[0.97]"
        >
          Regenerate
        </button>
        {onEditInComposer ? (
          <button
            type="button"
            onClick={onEditInComposer}
            className="rounded-full border border-incuria-border bg-white/80 px-4 py-1.5 text-[12px] font-medium text-incuria-ink-muted transition-colors hover:text-incuria-ink active:scale-[0.97]"
          >
            Edit in composer
          </button>
        ) : null}
      </div>
    </div>
  );
}
