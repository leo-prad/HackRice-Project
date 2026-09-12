import { type ReactNode, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { motionPresets } from "../../theme/motion";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Panel max width class, e.g. max-w-lg */
  panelClassName?: string;
  /** Align panel — default center */
  align?: "center" | "bottom";
  labelledBy?: string;
};

/**
 * Cinematic modal shell — backdrop blur + blur-rise panel (landing parity).
 */
export function AnimatedOverlay({
  open,
  onClose,
  children,
  panelClassName = "max-w-lg",
  align = "center",
  labelledBy,
}: Props) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const alignClass =
    align === "bottom"
      ? "items-end justify-center pb-4 sm:items-center sm:pb-0"
      : "items-center justify-center";

  const content = (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={`fixed inset-0 z-50 flex p-4 ${alignClass}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          initial={motionPresets.overlay.initial}
          animate={motionPresets.overlay.animate}
          exit={motionPresets.overlay.exit}
          transition={motionPresets.overlay.transition}
        >
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-incuria-ink/40 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className={`relative z-10 w-full overflow-hidden rounded-2xl border border-incuria-border bg-incuria-surface shadow-incuria-pop ${panelClassName}`}
            onClick={(e) => e.stopPropagation()}
            initial={reduceMotion ? { opacity: 0 } : motionPresets.modal.initial}
            animate={reduceMotion ? { opacity: 1 } : motionPresets.modal.animate}
            exit={reduceMotion ? { opacity: 0 } : motionPresets.modal.exit}
            transition={motionPresets.modal.transition}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
