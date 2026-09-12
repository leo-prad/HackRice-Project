import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { BRAND } from "../../brand/constants";
import { EASE, VIEWPORT } from "./colors";

type FAQItem = {
  question: string;
  answer: string;
};

function buildFaqs(): FAQItem[] {
  return [
    {
      question: `What is ${BRAND.name}?`,
      answer: BRAND.elevator,
    },
    {
      question: "Will it send email without me?",
      answer:
        "No. Every message stays a draft until you read it and press send. That is intentional.",
    },
    {
      question: "Which email accounts work?",
      answer:
        "University and work email accounts with secure sign-in. We never see your password.",
    },
    {
      question: "How does it know what to say?",
      answer:
        "You upload course materials and set teaching rules. Incuria retrieves from your sources and follows your instructions when drafting. You see the source behind every reply.",
    },
    {
      question: "Is my data safe?",
      answer:
        "Access tokens stay in your browser session. Traffic is encrypted. Your materials are used only to draft your replies, not shared or used for training. Revoke access anytime to disconnect instantly.",
    },
    {
      question: "What does it cost?",
      answer:
        "Free for one course. Pro and Premium for heavier teaching loads. See pricing on this page. No card required to start.",
    },
  ];
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs = buildFaqs();

  return (
    <section id="faq" className="scroll-mt-24 px-5 pb-12 pt-24 sm:px-10 md:pb-16">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mx-auto mb-12 max-w-[700px] text-center"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          viewport={VIEWPORT}
        >
          <p className="mb-4 font-landing-body text-[11px] font-medium uppercase tracking-[0.22em] text-land-ink-faint">
            FAQ
          </p>
          <h2 className="font-landing-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-tight tracking-[-0.02em] text-land-ink">
            Common questions
          </h2>
        </motion.div>

        <div className="mx-auto max-w-[860px] space-y-3">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={item.question}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.04, ease: EASE }}
                viewport={{ once: true, amount: 0.2 }}
                className="overflow-hidden rounded-[18px] border border-land-border bg-white shadow-land-card"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="group flex w-full items-center justify-between gap-6 px-6 py-5 text-left sm:px-7"
                >
                  <span className="font-landing-body text-[15px] font-medium text-land-ink transition-colors duration-200 group-hover:text-land-accent sm:text-[17px]">
                    {item.question}
                  </span>
                  <motion.span
                    initial={false}
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 26 }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-land-border bg-land-canvas text-land-ink-muted transition-colors duration-200 group-hover:border-land-accent/40 group-hover:text-land-accent"
                    aria-hidden
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: EASE }}
                    >
                      <p className="max-w-[680px] px-6 pb-6 font-landing-body text-[14.5px] leading-[1.75] text-land-ink-muted sm:px-7">
                        {item.answer}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
