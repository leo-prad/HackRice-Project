import { motion, useReducedMotion } from "framer-motion";

/** Full-bleed commit-trail map — GitVenture's signature visual. */
export default function TrailMap({ className = "" }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 70% 55% at 72% 42%, rgba(255,107,53,0.14) 0%, transparent 62%)",
            "radial-gradient(ellipse 45% 40% at 18% 70%, rgba(61,255,168,0.06) 0%, transparent 65%)",
            "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(255,107,53,0.08) 0%, transparent 70%)",
          ].join(", "),
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full opacity-[0.55]"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {/* Main expedition spine */}
        <motion.path
          d="M80 640 C 220 620, 280 520, 360 460 C 440 400, 480 360, 560 300 C 640 240, 700 200, 820 160 C 900 132, 980 110, 1120 90"
          stroke="url(#trailGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />

        {/* Branch A — frontend fork */}
        <motion.path
          d="M360 460 C 420 440, 460 380, 520 320 C 560 280, 600 250, 680 220"
          stroke="url(#trailGradSoft)"
          strokeWidth="1.75"
          strokeLinecap="round"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
        />

        {/* Branch B — systems fork */}
        <motion.path
          d="M560 300 C 600 340, 640 400, 700 460 C 760 520, 820 560, 920 600"
          stroke="url(#trailGradSoft)"
          strokeWidth="1.75"
          strokeLinecap="round"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.9, ease: [0.22, 1, 0.36, 1], delay: 0.9 }}
        />

        {/* Ghost topo lines */}
        {[180, 280, 380, 480, 580].map((y, i) => (
          <path
            key={y}
            d={`M40 ${y} Q 300 ${y - 20 + i * 4}, 600 ${y} T 1160 ${y + 10}`}
            stroke="rgba(232,237,242,0.04)"
            strokeWidth="1"
          />
        ))}

        {/* Waypoint nodes */}
        {[
          { cx: 360, cy: 460, r: 7, delay: 1.0, label: true },
          { cx: 560, cy: 300, r: 6, delay: 1.25 },
          { cx: 680, cy: 220, r: 5, delay: 1.4 },
          { cx: 820, cy: 160, r: 8, delay: 1.55, pulse: true },
          { cx: 920, cy: 600, r: 5, delay: 1.7 },
        ].map((node) => (
          <g key={`${node.cx}-${node.cy}`}>
            {node.pulse && !reduceMotion && (
              <motion.circle
                cx={node.cx}
                cy={node.cy}
                r={node.r}
                fill="rgba(255,107,53,0.35)"
                animate={{ r: [node.r, node.r + 14], opacity: [0.45, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <motion.circle
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill="#FF6B35"
              initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.45, delay: node.delay, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
            />
            <circle cx={node.cx} cy={node.cy} r={2.2} fill="#0A0C10" />
          </g>
        ))}

        <defs>
          <linearGradient id="trailGrad" x1="80" y1="640" x2="1120" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF6B35" stopOpacity="0.15" />
            <stop offset="0.45" stopColor="#FF6B35" stopOpacity="0.85" />
            <stop offset="1" stopColor="#3DFFA8" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="trailGradSoft" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#FF6B35" stopOpacity="0.55" />
            <stop offset="1" stopColor="#FF6B35" stopOpacity="0.15" />
          </linearGradient>
        </defs>
      </svg>

      {/* Soft grain */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
