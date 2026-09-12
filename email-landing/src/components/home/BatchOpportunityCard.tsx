import { motion, useReducedMotion } from "framer-motion";
import { Layers, ArrowRight } from "lucide-react";
import type { EmailCluster } from "../mail/utils";
import { EASE } from "../../theme/brand";
import { BrandButton } from "../ui/BrandButton";
import { BrandCard } from "../ui/BrandCard";
import { brandClasses } from "../../theme/brand";
import { ROUTES } from "../../lib/routes";

export function BatchOpportunityCard({ cluster }: { cluster: EmailCluster }) {
  const reduceMotion = useReducedMotion();
  const count = cluster.emails.length;

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -1 }}
      transition={{ duration: 0.2, ease: EASE }}
    >
      <BrandCard className="flex items-center gap-4 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-land-accent-soft text-land-accent">
          <Layers className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-landing-body text-sm font-semibold text-land-ink">
            {cluster.label}
          </span>
          <span className="mt-1 inline-block font-landing-body text-xs leading-[1.75] text-land-ink-muted">
            Clear {count} similar message{count === 1 ? "" : "s"} in one pass
          </span>
          <span className={`mt-2 inline-block ${brandClasses.tag}`}>
            Batch · {count} similar
          </span>
        </span>
        <BrandButton variant="primary" to={ROUTES.BATCH_READY} className="shrink-0 gap-1 px-4 py-2 text-xs">
          Batch
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </BrandButton>
      </BrandCard>
    </motion.div>
  );
}
