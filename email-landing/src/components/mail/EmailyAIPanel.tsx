import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { emailyChat, type EmailyChatMessage, type EmailyInboxContext } from "../../lib/api";
import { BRAND } from "../../brand/constants";
import { motionPresets } from "../../theme/motion";

const STARTERS = [
  "What should I reply to first?",
  "Summarize my inbox right now",
  "Which messages look urgent?",
  "Who emailed about grades or deadlines?",
];

type Props = {
  open: boolean;
  onClose: () => void;
  inboxContext: EmailyInboxContext;
};

export function EmailyAIPanel({ open, onClose, inboxContext }: Props) {
  const reduceMotion = useReducedMotion();
  const [messages, setMessages] = useState<EmailyChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 200);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    setInput("");
    const userMsg: EmailyChatMessage = { role: "user", content: trimmed };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setLoading(true);

    try {
      const { reply } = await emailyChat(trimmed, messages, inboxContext);
      setMessages([...nextHistory, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close Ask Incuria"
            className="fixed inset-0 z-40 bg-incuria-ink/30 backdrop-blur-md"
            initial={motionPresets.overlay.initial}
            animate={motionPresets.overlay.animate}
            exit={motionPresets.overlay.exit}
            transition={motionPresets.overlay.transition}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-label="Ask Incuria assistant"
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-incuria-border bg-incuria-surface shadow-incuria-pop"
            initial={reduceMotion ? { x: "100%" } : { x: "100%", filter: "blur(8px)" }}
            animate={reduceMotion ? { x: 0 } : { x: 0, filter: "blur(0px)" }}
            exit={reduceMotion ? { x: "100%" } : { x: "100%", filter: "blur(6px)" }}
            transition={motionPresets.drawer.transition}
          >
            <header className="flex shrink-0 items-center justify-between border-b border-incuria-border px-4 py-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-incuria-accent">
                  Inbox assistant
                </p>
                <h2 className="font-display text-xl font-semibold text-incuria-ink">{BRAND.assistant}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-2 py-1 text-sm text-incuria-ink-muted transition hover:bg-incuria-ink/[0.05] hover:text-incuria-ink"
              >
                Close
              </button>
            </header>

            <div
              ref={scrollRef}
              className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
            >
              {messages.length === 0 && !loading && (
                <div className="space-y-3">
                  <p className="text-[15px] leading-relaxed text-incuria-ink-muted">
                    Ask anything about your current inbox view — priorities, summaries, who to
                    reply to, or what an open message is about.
                  </p>
                  <p className="text-xs text-incuria-ink-muted/80">
                    Context: {inboxContext.totalVisible} message
                    {inboxContext.totalVisible === 1 ? "" : "s"}
                    {inboxContext.folder ? ` · ${inboxContext.folder}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => void send(s)}
                        className="rounded-full border border-incuria-border bg-incuria-canvas px-3 py-1.5 text-left text-[13px] text-incuria-ink-muted transition hover:border-incuria-accent/40 hover:bg-incuria-accent-soft hover:text-incuria-accent"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={`${i}-${m.role}`}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed ${
                      m.role === "user"
                        ? "bg-incuria-accent text-white"
                        : "border border-incuria-border bg-incuria-canvas text-incuria-ink"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-incuria-border bg-incuria-canvas px-3.5 py-2.5 text-[15px] text-incuria-ink-muted">
                    Thinking…
                  </div>
                </div>
              )}

              {error && (
                <p className="rounded-lg border border-incuria-needs-reply/30 bg-incuria-needs-reply-soft px-3 py-2 text-sm text-incuria-needs-reply">
                  {error}
                </p>
              )}
            </div>

            <footer className="shrink-0 border-t border-incuria-border p-3">
              <div className="flex gap-2 rounded-xl border border-incuria-border bg-incuria-canvas p-2 focus-within:border-incuria-accent/50">
                <textarea
                  ref={inputRef}
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your inbox…"
                  disabled={loading}
                  className="min-h-[44px] flex-1 resize-none bg-transparent px-1 text-[15px] text-incuria-ink placeholder:text-incuria-ink-muted/70 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={loading || !input.trim()}
                  onClick={() => void send(input)}
                  className="self-end rounded-lg bg-incuria-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-incuria-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Send
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-incuria-ink-muted/80">
                Answers use your visible inbox only · Enter to send
              </p>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
