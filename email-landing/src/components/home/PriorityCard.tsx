import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { Email } from "../../types";
import { formatListDate, truncatePreview } from "../mail/utils";
import { EASE, brandClasses } from "../../theme/brand";

type Props = {
  email: Email;
  rank: number;
  onSelect: (id: string) => void;
};

export function PriorityCard({ email, rank, onSelect }: Props) {
  const reduceMotion = useReducedMotion();
  const unread = email.isRead === false;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(email.id)}
      whileHover={reduceMotion ? undefined : { y: -1 }}
      transition={{ duration: 0.2, ease: EASE }}
      className="group relative flex w-full items-start gap-0 overflow-hidden rounded-2xl border border-land-border bg-land-surface p-4 text-left shadow-land-card transition-shadow hover:shadow-land-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-land-accent"
    >
      <span
        className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-land-accent opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />

      <span className="min-w-0 flex-1 pl-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-landing-body text-sm font-semibold text-land-ink">
              {email.from}
            </span>
            {unread ? (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-land-accent" aria-label="Unread" />
            ) : null}
          </span>
          <span className="shrink-0 font-landing-body text-xs tabular-nums text-land-ink-faint">
            {formatListDate(email.date)}
          </span>
        </div>

        <p className="mt-0.5 truncate font-landing-body text-sm text-land-ink">{email.subject}</p>
        <p className="mt-0.5 truncate font-landing-body text-xs leading-[1.75] text-land-ink-muted">
          {truncatePreview(email.preview || email.body || "", 96)}
        </p>

        <span className={`mt-2 inline-block ${brandClasses.tag}`}>Needs reply</span>
      </span>

      <span className="ml-3 flex shrink-0 items-center self-center text-land-accent opacity-0 transition-opacity group-hover:opacity-100">
        <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
        <span className="sr-only">Open message</span>
      </span>

      <span className="sr-only">Priority {rank}</span>
    </motion.button>
  );
}
