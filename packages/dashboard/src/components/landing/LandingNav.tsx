import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Github } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, session } from "../../lib/api";
import { GitVentureMark, GitVentureWordmark } from "../brand/GitVentureMark";

const navItems = [
  { label: "The gap", id: "gap" },
  { label: "How it works", id: "loop" },
  { label: "Scoring", id: "scoring" },
  { label: "Demo", id: "demo" },
] as const;

export default function LandingNav() {
  const signedIn = Boolean(session.get());
  const { scrollY } = useScroll();
  const [pastHero, setPastHero] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useMotionValueEvent(scrollY, "change", (v) => {
    const heroH = typeof window !== "undefined" ? window.innerHeight * 0.85 : 700;
    setPastHero(v > heroH);

    const delta = v - lastY.current;
    lastY.current = v;
    if (Math.abs(delta) < 8) return;
    if (v > heroH + 80 && delta > 0) setHidden(true);
    if (delta < 0) setHidden(false);
  });

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-5 py-4 sm:px-8">
      <motion.div
        className="pointer-events-auto absolute left-5 top-4 sm:left-8"
        initial={false}
        animate={
          pastHero
            ? { opacity: 1, y: 0, pointerEvents: "auto" as const }
            : { opacity: 0, y: -8, pointerEvents: "none" as const }
        }
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Link
          to="/"
          aria-label="GitVenture home"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <GitVentureWordmark />
        </Link>
      </motion.div>

      {/* On the hero: mark only (no wordmark), low opacity so brand lives in the hero */}
      <motion.button
        type="button"
        aria-label="Back to top"
        className="pointer-events-auto absolute left-5 top-4 sm:left-8"
        initial={false}
        animate={
          pastHero
            ? { opacity: 0, pointerEvents: "none" as const }
            : { opacity: 0.55, pointerEvents: "auto" as const }
        }
        transition={{ duration: 0.3 }}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <GitVentureMark size={28} />
      </motion.button>

      <motion.nav
        className="pointer-events-auto absolute left-1/2 top-3.5 hidden h-[52px] -translate-x-1/2 items-center rounded-full px-7 lg:flex"
        style={{
          backgroundColor: pastHero ? "rgba(14,18,26,0.92)" : "rgba(10,12,16,0.35)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: pastHero ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.08)",
          boxShadow: pastHero ? "0 12px 40px -16px rgba(0,0,0,0.55)" : "none",
          transition: "background-color 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
        }}
        animate={
          hidden
            ? { opacity: 0, y: -20, pointerEvents: "none" }
            : { opacity: pastHero ? 1 : 0.92, y: 0, pointerEvents: "auto" }
        }
        transition={{ duration: 0.45, ease: "easeOut" }}
        aria-label="Landing"
      >
        <ul className="flex items-center gap-7">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => scrollTo(item.id)}
                className="font-body text-sm font-medium text-fog transition-colors duration-300 hover:text-snow"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </motion.nav>

      <div className="pointer-events-auto absolute right-5 top-4 sm:right-8">
        {signedIn ? (
          <Link
            to="/auth/continue"
            className="gv-btn-primary group px-5 py-2.5 font-body text-sm"
          >
            Open dashboard
            <ArrowGlyph />
          </Link>
        ) : (
          <a
            href={`${API_BASE}/auth/github`}
            className="gv-btn-primary group px-5 py-2.5 font-body text-sm"
          >
            <Github size={15} strokeWidth={2.25} className="text-void" />
            Sign in with GitHub
            <ArrowGlyph />
          </a>
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
