import { motion } from "framer-motion";
import type { PriorityTag } from "./utils";
import { AnimatedExpand } from "../motion/AnimatedExpand";
import { motionPresets } from "../../theme/motion";

export type InboxFilterId = "unread" | "flagged" | "attachments" | PriorityTag;

type FilterDef = { id: InboxFilterId; label: string };

const FILTERS: FilterDef[] = [
  { id: "unread", label: "Unread" },
  { id: "flagged", label: "Flagged" },
  { id: "attachments", label: "Attachments" },
  { id: "Urgent", label: "Urgent" },
  { id: "Student", label: "Student" },
  { id: "Admin", label: "Admin" },
  { id: "Meeting", label: "Meeting" },
];

type Props = {
  active: Set<InboxFilterId>;
  onToggle: (id: InboxFilterId) => void;
  onClear: () => void;
  expanded: boolean;
};

export function MailInboxFilters({ active, onToggle, onClear, expanded }: Props) {
  return (
    <AnimatedExpand open={expanded}>
      <div className="flex flex-wrap items-center gap-1.5 border-b border-incuria-border bg-incuria-surface px-3.5 py-2">
        {FILTERS.map((f, i) => {
          const on = active.has(f.id);
          return (
            <motion.button
              key={f.id}
              type="button"
              onClick={() => onToggle(f.id)}
              initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ ...motionPresets.popover.transition, delay: i * 0.03 }}
              whileTap={motionPresets.tap}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                on
                  ? "bg-incuria-accent text-white"
                  : "border border-incuria-border bg-incuria-canvas text-incuria-ink-muted hover:border-incuria-accent/40 hover:text-incuria-accent"
              }`}
            >
              {f.label}
            </motion.button>
          );
        })}
        {active.size > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="ml-1 text-[11px] font-medium text-incuria-ink-muted transition-colors hover:text-incuria-ink"
          >
            Clear
          </button>
        ) : null}
      </div>
    </AnimatedExpand>
  );
}

export function isInboxFilterId(value: string): value is InboxFilterId {
  return FILTERS.some((f) => f.id === value);
}
