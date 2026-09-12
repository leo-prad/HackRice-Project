import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mail } from "./theme";
import { motionPresets } from "../../theme/motion";

type Props = {
  open: boolean;
  onClose: () => void;
};

const GROUPS: { title: string; items: { keys: string[]; label: string }[] }[] = [
  {
    title: "Messages",
    items: [
      { keys: ["⌘", "N"], label: "New message" },
      { keys: ["⌘", "R"], label: "Reply with AI" },
      { keys: ["⇧", "⌘", "R"], label: "Reply all" },
      { keys: ["⇧", "⌘", "F"], label: "Forward" },
      { keys: ["⇧", "⌘", "L"], label: "Flag / unflag" },
      { keys: ["⌃", "⌘", "A"], label: "Archive" },
      { keys: ["⇧", "⌘", "J"], label: "Move to Junk" },
      { keys: ["⇧", "⌘", "U"], label: "Mark as read" },
      { keys: ["⇧", "⌘", "S"], label: "Summarize" },
      { keys: ["⌘", "⌫"], label: "Delete" },
    ],
  },
  {
    title: "Navigation",
    items: [
      { keys: ["↑"], label: "Previous message" },
      { keys: ["↓"], label: "Next message" },
      { keys: ["⌘", "K"], label: "Toggle search" },
      { keys: ["⌘", "1"], label: "Inbox" },
      { keys: ["⌘", "2"], label: "Sent" },
      { keys: ["⌘", "3"], label: "Drafts" },
    ],
  },
  {
    title: "Assistant",
    items: [
      { keys: ["⌘", "I"], label: "Toggle AI assistant" },
      { keys: ["?"], label: "Show this cheat-sheet" },
    ],
  },
];

export function ShortcutsOverlay({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          initial={motionPresets.overlay.initial}
          animate={motionPresets.overlay.animate}
          exit={motionPresets.overlay.exit}
          transition={motionPresets.overlay.transition}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-incuria-ink/40 backdrop-blur-md" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-incuria-border bg-incuria-surface shadow-incuria-pop"
            initial={motionPresets.modal.initial}
            animate={motionPresets.modal.animate}
            exit={motionPresets.modal.exit}
            transition={motionPresets.modal.transition}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-incuria-border px-6 py-4">
              <h2 className="font-display text-2xl font-semibold text-incuria-ink">Keyboard shortcuts</h2>
              <button
                type="button"
                onClick={onClose}
                className={`rounded-md px-2 py-1 text-sm font-medium ${mail.btnGhost}`}
              >
                Esc
              </button>
            </div>
            <div className="grid grid-cols-1 gap-x-10 gap-y-6 px-6 py-6 sm:grid-cols-3">
              {GROUPS.map((group) => (
                <section key={group.title}>
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-incuria-ink-muted">
                    {group.title}
                  </h3>
                  <ul className="space-y-2.5">
                    {group.items.map((item) => (
                      <li key={item.label} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-incuria-ink">{item.label}</span>
                        <span className="flex shrink-0 items-center gap-1">
                          {item.keys.map((k, i) => (
                            <kbd key={i} className={mail.kbd}>{k}</kbd>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
