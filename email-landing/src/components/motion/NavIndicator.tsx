import { motion } from "framer-motion";
import { motionEase } from "../../theme/incuria";

/**
 * Shared sliding highlight for sidebar nav items. Render inside the active item
 * with a common `layoutId` so framer-motion animates it between selections.
 */
export function NavIndicator({ layoutId = "sidebar-active" }: { layoutId?: string }) {
  return (
    <motion.span
      layoutId={layoutId}
      className="absolute inset-0 -z-10 rounded-r-full bg-incuria-accent-soft"
      transition={{ type: "spring", stiffness: 450, damping: 38, ease: motionEase }}
    />
  );
}
