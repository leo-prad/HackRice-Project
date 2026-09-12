import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ConnectOutlookButton } from "../ConnectOutlookButton";
import { BRAND } from "../../brand/constants";
import { EASE } from "./colors";
import { WorkbenchMockup } from "./WorkbenchMockup";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const headlineY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -110]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55, 0.9], [1, 1, reduceMotion ? 1 : 0]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 90]);
  const cardScale = useTransform(scrollYProgress, [0, 0.65], [1, reduceMotion ? 1 : 0.92]);
  const cardRotateX = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 6]);

  const rise = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 32, filter: "blur(10px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { duration: 0.9, delay, ease: EASE },
        };

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex min-h-[92vh] scroll-mt-24 flex-col items-center overflow-hidden px-5 pb-20 pt-32 sm:px-10"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: [
            "radial-gradient(ellipse 56% 44% at 50% -4%, rgba(79,70,229,0.10) 0%, transparent 70%)",
            "radial-gradient(ellipse 40% 34% at 12% 28%, rgba(91,84,240,0.06) 0%, transparent 70%)",
            "radial-gradient(ellipse 42% 36% at 88% 22%, rgba(55,48,163,0.05) 0%, transparent 70%)",
          ].join(", "),
        }}
      />

      <motion.div className="relative flex flex-col items-center" style={{ opacity: contentOpacity }}>
        <motion.h1
          className="max-w-[1000px] text-center font-landing-display text-[clamp(2.5rem,6.5vw,5.25rem)] font-semibold leading-[1.06] tracking-[-0.025em] text-land-ink"
          style={{ y: headlineY }}
          {...rise(0.05)}
        >
          {BRAND.headline}
        </motion.h1>

        <motion.p
          className="mt-6 max-w-[600px] text-center font-landing-body text-lg leading-[1.7] text-land-ink-muted"
          {...rise(0.14)}
        >
          {BRAND.oneLiner}
        </motion.p>

        <motion.div className="mt-9 flex flex-col items-center gap-3" {...rise(0.22)}>
          <ConnectOutlookButton className="group inline-flex min-h-[50px] items-center gap-2 rounded-full bg-land-ink px-8 font-landing-body text-[15px] font-medium text-white transition-colors duration-300 hover:bg-land-accent active:scale-[0.98]">
            Get started
            <ConnectArrow />
          </ConnectOutlookButton>
          <p className="font-landing-body text-sm text-land-ink-faint">
            AI-native for professors
          </p>
        </motion.div>
      </motion.div>

      <motion.div
        className="relative mt-12 w-full [perspective:1200px]"
        style={{ y: cardY, scale: cardScale, rotateX: cardRotateX }}
        {...rise(0.34)}
      >
        <div className="mx-auto w-full max-w-[1140px] overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <WorkbenchMockup className="min-w-[880px]" />
        </div>
      </motion.div>
    </section>
  );
}

function ConnectArrow() {
  return (
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
  );
}
