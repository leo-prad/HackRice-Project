import { motion } from "framer-motion";
import { ConnectOutlookButton } from "../ConnectOutlookButton";
import { IncuriaMark } from "../brand/IncuriaLogo";
import { BRAND } from "../../brand/constants";
import { LANDING_SECTION } from "../../lib/landingScroll";
import { LandingNavButton } from "./LandingNavButton";
import { EASE, VIEWPORT } from "./colors";

const pageLinks = [
  { label: "Home", sectionId: LANDING_SECTION.HERO },
  { label: "Features", sectionId: LANDING_SECTION.FEATURES },
  { label: "Pricing", sectionId: LANDING_SECTION.PRICING },
  { label: "FAQ", sectionId: LANDING_SECTION.FAQ },
] as const;

export default function Footer() {
  return (
    <footer className="overflow-hidden bg-land-surface px-5 pt-4 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="flex flex-col gap-6 border-t border-land-border py-10 md:flex-row md:items-center md:justify-between"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          viewport={VIEWPORT}
        >
          <p className="font-landing-display text-[clamp(1.6rem,3.2vw,2.5rem)] font-semibold leading-tight tracking-[-0.015em] text-land-ink">
            {BRAND.tagline}
          </p>
          <ConnectOutlookButton className="group inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-land-ink px-7 py-3.5 font-landing-body text-[15px] font-medium text-white transition-colors duration-300 hover:bg-land-accent active:scale-[0.98]">
            Get started
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="transition-transform duration-300 group-hover:-rotate-45"
              aria-hidden
            >
              <path
                d="M2.2 7h8.6M10.8 7 8 4.2M10.8 7 8 9.8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </ConnectOutlookButton>
        </motion.div>

        <div className="border-t border-land-border py-10 md:py-12">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <motion.div
              className="flex max-w-[300px] flex-col gap-3"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2.5">
                <IncuriaMark size={30} />
                <span className="font-landing-display text-2xl font-semibold tracking-tight text-land-ink">
                  {BRAND.name}
                </span>
              </span>
              <p className="font-landing-body text-sm leading-relaxed text-land-ink-muted">
                {BRAND.oneLiner}
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-2 gap-x-16 gap-y-8 font-landing-body text-sm text-land-ink-muted md:gap-x-24"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05, ease: EASE }}
              viewport={{ once: true }}
            >
              <div>
                <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-land-ink-faint">
                  Page
                </p>
                <ul className="space-y-2.5">
                  {pageLinks.map((link) => (
                    <li key={link.label}>
                      <LandingNavButton label={link.label} sectionId={link.sectionId} />
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-land-ink-faint">
                  Reach us
                </p>
                <ul className="space-y-2.5">
                  <li>
                    <a
                      href={`mailto:${BRAND.contactEmail}`}
                      className="transition-colors duration-200 hover:text-land-accent"
                    >
                      {BRAND.contactEmail}
                    </a>
                  </li>
                  <li>
                    <LandingNavButton label="Pricing" sectionId={LANDING_SECTION.PRICING} />
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="border-t border-land-border py-5">
          <p className="font-landing-body text-xs text-land-ink-faint">
            &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
        </div>

        <motion.div
          className="pointer-events-none select-none pt-4"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          viewport={{ once: true, amount: 0.3 }}
          aria-hidden
        >
          <div className="flex justify-center overflow-hidden">
            <span
              className="block whitespace-nowrap bg-clip-text text-center font-landing-display text-[clamp(5rem,22vw,17rem)] font-semibold leading-[0.74] tracking-[-0.06em] text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, rgba(20,20,27,0.95) 0%, rgba(79,70,229,0.85) 45%, rgba(160,155,240,0.5) 70%, rgba(238,237,252,0.2) 88%, rgba(255,255,255,0) 100%)",
              }}
            >
              {BRAND.name}
            </span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
