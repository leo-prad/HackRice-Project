import { type ReactNode, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { motionPresets } from "../../theme/motion";

type Props = {
  label: ReactNode;
  children: ReactNode;
  /** Trigger button className */
  triggerClassName?: string;
  align?: "left" | "right";
};

/** Click-triggered popover with blur-rise entrance (replaces hover-only menus). */
export function AnimatedPopover({
  label,
  children,
  triggerClassName = "",
  align = "left",
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-block">
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileTap={reduceMotion ? undefined : motionPresets.tap}
        className={
          triggerClassName ||
          "inline-flex items-center gap-1 rounded border border-dashed border-incuria-border px-2 py-0.5 text-[11px] font-medium text-incuria-ink-muted transition-colors hover:border-incuria-accent hover:text-incuria-accent"
        }
        aria-expanded={open}
      >
        {label}
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className={`absolute top-full z-50 mt-1 min-w-[140px] origin-top rounded-lg border border-incuria-border bg-white p-1 shadow-incuria-pop ${
              align === "right" ? "right-0" : "left-0"
            }`}
            initial={reduceMotion ? { opacity: 0 } : motionPresets.popover.initial}
            animate={reduceMotion ? { opacity: 1 } : motionPresets.popover.animate}
            exit={reduceMotion ? { opacity: 0 } : motionPresets.popover.exit}
            transition={motionPresets.popover.transition}
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
