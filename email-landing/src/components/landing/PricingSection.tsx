import { motion } from "framer-motion";
import SectionHeader from "./SectionHeader";
import { cardReveal } from "./scrollMotion";
import { getSubscriptionTier, setSubscriptionTier } from "../../lib/subscription";
import type { SubscriptionTier } from "../../types";

const plans: {
  id: SubscriptionTier;
  name: string;
  price: string;
  courses: string;
  features: string[];
  highlight?: boolean;
}[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    courses: "1 course",
    features: ["Inbox workbench", "Course-grounded AI replies", "Course document uploads"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12/mo",
    courses: "5 courses",
    features: ["Everything in Free", "Inbox summarize", "Bulk reply workflows"],
    highlight: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$29/mo",
    courses: "Unlimited courses",
    features: ["Everything in Pro", "Priority support", "Team seats (coming)"],
  },
];

export default function PricingSection() {
  const current = getSubscriptionTier();

  return (
    <section id="pricing" className="scroll-mt-24 px-5 py-24 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Pricing"
          title="Plans"
          subtitle="Start free with one course. Upgrade when your teaching load grows."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              className={`flex flex-col rounded-[20px] border p-7 shadow-land-card transition-shadow duration-300 hover:shadow-land-card-hover ${
                plan.highlight
                  ? "border-land-accent/35 bg-white ring-1 ring-land-accent/15"
                  : "border-land-border bg-white"
              }`}
              variants={cardReveal}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {plan.highlight ? (
                <span className="mb-3 w-fit rounded-full bg-land-accent-soft px-3 py-1 font-landing-body text-[11px] font-semibold uppercase tracking-[0.14em] text-land-accent-deep">
                  Most popular
                </span>
              ) : (
                <span className="mb-3 block h-[26px]" aria-hidden />
              )}
              <h3 className="font-landing-display text-xl font-semibold text-land-ink">{plan.name}</h3>
              <p className="mt-2 font-landing-display text-3xl font-semibold tracking-tight text-land-accent">
                {plan.price}
              </p>
              <p className="mt-2 font-landing-body text-sm text-land-ink-muted">{plan.courses}</p>
              <ul className="mt-5 flex-1 space-y-2.5 font-landing-body text-sm text-land-ink-muted">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-land-accent" aria-hidden>
                      ·
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setSubscriptionTier(plan.id)}
                className={`mt-6 w-full rounded-full py-2.5 font-landing-body text-sm font-semibold transition-colors ${
                  current === plan.id
                    ? "bg-land-accent-soft text-land-accent-deep"
                    : "bg-land-ink text-white hover:bg-land-accent"
                }`}
              >
                {current === plan.id ? "Current plan" : "Select plan"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
