import { motion } from "framer-motion";
import { ACCENT } from "./colors";
import SectionHeader from "./SectionHeader";
import { cardReveal } from "./scrollMotion";

const benefits = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 19V6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5V19" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 19h16M9 5v14M7.2 9h-1M7.2 12h-1" stroke={ACCENT} strokeWidth="1.3" strokeLinecap="round" opacity="0.65" />
      </svg>
    ),
    title: "Built for professors",
    body: "Your materials, your rules, your inbox. Not a generic support bot.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke={ACCENT} strokeWidth="1.5" />
        <path d="M12 7v5l3.5 2.5" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Less time in the inbox",
    body: "Triage in minutes. Most faculty clear a week of student mail in one sitting.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 3.5 19 6v5.2c0 4.3-2.9 7.3-7 8.6-4.1-1.3-7-4.3-7-8.6V6z" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="m8.8 11.6 2.2 2.2 4.2-4.6" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Nothing sends itself",
    body: "Every reply waits for your approval. Auto-send is not part of the product.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h3l2 2.5h6A2.5 2.5 0 0 1 20 11v5.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 14.5h6" stroke={ACCENT} strokeWidth="1.4" strokeLinecap="round" opacity="0.65" />
      </svg>
    ),
    title: "Your knowledge, applied",
    body: "Stop retyping what you already taught the AI. Draft from it all semester.",
  },
];

export default function WhyChoose() {
  return (
    <section className="px-5 py-16 sm:px-10">
      <div className="mx-auto max-w-6xl border-t border-land-border pb-4 pt-16">
        <SectionHeader
          eyebrow="Principles"
          title="Why faculty use Incuria"
          subtitle="Less time on email. More time on teaching."
        />

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              className="rounded-[20px] border border-land-border bg-white p-7 shadow-land-card transition-shadow duration-300 hover:shadow-land-card-hover"
              variants={cardReveal}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 24 } }}
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-land-accent-soft">
                {b.icon}
              </span>
              <h3 className="mt-5 font-landing-body text-[15px] font-semibold leading-snug text-land-ink">
                {b.title}
              </h3>
              <p className="mt-2 font-landing-body text-sm leading-relaxed text-land-ink-muted">{b.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
