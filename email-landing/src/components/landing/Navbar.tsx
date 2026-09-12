import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ConnectOutlookButton } from "../ConnectOutlookButton";
import { IncuriaLogo } from "../brand/IncuriaLogo";
import { isAuthenticated } from "../../lib/auth";
import { ROUTES } from "../../lib/routes";
import { LANDING_SECTION, scrollToLandingSection } from "../../lib/landingScroll";
import { LandingNavButton } from "./LandingNavButton";

const navItems = [
  { label: "Home", sectionId: LANDING_SECTION.HERO },
  { label: "Features", sectionId: LANDING_SECTION.FEATURES },
  { label: "Pricing", sectionId: LANDING_SECTION.PRICING },
  { label: "FAQ", sectionId: LANDING_SECTION.FAQ },
] as const;

export default function Navbar() {
  const signedIn = isAuthenticated();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 60);

    const delta = v - lastY.current;
    lastY.current = v;

    if (Math.abs(delta) < 8) return;
    if (v > 160 && delta > 0) setHidden(true);
    if (delta < 0) setHidden(false);
  });

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-5 py-4 sm:px-10">
      <button
        type="button"
        onClick={() => scrollToLandingSection(LANDING_SECTION.HERO)}
        className="pointer-events-auto absolute left-5 top-4 sm:left-10"
        aria-label="Incuria home"
      >
        <IncuriaLogo markSize={30} />
      </button>

      <motion.nav
        className="pointer-events-auto absolute left-1/2 top-3.5 hidden h-[52px] -translate-x-1/2 items-center rounded-full px-7 lg:flex"
        style={{
          backgroundColor: scrolled ? "rgba(255,255,255,0.86)" : "rgba(250,249,246,0.55)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: scrolled ? "1px solid rgba(232,230,224,0.95)" : "1px solid rgba(255,255,255,0.4)",
          boxShadow: scrolled ? "0 8px 32px -12px rgba(20,20,27,0.12)" : "none",
          transition: "background-color 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
        }}
        animate={
          hidden
            ? { opacity: 0, y: -20, pointerEvents: "none" }
            : { opacity: 1, y: 0, pointerEvents: "auto" }
        }
        transition={{ duration: 0.45, ease: "easeOut" }}
        aria-label="Landing"
      >
        <ul className="flex items-center gap-7">
          {navItems.map((item) => (
            <li key={item.label}>
              <LandingNavButton label={item.label} sectionId={item.sectionId} />
            </li>
          ))}
        </ul>
      </motion.nav>

      <div className="pointer-events-auto absolute right-5 top-4 sm:right-10">
        {signedIn ? (
          <Link
            to={ROUTES.HOME}
            className="group inline-flex items-center gap-2 rounded-full bg-land-ink px-5 py-2.5 font-landing-body text-sm font-medium text-white transition-colors duration-300 hover:bg-land-accent"
          >
            Open inbox
            <ArrowGlyph />
          </Link>
        ) : (
          <ConnectOutlookButton className="group inline-flex items-center gap-2 rounded-full bg-land-ink px-5 py-2.5 font-landing-body text-sm font-medium text-white transition-colors duration-300 hover:bg-land-accent active:scale-[0.98]">
            Get started
            <ArrowGlyph />
          </ConnectOutlookButton>
        )}
      </div>
    </header>
  );
}

function ArrowGlyph() {
  return (
    <svg
      width="13"
      height="13"
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
  );
}
