import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IncuriaMark } from "../brand/IncuriaLogo";
import { EASE } from "../../theme/brand";

type FolderId = "inbox" | "needs-reply" | "batch" | "sent" | "drafts";

type MockEmail = {
  id: string;
  folders: FolderId[];
  from: string;
  initials: string;
  subject: string;
  preview: string;
  time: string;
  tag: string | null;
  course: string;
  body: string;
  draftLines: string[];
  source?: string;
  batch?: { count: number; recipients: string[] };
  sent?: boolean;
  draft?: boolean;
};

const sidebarFolders = [
  { label: "Inbox", count: "12", id: "inbox" as const },
  { label: "Needs reply", count: "4", id: "needs-reply" as const },
  { label: "Batch ready", count: "5", id: "batch" as const },
  { label: "Sent", count: null, id: "sent" as const },
  { label: "Drafts", count: "2", id: "drafts" as const },
];

const emails: MockEmail[] = [
  {
    id: "maya",
    folders: ["inbox", "needs-reply"],
    from: "Maya Patel",
    initials: "MP",
    subject: "Extension on Problem Set 4?",
    preview: "Hi Professor. I've been out sick since Tuesday and…",
    time: "9:12 PM",
    tag: "Needs reply",
    course: "CS 3345",
    body: "Hi Professor. I have been out sick since Tuesday and could not make it to office hours. Would it be possible to get a short extension on Problem Set 4? I can send a doctor's note if needed.",
    draftLines: [
      "Hi Maya. Sorry to hear you have been unwell.",
      "Per the syllabus, documented illness qualifies for a 48-hour extension, so Problem Set 4 is now due Thursday at 11:59 PM.",
      "Feel better soon.",
    ],
    source: "CS 3345 Syllabus.pdf, § Late work",
  },
  {
    id: "daniel",
    folders: ["inbox", "batch"],
    from: "Daniel Okafor",
    initials: "DO",
    subject: "Midterm room confusion",
    preview: "Quick question: is the midterm in ECSS 2.410 or…",
    time: "8:47 PM",
    tag: "Batch · 5 similar",
    course: "CS 3345",
    body: "Hi Professor. Quick question: is the midterm in ECSS 2.410 or the lecture hall? A few of us heard different things.",
    draftLines: [
      "Hi everyone. The midterm is in ECSS 2.410, Thursday at 10 AM.",
      "Bring your student ID. Calculators are fine; phones are not.",
      "See the exam section of the syllabus for full details.",
    ],
    source: "CS 3345 Syllabus.pdf, page 2",
    batch: { count: 5, recipients: ["DO", "MP", "SR", "JL", "AK"] },
  },
  {
    id: "sofia",
    folders: ["inbox", "needs-reply"],
    from: "Sofia Reyes",
    initials: "SR",
    subject: "Office hours this Friday",
    preview: "Will office hours still run during reading day, or…",
    time: "7:30 PM",
    tag: "Needs reply",
    course: "CS 3345",
    body: "Hi Professor. Will office hours still run during reading day, or should we plan for next week instead?",
    draftLines: [
      "Hi Sofia. Office hours move to Thursday 3–4 PM this week because of reading day.",
      "If that does not work, reply with two times that do and I will find a slot.",
    ],
    source: "Teaching rules · Office hours policy",
  },
  {
    id: "james",
    folders: ["inbox", "needs-reply"],
    from: "James Liu",
    initials: "JL",
    subject: "HW 3 autograder error",
    preview: "My submission keeps failing test case 4 even though…",
    time: "6:18 PM",
    tag: "Needs reply",
    course: "CS 3345",
    body: "Hi Professor Liu here. My HW 3 submission keeps failing test case 4 even though the output matches the expected file on my machine. Could you take a look at ticket #1842?",
    draftLines: [
      "Hi James. I reproduced the issue — the autograder trims trailing whitespace.",
      "Resubmit after stripping whitespace from line 42. I extended the deadline 24 hours for anyone affected.",
    ],
    source: "Teaching rules · Autograder policy",
  },
  {
    id: "priya",
    folders: ["inbox", "batch"],
    from: "Priya Nair",
    initials: "PN",
    subject: "Final exam format?",
    preview: "Will the final be cumulative or focused on Unit 3…",
    time: "5:55 PM",
    tag: "Batch · 3 similar",
    course: "CS 3345",
    body: "Hello. Will the final exam be cumulative or focused on Unit 3 onward? Trying to plan study time.",
    draftLines: [
      "Hi everyone. The final is cumulative with emphasis on Units 2–4.",
      "Review sessions are Monday and Wednesday at 4 PM in ECSS 2.410.",
    ],
    source: "CS 3345 Syllabus.pdf, § Exams",
    batch: { count: 3, recipients: ["PN", "TW", "RK"] },
  },
  {
    id: "registrar",
    folders: ["inbox"],
    from: "Registrar's Office",
    initials: "RO",
    subject: "Grade submission deadline",
    preview: "Reminder: final grades for Fall term are due by…",
    time: "4:05 PM",
    tag: null,
    course: "Admin",
    body: "Reminder: final grades for Fall term are due by December 18 at 5:00 PM. Submit through the faculty portal. Late submissions require dean approval.",
    draftLines: [],
  },
  {
    id: "sent-maya",
    folders: ["sent"],
    from: "Maya Patel",
    initials: "MP",
    subject: "Re: Extension on Problem Set 3",
    preview: "You: Hi Maya. Approved — one week extension per syllabus…",
    time: "Yesterday",
    tag: null,
    course: "CS 3345",
    body: "You sent: Hi Maya. Approved — one week extension per syllabus policy. New due date is Friday at 11:59 PM.",
    draftLines: [],
    sent: true,
  },
  {
    id: "sent-batch",
    folders: ["sent"],
    from: "Daniel Okafor + 4 others",
    initials: "5",
    subject: "Re: Lab 6 partner matching",
    preview: "You: Partners are assigned in Canvas. Check People → Lab groups…",
    time: "Mon",
    tag: null,
    course: "CS 3345",
    body: "You sent to 5 students: Partners are assigned in Canvas. Check People → Lab groups by Thursday. Reply if you need an exception.",
    draftLines: [],
    sent: true,
  },
  {
    id: "draft-amy",
    folders: ["drafts"],
    from: "Amy Kim",
    initials: "AK",
    subject: "Re: Research credit question",
    preview: "Draft: Hi Amy. Independent study credit requires department form…",
    time: "Draft",
    tag: "Draft",
    course: "CS 4348",
    body: "Amy asked whether research hours this semester can count toward CS 4348 elective credit.",
    draftLines: [
      "Hi Amy. Independent study credit requires the department form by week 10.",
      "Send me your project abstract and I will sign the form at our next meeting.",
    ],
    source: "CS 4348 Syllabus.pdf",
    draft: true,
  },
  {
    id: "draft-ta",
    folders: ["drafts"],
    from: "TA Coordinator",
    initials: "TC",
    subject: "Re: Spring TA assignments",
    preview: "Draft: Thanks for confirming. I listed you for CS 3345 section…",
    time: "Draft",
    tag: "Draft",
    course: "Admin",
    body: "The TA coordinator asked you to confirm spring section assignments by Friday.",
    draftLines: [
      "Thanks for confirming. I listed you for CS 3345 section 002 and CS 4348 section 001.",
      "Let me know if either time conflicts with your schedule.",
    ],
    draft: true,
  },
];

const folderLabels: Record<FolderId, string> = {
  inbox: "Inbox",
  "needs-reply": "Needs reply",
  batch: "Batch ready",
  sent: "Sent",
  drafts: "Drafts",
};

const AUTO_CYCLE_MS = 5500;

type Props = {
  animate?: boolean;
  interactive?: boolean;
  className?: string;
};

function useDraftReveal(lines: string[], active: boolean, resetKey: string) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(reduceMotion ? lines.length : 0);

  useEffect(() => {
    if (!active || lines.length === 0) {
      setVisible(0);
      return;
    }
    if (reduceMotion) {
      setVisible(lines.length);
      return;
    }
    setVisible(0);
    const timers = lines.map((_, i) =>
      window.setTimeout(() => setVisible(i + 1), 200 + i * 280),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [active, lines, resetKey, reduceMotion]);

  return visible;
}

function filterByFolder(folder: FolderId) {
  return emails.filter((e) => e.folders.includes(folder));
}

export function WorkbenchMockup({
  animate = true,
  interactive = true,
  className = "",
}: Props) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animate && !reduceMotion;
  const [activeFolder, setActiveFolder] = useState<FolderId>("needs-reply");
  const [selectedId, setSelectedId] = useState("maya");
  const [userInteracted, setUserInteracted] = useState(false);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [sendPulse, setSendPulse] = useState(false);
  const cycleRef = useRef(0);

  const folderEmails = useMemo(() => filterByFolder(activeFolder), [activeFolder]);
  const folderLabel = folderLabels[activeFolder];

  const selected = useMemo(() => {
    const match = folderEmails.find((e) => e.id === selectedId);
    return match ?? folderEmails[0] ?? emails[0];
  }, [folderEmails, selectedId]);

  const draftVisible = useDraftReveal(
    selected.draftLines,
    interactive && selected.draftLines.length > 0 && !selected.sent,
    `${activeFolder}-${selected.id}`,
  );

  const pickFolder = useCallback(
    (folder: FolderId) => {
      if (!interactive) return;
      setUserInteracted(true);
      setActiveFolder(folder);
      setMobileShowDetail(false);
      const next = filterByFolder(folder);
      if (next.length > 0) setSelectedId(next[0].id);
      cycleRef.current = 0;
    },
    [interactive],
  );

  const pickEmail = useCallback(
    (id: string) => {
      if (!interactive) return;
      setUserInteracted(true);
      setSelectedId(id);
      setMobileShowDetail(true);
    },
    [interactive],
  );

  // Keep selection valid when folder list changes
  useEffect(() => {
    if (!folderEmails.some((e) => e.id === selectedId) && folderEmails.length > 0) {
      setSelectedId(folderEmails[0].id);
    }
  }, [folderEmails, selectedId]);

  // Auto-cycle within active folder until user interacts
  useEffect(() => {
    if (!interactive || userInteracted || folderEmails.length < 2) return;
    const interval = window.setInterval(() => {
      cycleRef.current = (cycleRef.current + 1) % folderEmails.length;
      setSelectedId(folderEmails[cycleRef.current].id);
    }, AUTO_CYCLE_MS);
    return () => window.clearInterval(interval);
  }, [interactive, userInteracted, folderEmails, activeFolder]);

  const listTransition = { duration: 0.22, ease: EASE };
  const paneTransition = { duration: 0.25, ease: EASE };

  return (
    <div className={`group/mockup relative ${className}`.trim()}>
      <div
        className="pointer-events-none absolute -inset-3 rounded-[28px] opacity-60 blur-2xl"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(79,70,229,0.18) 0%, transparent 70%)",
        }}
      />

      <div className="relative overflow-hidden rounded-[14px] border border-land-border/80 bg-white shadow-[0_24px_80px_-12px_rgba(23,23,30,0.22),0_0_0_1px_rgba(23,23,30,0.04)]">
        <div className="flex h-10 items-center gap-2 border-b border-land-border bg-[#F4F3F0] px-4">
          <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
          <span className="h-3 w-3 rounded-full bg-[#28C840]" />
          <AnimatePresence mode="wait">
            <motion.span
              key={activeFolder}
              className="mx-auto font-landing-body text-[12px] font-medium text-land-ink-muted"
              initial={reduceMotion ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
            >
              Incuria · {folderLabel} · CS 3345
            </motion.span>
          </AnimatePresence>
          <span className="w-[52px]" aria-hidden />
        </div>

        <div className="grid h-[min(62vw,580px)] min-h-[420px] grid-cols-[168px_248px_1fr] text-left max-lg:grid-cols-[148px_220px_1fr] max-sm:grid-cols-1 max-sm:min-h-[440px]">
          {/* Sidebar */}
          <aside className="flex flex-col bg-[#17171E] px-2.5 py-4 max-sm:flex-row max-sm:gap-1 max-sm:overflow-x-auto max-sm:px-2 max-sm:py-2">
            <div className="mb-4 flex items-center gap-2 px-2 max-sm:mb-0 max-sm:shrink-0 max-sm:px-1">
              <IncuriaMark size={18} />
              <span className="font-landing-body text-[12px] font-semibold text-white/90 max-sm:hidden">
                Incuria
              </span>
            </div>

            <nav className="flex flex-1 flex-col gap-0.5 max-sm:flex-row max-sm:gap-1">
              {sidebarFolders.map((f) => {
                const active = f.id === activeFolder;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => pickFolder(f.id)}
                    className={`flex shrink-0 items-center justify-between rounded-lg px-2.5 py-2 font-landing-body text-[12px] transition-all duration-200 max-sm:px-3 max-sm:py-1.5 ${
                      active
                        ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                        : "text-white/55 hover:bg-white/[0.06] hover:text-white/80"
                    }`}
                  >
                    <span className="whitespace-nowrap">{f.label}</span>
                    {f.count ? (
                      <span
                        className={`ml-2 max-sm:ml-1.5 ${active ? "font-medium text-[#A5A0F5]" : "text-white/35"}`}
                      >
                        {f.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            <div className="max-sm:hidden">
              <p className="mt-2 px-2.5 font-landing-body text-[9px] uppercase tracking-[0.14em] text-white/30">
                Courses
              </p>
              {["CS 3345", "CS 4348"].map((c, i) => (
                <div
                  key={c}
                  className={`rounded-md px-2.5 py-1.5 font-landing-body text-[12px] ${
                    i === 0 ? "text-white/75" : "text-white/45"
                  }`}
                >
                  {c}
                </div>
              ))}
            </div>
          </aside>

          {/* Message list — hidden on mobile when detail is open */}
          <div
            className={`flex flex-col border-r border-land-border bg-[#F7F6F3] max-sm:border-r-0 max-sm:border-b ${
              mobileShowDetail ? "max-sm:hidden" : "max-sm:flex"
            } sm:flex`}
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={activeFolder}
                className="border-b border-land-border px-4 py-3 font-landing-body text-[12px] font-semibold text-land-ink"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={listTransition}
              >
                {folderLabel}
              </motion.p>
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFolder}
                  initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, x: 8 }}
                  transition={listTransition}
                >
                  {folderEmails.length === 0 ? (
                    <p className="px-4 py-8 text-center font-landing-body text-[12px] text-land-ink-faint">
                      No messages here
                    </p>
                  ) : (
                    folderEmails.map((row, i) => {
                      const isSelected = row.id === selected.id;
                      return (
                        <motion.button
                          key={row.id}
                          type="button"
                          layout={!reduceMotion}
                          onClick={() => pickEmail(row.id)}
                          initial={shouldAnimate ? { opacity: 0, y: 6 } : false}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: shouldAnimate ? i * 0.04 : 0, ease: EASE }}
                          className={`relative flex w-full flex-col border-b border-land-border px-4 py-3 text-left transition-colors duration-150 ${
                            isSelected
                              ? "bg-white shadow-[inset_3px_0_0_0_#4F46E5]"
                              : "hover:bg-white/70"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-land-accent-soft font-landing-body text-[10px] font-semibold text-land-accent-deep">
                              {row.initials}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <span
                                  className={`truncate font-landing-body text-[12px] ${
                                    isSelected ? "font-semibold text-land-ink" : "font-medium text-land-ink"
                                  }`}
                                >
                                  {row.from}
                                </span>
                                <span className="shrink-0 font-landing-body text-[10px] text-land-ink-faint">
                                  {row.time}
                                </span>
                              </div>
                              <p className="truncate font-landing-body text-[11.5px] text-land-ink">
                                {row.subject}
                              </p>
                              <p className="mt-0.5 truncate font-landing-body text-[11px] text-land-ink-faint">
                                {row.preview}
                              </p>
                              {row.tag ? (
                                <span className="mt-1.5 inline-block rounded-full bg-land-accent-soft px-2 py-0.5 font-landing-body text-[9.5px] font-medium text-land-accent-deep">
                                  {row.tag}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Reading pane */}
          <div
            className={`flex-col overflow-hidden bg-white ${
              mobileShowDetail ? "flex max-sm:flex-1" : "hidden sm:flex"
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeFolder}-${selected.id}`}
                className="flex h-full flex-col overflow-y-auto"
                initial={reduceMotion ? false : { opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: -10 }}
                transition={paneTransition}
              >
                {/* Mobile back */}
                <button
                  type="button"
                  onClick={() => setMobileShowDetail(false)}
                  className="flex items-center gap-1.5 border-b border-land-border px-4 py-2.5 font-landing-body text-[12px] font-medium text-land-accent hover:text-land-accent-hover sm:hidden"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="M8.5 3 4 7l4.5 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {folderLabel}
                </button>

                <div className="px-6 py-5">
                  <p className="font-landing-body text-[15px] font-semibold leading-snug text-land-ink">
                    {selected.subject}
                  </p>
                  <p className="mt-1 font-landing-body text-[11.5px] text-land-ink-faint">
                    {selected.from} · {selected.course} · {selected.time}
                  </p>

                  <p className="mt-4 font-landing-body text-[12.5px] leading-[1.65] text-land-ink-muted">
                    {selected.body}
                  </p>

                  {selected.sent ? (
                    <div className="mt-5 rounded-xl border border-land-border bg-land-canvas/80 px-4 py-3.5">
                      <p className="font-landing-body text-[11.5px] text-land-ink-muted">
                        Delivered from your account. No further action needed.
                      </p>
                    </div>
                  ) : selected.draftLines.length > 0 ? (
                    <div className="mt-5 rounded-xl border border-land-accent/25 bg-gradient-to-b from-land-accent-soft/70 to-land-accent-soft/40 p-4">
                      <div className="flex items-center gap-2">
                        <SparkIcon />
                        <span className="font-landing-body text-[11px] font-semibold text-land-accent-deep">
                          {selected.draft ? "Draft in progress" : "Draft ready"} · From your materials and rules
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        {selected.draftLines.map((line, i) => (
                          <p
                            key={`${selected.id}-${i}`}
                            className={`font-landing-body text-[12.5px] leading-[1.55] text-land-ink transition-opacity duration-200 ${
                              i < draftVisible ? "opacity-100" : "opacity-0"
                            }`}
                          >
                            {line}
                            {interactive &&
                            i === draftVisible - 1 &&
                            draftVisible < selected.draftLines.length ? (
                              <span className="ml-0.5 inline-block h-[14px] w-[2px] animate-pulse bg-land-accent align-middle" />
                            ) : null}
                          </p>
                        ))}
                      </div>

                      {selected.source ? (
                        <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-land-accent/15 bg-white/60 px-2.5 py-1.5">
                          <SparkIcon />
                          <span className="font-landing-body text-[10px] text-land-accent-deep">
                            {selected.source}
                          </span>
                        </div>
                      ) : null}

                      {selected.batch ? (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-land-accent/15 pt-3">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1.5">
                              {selected.batch.recipients.map((initials) => (
                                <span
                                  key={initials}
                                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-land-accent-soft font-landing-body text-[9px] font-semibold text-land-accent-deep"
                                >
                                  {initials}
                                </span>
                              ))}
                            </div>
                            <span className="font-landing-body text-[10.5px] text-land-ink-muted">
                              {selected.batch.count} students
                            </span>
                          </div>
                          <SendButton
                            interactive={interactive}
                            label={`Send to all ${selected.batch.count}`}
                            sendPulse={sendPulse}
                            onPulse={setSendPulse}
                          />
                        </div>
                      ) : (
                        <div className="mt-4 flex flex-wrap items-center gap-2.5">
                          <SendButton
                            interactive={interactive}
                            label={selected.draft ? "Review & send" : "Approve & send"}
                            sendPulse={sendPulse}
                            onPulse={setSendPulse}
                          />
                          <button
                            type="button"
                            className="rounded-full border border-land-border bg-white px-4 py-1.5 font-landing-body text-[11px] font-medium text-land-ink-muted transition-colors duration-200 hover:border-land-ink/20 hover:text-land-ink"
                          >
                            Edit first
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-xl border border-dashed border-land-border bg-land-canvas/80 px-4 py-3.5">
                      <p className="font-landing-body text-[11.5px] text-land-ink-muted">
                        No reply needed. Incuria filed this under{" "}
                        <span className="font-medium text-land-ink">Can wait</span>.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {interactive ? (
        <p className="mt-3 text-center font-landing-body text-[11px] text-land-ink-faint">
          Try the sidebar folders and messages
        </p>
      ) : null}
    </div>
  );
}

function SendButton({
  interactive,
  label,
  sendPulse,
  onPulse,
}: {
  interactive: boolean;
  label: string;
  sendPulse: boolean;
  onPulse: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={() => interactive && onPulse(true)}
      onMouseLeave={() => onPulse(false)}
      className={`rounded-full bg-land-accent px-4 py-1.5 font-landing-body text-[11px] font-semibold text-white transition-all duration-200 ${
        interactive ? "hover:bg-land-accent-hover hover:shadow-md active:scale-[0.98]" : ""
      } ${sendPulse ? "shadow-[0_0_0_4px_rgba(79,70,229,0.2)]" : ""}`}
    >
      {label}
    </button>
  );
}

function SparkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M6 1l1.1 2.7L9.8 4.8 7.1 5.9 6 8.6 4.9 5.9 2.2 4.8l2.7-1.1z"
        fill="#4F46E5"
        fillOpacity="0.8"
      />
      <circle cx="9.8" cy="9.4" r="1" fill="#4F46E5" fillOpacity="0.45" />
    </svg>
  );
}
