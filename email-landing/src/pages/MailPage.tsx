import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { EmailyAIPanel } from "../components/mail/EmailyAIPanel";
import { MailDetailPanel } from "../components/mail/MailDetailPanel";
import { MailListPanel } from "../components/mail/MailListPanel";
import { MailPaneTransition } from "../components/motion/MailPaneTransition";
import { useWorkbench } from "../contexts/WorkbenchContext";
import { ReplyComposer } from "../components/mail/ReplyComposer";
import { ShortcutsOverlay } from "../components/mail/ShortcutsOverlay";
import { useMailKeyboard } from "../components/mail/useMailKeyboard";
import {
  deleteOutlookMessage,
  fetchOutlookMessage,
  fetchOutlookMessages,
  fetchOutlookThread,
  generateReply,
  moveOutlookMessage,
  patchOutlookMessageRead,
  type EmailyInboxContext,
  scheduleMeetingFromInstructions,
  sendOutlookMail,
  summarizeEmail,
} from "../lib/api";
import type { InboxFilterId } from "../components/mail/MailInboxFilters";
import { getUserDisplayName } from "../lib/auth";
import { getTeachingRules, ROUTES } from "../lib/routes";
import { studentFirstName } from "../lib/names";
import { isProOrPremium } from "../lib/subscription";
import { replyTargetForEmail } from "../lib/threadReply";
import {
  GENERAL_COURSE_ID,
  type Course,
  type Email,
  type EmailSummary,
  type MailFolder,
  type MailView,
  type OutlookThread,
} from "../types";
import { classifyPriority, clusterSimilarEmails, type PriorityTag } from "../components/mail/utils";
import { HomePanel } from "../components/home/HomePanel";

const FOLDER_LABEL: Record<MailFolder, string> = {
  inbox: "Inbox",
  sentitems: "Sent",
  drafts: "Drafts",
  junkemail: "Junk",
  deleteditems: "Deleted",
  archive: "Archive",
};

const SPECIAL_LABEL: Record<string, string> = {
  home: "Home",
  "needs-reply": "Needs reply",
  "batch-ready": "Batch ready",
};

const STORAGE_KEYS = {
  emailTags: "incuria-email-tags",
  emailCourses: "incuria-email-courses",
} as const;

const LEGACY_KEYS = {
  emailTags: "academic-mail-email-tags",
  emailCourses: "academic-mail-email-courses",
} as const;

/** Read a stored value, migrating once from the legacy academic-mail-* key. */
function readStored(key: keyof typeof STORAGE_KEYS): string | null {
  const current = localStorage.getItem(STORAGE_KEYS[key]);
  if (current != null) return current;
  const legacy = localStorage.getItem(LEGACY_KEYS[key]);
  if (legacy != null) {
    localStorage.setItem(STORAGE_KEYS[key], legacy);
    localStorage.removeItem(LEGACY_KEYS[key]);
  }
  return legacy;
}

type Props = { view: MailView };

export default function MailPage({ view }: Props) {
  const activeSpecial = view.kind === "special" ? view.special : null;
  const folderFromView: MailFolder = view.kind === "folder" ? view.folder : "inbox";
  const navigate = useNavigate();
  const location = useLocation();
  const wb = useWorkbench();
  const {
    courses,
    coursesLoading,
    refreshCourses,
    tags,
    addTag,
    sidebarCourseId,
    setSidebarCourseId,
    selectedTag,
    setSelectedTag,
    starredOnly,
    setMailCounts,
    narrow,
    setOnEmailDropOnCourse,
    setOnEmailDropOnTag,
    setOnEmailDropOnFolder,
    registerCompose,
    registerBulkCompose,
    registerOpenAssistant,
    setAssistantOpen,
    assistantOpen: emailyOpen,
    setBulkDraftingProgress,
    onFolderChange: wbFolderChange,
    setStatusMessage,
  } = wb;
  const shellRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const messageCache = useRef<Map<string, Email>>(new Map());
  const threadCache = useRef<Map<string, OutlookThread>>(new Map());
  const markReadInFlight = useRef<Set<string>>(new Set());
  const [selectedThread, setSelectedThread] = useState<OutlookThread | null>(null);

  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Email | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<EmailSummary | null>(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  type DraftData = { body: string; generating: boolean; status?: string };
  const [bulkDrafts, setBulkDrafts] = useState<Record<string, DraftData>>({});

  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());

  const [replyBody, setReplyBody] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyCourseId, setReplyCourseId] = useState(GENERAL_COURSE_ID);
  const [replyInstructions, setReplyInstructions] = useState("");
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<MailFolder>(folderFromView);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailLoadError, setEmailLoadError] = useState<string | null>(null);
  const [starredIds, setStarredIds] = useState<Set<string>>(() => new Set());
  const [emailTags, setEmailTags] = useState<Record<string, string[]>>(() => {
    try {
      const raw = readStored("emailTags");
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {};
  });
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [emailCourses, setEmailCourses] = useState<Record<string, string>>(() => {
    try {
      const raw = readStored("emailCourses");
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {};
  });
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [inboxFilters, setInboxFilters] = useState<Set<InboxFilterId>>(() => new Set());

  const toggleInboxFilter = useCallback((id: InboxFilterId) => {
    setInboxFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSearchFocus = useCallback(() => {
    const el = searchRef.current;
    if (!el) return;
    if (document.activeElement === el) {
      el.blur();
      return;
    }
    el.focus();
    el.select();
  }, []);

  useEffect(() => {
    const saved = getTeachingRules();
    if (saved) {
      setReplyInstructions((prev) => prev || saved);
    }
  }, []);

  const handleAssignCourse = useCallback((emailId: string, courseId: string | null) => {
    setEmailCourses((prev) => {
      const next = { ...prev };
      if (courseId) {
        next[emailId] = courseId;
      } else {
        delete next[emailId];
      }
      localStorage.setItem(STORAGE_KEYS.emailCourses, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleAddTag = useCallback(() => {
    const name = window.prompt("New tag name");
    if (!name) return;
    const trimmed = name.trim().slice(0, 32);
    if (!trimmed) return;
    addTag(trimmed);
    setSelectedTag(trimmed);
  }, [addTag, setSelectedTag]);

  const toggleEmailTag = useCallback((emailId: string, tag: string) => {
    setEmailTags(prev => {
      const t = prev[emailId] || [];
      const next = t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag];
      const newMap = { ...prev, [emailId]: next };
      localStorage.setItem(STORAGE_KEYS.emailTags, JSON.stringify(newMap));
      return newMap;
    });
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchOutlookMessages(currentFolder);
      setEmails(list);
      setSelectedId((prev) => (prev && list.some((e) => e.id === prev) ? prev : list[0]?.id ?? null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load mail");
    } finally {
      setLoading(false);
    }
  }, [currentFolder]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    setCurrentFolder(folderFromView);
  }, [folderFromView]);

  function selectEmail(id: string) {
    const preview = emails.find((e) => e.id === id);
    const cached = messageCache.current.get(id);
    if (cached) {
      setSelected(cached);
    } else if (preview) {
      setSelected(preview);
    }
    setSelectedId(id);
    setSummaryVisible(false);
    setEmailLoadError(null);
    if (activeSpecial === "home") {
      navigate(ROUTES.INBOX);
    }
  }

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      setEmailLoading(false);
      setEmailLoadError(null);
      return;
    }

    const cached = messageCache.current.get(selectedId);
    if (cached?.bodyHtml || cached?.body) {
      setSelected(cached);
      setReplySubject(cached.subject.startsWith("Re:") ? cached.subject : `Re: ${cached.subject}`);
      setEmailLoading(false);
      return;
    }

    let cancelled = false;
    setEmailLoading(true);
    setEmailLoadError(null);

    fetchOutlookMessage(selectedId)
      .then((email) => {
        if (!cancelled) {
          messageCache.current.set(email.id, email);
          setSelected(email);
          setReplySubject(email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setEmailLoadError(e instanceof Error ? e.message : "Failed to load message");
        }
      })
      .finally(() => {
        if (!cancelled) setEmailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedThread(null);
      return;
    }
    const cached = threadCache.current.get(selectedId);
    if (cached) {
      setSelectedThread(cached);
      return;
    }
    let cancelled = false;
    void fetchOutlookThread(selectedId)
      .then((thread) => {
        if (cancelled) return;
        threadCache.current.set(selectedId, thread);
        setSelectedThread(thread);
      })
      .catch(() => {
        if (!cancelled) setSelectedThread(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selected) return;
    const target = replyTargetForEmail(selected, selectedThread);
    if (target.email.includes("@")) {
      setReplyTo(target.email);
    }
  }, [selected?.id, selectedThread]);

  const clusters = useMemo(() => clusterSimilarEmails(emails), [emails]);

  const batchClusterSizes = useMemo(() => {
    if (activeSpecial !== "batch-ready") return undefined;
    const map: Record<string, number> = {};
    for (const cluster of clusters) {
      for (const e of cluster.emails) {
        map[e.id] = cluster.emails.length;
      }
    }
    return map;
  }, [activeSpecial, clusters]);

  const filtered = useMemo(() => {
    let list = emails;

    if (activeSpecial === "needs-reply") {
      list = list.filter((e) => e.isRead === false || classifyPriority(e) === "Urgent");
    } else if (activeSpecial === "batch-ready") {
      const clusterIds = new Set(clusters.flatMap((c) => c.emails.map((e) => e.id)));
      list = list.filter((e) => clusterIds.has(e.id) || Boolean(bulkDrafts[e.id]?.body));
    }

    if (starredOnly) {
      list = list.filter((e) => starredIds.has(e.id));
    }

    if (sidebarCourseId && sidebarCourseId !== GENERAL_COURSE_ID) {
      const selectedCourse = courses.find((c) => c.id === sidebarCourseId);
      if (selectedCourse) {
        const courseNameLower = selectedCourse.name.toLowerCase();
        list = list.filter((e) => {
          const subj = e.subject || "";
          const prev = e.preview || "";
          const body = e.body || "";
          return (
            subj.toLowerCase().includes(courseNameLower) ||
            prev.toLowerCase().includes(courseNameLower) ||
            body.toLowerCase().includes(courseNameLower) ||
            emailCourses[e.id] === sidebarCourseId
          );
        });
      }
    }

    if (selectedTag) {
      const tagLower = selectedTag.toLowerCase();
      list = list.filter((e) => {
        const subj = e.subject || "";
        const inSubject = subj.toLowerCase().includes(tagLower);
        const tagsForEmail = emailTags[e.id];
        const inTags = Array.isArray(tagsForEmail) && tagsForEmail.includes(selectedTag);
        return inSubject || inTags;
      });
    }

    if (inboxFilters.has("unread")) {
      list = list.filter((e) => e.isRead === false);
    }
    if (inboxFilters.has("flagged")) {
      list = list.filter((e) => starredIds.has(e.id));
    }
    if (inboxFilters.has("attachments")) {
      list = list.filter((e) => e.hasAttachments);
    }
    for (const priority of ["Urgent", "Student", "Admin", "Meeting"] as const) {
      if (inboxFilters.has(priority)) {
        list = list.filter((e) => classifyPriority(e) === priority);
      }
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (e) => {
        const subj = e.subject || "";
        const from = e.from || "";
        const prev = e.preview || "";
        const body = e.body || "";
        return subj.toLowerCase().includes(q) ||
          from.toLowerCase().includes(q) ||
          prev.toLowerCase().includes(q) ||
          body.toLowerCase().includes(q);
      }
    );
  }, [emails, activeSpecial, clusters, bulkDrafts, starredOnly, starredIds, search, selectedTag, emailTags, sidebarCourseId, courses, emailCourses, inboxFilters]);

  const listTitle = useMemo(() => {
    if (starredOnly) return "Flagged";
    if (selectedTag) return selectedTag;
    if (sidebarCourseId && sidebarCourseId !== GENERAL_COURSE_ID) {
      const c = courses.find((x) => x.id === sidebarCourseId);
      if (c) return c.name;
    }
    if (activeSpecial) return SPECIAL_LABEL[activeSpecial] ?? "Mail";
    return FOLDER_LABEL[currentFolder] ?? "Mail";
  }, [starredOnly, selectedTag, sidebarCourseId, courses, activeSpecial, currentFolder]);

  const needsReplyCount = useMemo(
    () => emails.filter((e) => e.isRead === false || classifyPriority(e) === "Urgent").length,
    [emails],
  );
  const batchReadyCount = useMemo(
    () => new Set(clusters.flatMap((c) => c.emails.map((e) => e.id))).size,
    [clusters],
  );

  const emailyInboxContext = useMemo((): EmailyInboxContext => {
    const selectedCourse = sidebarCourseId
      ? courses.find((c) => c.id === sidebarCourseId)
      : null;
    const bodyPlain = (e: Email) => {
      if (e.body?.trim()) return e.body.slice(0, 3500);
      if (e.bodyHtml) {
        return e.bodyHtml
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 3500);
      }
      return (e.preview || "").slice(0, 3500);
    };
    const openBody = selected ? bodyPlain(selected) : "";
    return {
      folder: currentFolder,
      searchQuery: search.trim() || undefined,
      selectedTag,
      selectedCourseName: selectedCourse?.name ?? null,
      totalVisible: filtered.length,
      emails: filtered.map((e) => ({
        id: e.id,
        from: e.from,
        subject: e.subject,
        date: e.date,
        preview: e.preview || e.body?.slice(0, 280) || "",
        urgency: e.urgency,
        tags: emailTags[e.id],
      })),
      selectedEmail: selected
        ? {
            subject: selected.subject,
            from: selected.from,
            date: selected.date,
            body: openBody,
            threadMessages:
              selectedThread && selectedThread.messages.length > 1
                ? selectedThread.messages
                : undefined,
          }
        : null,
      courseNames: courses.map((c) => c.name),
    };
  }, [
    currentFolder,
    search,
    selectedTag,
    sidebarCourseId,
    courses,
    filtered,
    selected,
    selectedThread,
    emailTags,
  ]);

  function toggleStar(id: string) {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const handleDeleteEmail = useCallback(async (id: string) => {
    try {
      await deleteOutlookMessage(id);
    } catch (e) {
      setStatusNote(e instanceof Error ? e.message : "Delete failed");
      return;
    }
    messageCache.current.delete(id);
    threadCache.current.delete(id);
    setEmails((prev) => {
      const next = prev.filter((e) => e.id !== id);
      setSelectedId((cur) => (cur === id ? next[0]?.id ?? null : cur));
      return next;
    });
    setSelectedEmailIds((prev) => {
      if (!prev.has(id)) return prev;
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  }, []);

  const moveOut = useCallback((id: string) => {
    messageCache.current.delete(id);
    threadCache.current.delete(id);
    setEmails((prev) => {
      const next = prev.filter((e) => e.id !== id);
      setSelectedId((cur) => (cur === id ? next[0]?.id ?? null : cur));
      return next;
    });
    setSelectedEmailIds((prev) => {
      if (!prev.has(id)) return prev;
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  }, []);

  useEffect(() => {
    setMailCounts({
      needsReply: needsReplyCount,
      batchReady: batchReadyCount,
      inbox: currentFolder === "inbox" ? emails.filter((e) => e.isRead === false).length : 0,
      drafts: currentFolder === "drafts" ? emails.length : undefined,
    });
  }, [needsReplyCount, batchReadyCount, emails, currentFolder, setMailCounts]);

  const handleFolderChange = useCallback(
    (f: MailFolder) => {
      setCurrentFolder(f);
      messageCache.current.clear();
      wbFolderChange(f);
    },
    [wbFolderChange],
  );

  const handleEmailDropOnFolder = useCallback(
    async (emailId: string, folder: MailFolder) => {
      try {
        await moveOutlookMessage(emailId, folder);
        moveOut(emailId);
      } catch (e) {
        setStatusNote(e instanceof Error ? e.message : "Move failed");
      }
    },
    [moveOut],
  );

  useEffect(() => {
    setOnEmailDropOnCourse((emailId, courseId) => handleAssignCourse(emailId, courseId));
    setOnEmailDropOnTag((emailId, tag) => toggleEmailTag(emailId, tag));
    setOnEmailDropOnFolder((emailId, folder) => void handleEmailDropOnFolder(emailId, folder));
    return () => {
      setOnEmailDropOnCourse(null);
      setOnEmailDropOnTag(null);
      setOnEmailDropOnFolder(null);
    };
  }, [
    handleAssignCourse,
    toggleEmailTag,
    handleEmailDropOnFolder,
    setOnEmailDropOnCourse,
    setOnEmailDropOnTag,
    setOnEmailDropOnFolder,
  ]);

  const handleArchive = useCallback(
    async (id: string) => {
      try {
        await moveOutlookMessage(id, "archive");
        moveOut(id);
      } catch (e) {
        setStatusNote(e instanceof Error ? e.message : "Archive failed");
      }
    },
    [moveOut],
  );

  const handleJunk = useCallback(
    async (id: string) => {
      try {
        await moveOutlookMessage(id, "junkemail");
        moveOut(id);
      } catch (e) {
        setStatusNote(e instanceof Error ? e.message : "Move to junk failed");
      }
    },
    [moveOut],
  );

  const handleMarkRead = useCallback(
    async (id: string, options?: { silent?: boolean }) => {
      const preview =
        messageCache.current.get(id) ??
        emails.find((e) => e.id === id) ??
        (selected?.id === id ? selected : null);
      if (preview?.isRead === true) return;
      if (markReadInFlight.current.has(id)) return;

      markReadInFlight.current.add(id);

      setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, isRead: true } : e)));
      const cached = messageCache.current.get(id);
      if (cached) messageCache.current.set(id, { ...cached, isRead: true });
      setSelected((prev) => (prev && prev.id === id ? { ...prev, isRead: true } : prev));

      try {
        await patchOutlookMessageRead(id, true);
      } catch (e) {
        setEmails((prev) => prev.map((em) => (em.id === id ? { ...em, isRead: false } : em)));
        const revertCached = messageCache.current.get(id);
        if (revertCached) messageCache.current.set(id, { ...revertCached, isRead: false });
        setSelected((prev) => (prev && prev.id === id ? { ...prev, isRead: false } : prev));
        const msg = e instanceof Error ? e.message : "Mark as read failed";
        if (options?.silent) setStatusMessage(msg);
        else setStatusNote(msg);
      } finally {
        markReadInFlight.current.delete(id);
      }
    },
    [emails, selected, setStatusMessage],
  );

  const tryAutoMarkRead = useCallback(
    (email: Email | null | undefined) => {
      if (!email || email.isRead !== false) return;
      void handleMarkRead(email.id, { silent: true });
    },
    [handleMarkRead],
  );

  useEffect(() => {
    if (!selectedId) return;
    const cached = messageCache.current.get(selectedId);
    const preview = emails.find((e) => e.id === selectedId);
    const candidate = cached ?? preview ?? (selected?.id === selectedId ? selected : null);
    if (candidate && candidate.isRead === false) {
      tryAutoMarkRead(candidate);
    }
  }, [selectedId, selected, emails, tryAutoMarkRead]);

  const handleBulkDelete = useCallback(async () => {
    const ids = [...selectedEmailIds];
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} message${ids.length > 1 ? "s" : ""}? They will move to Deleted Items.`)) {
      return;
    }
    const results = await Promise.allSettled(ids.map((id) => deleteOutlookMessage(id)));
    const deleted = new Set(ids.filter((_, i) => results[i].status === "fulfilled"));
    deleted.forEach((id) => {
      messageCache.current.delete(id);
      threadCache.current.delete(id);
    });
    setEmails((prev) => prev.filter((e) => !deleted.has(e.id)));
    setSelectedId((cur) => (cur && deleted.has(cur) ? null : cur));
    setSelectedEmailIds(new Set());
    if (deleted.size < ids.length) {
      setStatusNote(`Deleted ${deleted.size} of ${ids.length} messages.`);
    }
  }, [selectedEmailIds]);

  async function getThreadForEmail(email: Email): Promise<OutlookThread | null> {
    const cached = threadCache.current.get(email.id);
    if (cached) return cached;
    try {
      const thread = await fetchOutlookThread(email.id);
      threadCache.current.set(email.id, thread);
      return thread;
    } catch {
      return null;
    }
  }

  async function ensureEmail(email: Email): Promise<Email> {
    const cached = messageCache.current.get(email.id);
    if (cached?.bodyHtml || cached?.body) return cached;
    if (email.body) return email;
    const full = await fetchOutlookMessage(email.id);
    messageCache.current.set(full.id, full);
    return full;
  }

  async function onSummarize() {
    if (!selected) return;
    if (!isProOrPremium()) {
      setSummaryError("Summarize requires Pro or Premium — upgrade under Pricing.");
      return;
    }
    setSummarizing(true);
    setSummaryError(null);
    try {
      const full = await ensureEmail(selected);
      const thread = selectedThread ?? (await getThreadForEmail(full));
      const target = replyTargetForEmail(full, thread);
      const result = await summarizeEmail(full.body || full.preview, full.subject, {
        name: target.name,
        email: target.email.includes("@") ? target.email : full.fromAddress,
      }, {
        threadMessages: thread?.messages,
        professorName: getUserDisplayName(),
      });
      setSummary(result);
      setSummaryVisible(true);
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : "Summarize failed");
      setSummary(null);
      setSummaryVisible(false);
    } finally {
      setSummarizing(false);
    }
  }

  function openReply() {
    const email = selected ?? (selectedId ? emails.find((e) => e.id === selectedId) : null);
    if (!email) {
      setStatusMessage("Select a message to reply");
      window.setTimeout(() => setStatusMessage(null), 2500);
      return;
    }
    const target = replyTargetForEmail(email, selectedThread);
    setReplyTo(target.email.includes("@") ? target.email : email.fromAddress || email.from);
    const subj = selectedThread?.subject ?? email.subject;
    setReplySubject(subj.startsWith("Re:") ? subj : `Re: ${subj}`);
    setReplyBody("");
    setStatusNote(null);
    setReplyOpen(true);
  }

  function openReplyAll() {
    if (!selected) return;
    const addresses = new Set<string>();
    const primary = replyTargetForEmail(selected, selectedThread);
    if (primary.email.includes("@")) addresses.add(primary.email);
    if (selectedThread?.messages) {
      for (const msg of selectedThread.messages) {
        if (msg.fromAddress?.includes("@")) addresses.add(msg.fromAddress);
        msg.toAddresses?.forEach((addr) => {
          if (addr.includes("@")) addresses.add(addr);
        });
      }
    } else if (selected.fromAddress?.includes("@")) {
      addresses.add(selected.fromAddress);
    }
    setReplyTo([...addresses].join("; "));
    const subj = selectedThread?.subject ?? selected.subject;
    setReplySubject(subj.startsWith("Re:") ? subj : `Re: ${subj}`);
    setReplyBody("");
    setStatusNote(null);
    setReplyOpen(true);
  }

  function openForward() {
    if (!selected) return;
    const subj = selectedThread?.subject ?? selected.subject;
    setReplyTo("");
    setReplySubject(subj.startsWith("Fwd:") ? subj : `Fwd: ${subj}`);
    const original = selected.body?.trim() || selected.preview?.trim() || "";
    setReplyBody(
      `\n\n---------- Forwarded message ----------\nFrom: ${selected.from}\nSubject: ${subj}\n\n${original}`,
    );
    setStatusNote(null);
    setReplyOpen(true);
  }

  async function draftReplyForEmail(
    email: Email,
    options: { tailorPerRecipient?: boolean; replyInstructions?: string } = {},
  ) {
    const full = await ensureEmail(email);
    const thread = await getThreadForEmail(full);
    const target = replyTargetForEmail(full, thread);
    const courseId = emailCourses[email.id] || sidebarCourseId || GENERAL_COURSE_ID;
    const instructions = options.replyInstructions?.trim() || replyInstructions.trim() || undefined;
    return generateReply({
      emailContent: full.body || full.preview,
      subject: thread?.subject ?? full.subject,
      courseId,
      studentName: target.name,
      studentEmail: target.email.includes("@") ? target.email : full.fromAddress,
      professorName: getUserDisplayName(),
      replyInstructions: instructions,
      tailorPerRecipient: options.tailorPerRecipient ?? false,
      threadMessages: thread?.messages,
    });
  }

  function handleBulkDraft() {
    const targetEmails = selectedEmailIds.size > 0 ? filtered.filter((e) => selectedEmailIds.has(e.id)) : filtered;
    if (targetEmails.length === 0) return;

    const sharedNotes = window.prompt(
      "Optional instructions for all replies (each email will still be personalized to that student):",
      replyInstructions.trim(),
    );
    if (sharedNotes === null) return;
    const bulkInstructions = sharedNotes.trim();

    setBulkDraftingProgress({ total: targetEmails.length, completed: 0 });

    const newDrafts = { ...bulkDrafts };
    for (const email of targetEmails) {
      newDrafts[email.id] = { body: newDrafts[email.id]?.body || "", generating: true, status: "Personalizing…" };
    }
    setBulkDrafts(newDrafts);

    void (async () => {
      for (const email of targetEmails) {
        try {
          const full = await ensureEmail(email);
          const thread = await getThreadForEmail(full);
          const target = replyTargetForEmail(full, thread);
          const result = await draftReplyForEmail(email, {
            tailorPerRecipient: true,
            replyInstructions: bulkInstructions || undefined,
          });
          setBulkDrafts((prev) => ({
            ...prev,
            [email.id]: {
              body: result.draft,
              to: target.email.includes("@") ? target.email : full.fromAddress || full.from,
              generating: false,
              status: "Draft ready (personalized).",
            },
          }));
        } catch {
          setBulkDrafts((prev) => ({
            ...prev,
            [email.id]: {
              body: prev[email.id]?.body || "",
              generating: false,
              status: "Failed to generate.",
            },
          }));
        } finally {
          setBulkDraftingProgress((prev) => {
            if (!prev) return null;
            const next = { ...prev, completed: prev.completed + 1 };
            if (next.completed === next.total) {
              setTimeout(() => setBulkDraftingProgress(null), 1500);
            }
            return next;
          });
        }
      }
    })();
  }

  async function handleSendDraft(emailId: string) {
    const draft = bulkDrafts[emailId];
    if (!draft || !draft.body) return;
    const full = await ensureEmail(emails.find(e => e.id === emailId)!);
    const thread = await getThreadForEmail(full);
    const target = replyTargetForEmail(full, thread);
    const subj = thread?.subject ?? full.subject;
    setBulkDrafts(prev => ({ ...prev, [emailId]: { ...draft, generating: true, status: "Sending..." } }));
    try {
      await sendOutlookMail({
        to: target.email.includes("@") ? target.email : full.fromAddress || full.from,
        subject: subj.startsWith("Re:") ? subj : `Re: ${subj}`,
        body: draft.body,
      });
      setBulkDrafts(prev => {
        const next = { ...prev };
        delete next[emailId];
        return next;
      });
    } catch (e) {
      setBulkDrafts(prev => ({ ...prev, [emailId]: { ...draft, generating: false, status: "Failed to send." } }));
    }
  }

  async function handleRegenerateDraft(emailId: string) {
    const email = emails.find((e) => e.id === emailId);
    if (!email) return;
    setBulkDrafts((prev) => ({
      ...prev,
      [emailId]: { ...prev[emailId], body: prev[emailId]?.body || "", generating: true, status: "Personalizing…" },
    }));
    try {
      const result = await draftReplyForEmail(email, { tailorPerRecipient: true });
      setBulkDrafts((prev) => ({
        ...prev,
        [emailId]: { body: result.draft, generating: false, status: "Draft ready (personalized)." },
      }));
    } catch {
      setBulkDrafts((prev) => ({
        ...prev,
        [emailId]: { body: prev[emailId]?.body || "", generating: false, status: "Failed to generate." },
      }));
    }
  }

  async function onDraftForEmail() {
    if (!selected) return;
    if (!replyCourseId) return;

    setGenerating(true);
    setStatusNote(null);
    try {
      const full = await ensureEmail(selected);
      const thread = selectedThread ?? (await getThreadForEmail(full));
      const target = replyTargetForEmail(full, thread);
      const result = await generateReply({
        emailContent: full.body || full.preview,
        subject: thread?.subject ?? full.subject,
        courseId: replyCourseId,
        studentName: target.name,
        studentEmail: target.email.includes("@") ? target.email : full.fromAddress,
        professorName: getUserDisplayName(),
        replyInstructions: replyInstructions.trim() || undefined,
        threadMessages: thread?.messages,
      });
      setReplyBody(result.draft);

      let note =
        replyCourseId === GENERAL_COURSE_ID
          ? "Draft ready (general reply)."
          : result.contextUsed
            ? `Draft used ${result.chunksUsed} sections from ${result.courseName}.`
            : `No indexed materials for ${result.courseName}.`;

      if (replyInstructions.trim()) {
        try {
          const meeting = await scheduleMeetingFromInstructions({
            replyInstructions: replyInstructions.trim(),
            studentEmail: target.email.includes("@") ? target.email : full.fromAddress,
            studentName: studentFirstName(target.name),
            emailSubject: thread?.subject ?? full.subject,
            courseName: result.courseName,
          });
          if (meeting.scheduled) note += ` ${meeting.message}`;
          else if (meeting.message) note += ` (${meeting.message})`;
        } catch (meetingErr) {
          note += ` (Calendar: ${meetingErr instanceof Error ? meetingErr.message : "failed"})`;
        }
      }
      setStatusNote(note);
    } catch (e) {
      setStatusNote(e instanceof Error ? e.message : "Draft failed");
    } finally {
      setGenerating(false);
    }
  }

  async function onSend() {
    if (!replyTo || !replySubject || !replyBody) {
      setStatusNote("Fill in draft, recipient, and subject before sending.");
      return;
    }
    setSending(true);
    try {
      await sendOutlookMail({ to: replyTo, subject: replySubject, body: replyBody });
      setStatusNote("Email sent successfully.");
      setReplyOpen(false);
    } catch (e) {
      setStatusNote(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (sidebarCourseId) setReplyCourseId(sidebarCourseId);
  }, [sidebarCourseId]);

  useEffect(() => {
    registerCompose(() => setReplyOpen(true));
    registerBulkCompose(() => handleBulkDraft());
    registerOpenAssistant(() => setAssistantOpen((open) => !open));
    return () => {
      registerCompose(null);
      registerBulkCompose(null);
      registerOpenAssistant(null);
    };
  }, [registerCompose, registerBulkCompose, registerOpenAssistant, setAssistantOpen, handleBulkDraft]);

  useMailKeyboard({
    emails: filtered,
    selectedId,
    onSelect: selectEmail,
    onCompose: () => setReplyOpen(true),
    onReply: openReply,
    onReplyAll: openReplyAll,
    onForward: openForward,
    onFlag: () => selectedId && toggleStar(selectedId),
    onArchive: () => selectedId && handleArchive(selectedId),
    onJunk: () => selectedId && handleJunk(selectedId),
    onMarkRead: () => selectedId && handleMarkRead(selectedId),
    onSummarize: () => void onSummarize(),
    onFolderChange: handleFolderChange,
    onToggleAssistant: () => setAssistantOpen((open) => !open),
    onToggleSearch: toggleSearchFocus,
    onDelete: () => selectedId && void handleDeleteEmail(selectedId),
    onShowShortcuts: () => setShortcutsOpen((v) => !v),
    searchRef,
    enabled: !replyOpen && !shortcutsOpen && !emailyOpen,
  });

  const handlePriorityFilter = useCallback((priority: PriorityTag) => {
    toggleInboxFilter(priority);
    setFiltersExpanded(true);
  }, [toggleInboxFilter]);

  const gridCols = narrow ? "0px minmax(0, 1fr)" : "380px minmax(0, 1fr)";

  return (
    <div
      ref={shellRef}
      tabIndex={-1}
      className="mail-app h-full w-full overflow-hidden bg-incuria-canvas text-incuria-ink outline-none"
      aria-label="Mail workbench"
    >
      <div
        className="grid h-full transition-[grid-template-columns] duration-200 ease-out"
        style={{ gridTemplateColumns: gridCols }}
      >
        <div className={`min-w-0 overflow-hidden ${narrow ? "hidden" : ""}`}>
          <MailPaneTransition paneKey={`${activeSpecial}-${currentFolder}`}>
            {activeSpecial === "home" ? (
              <HomePanel
                emails={emails}
                clusters={clusters}
                courses={courses}
                loading={loading}
                displayName={getUserDisplayName()}
                onSelectEmail={selectEmail}
                showCoachMark={(location.state as { showCoachMark?: boolean } | null)?.showCoachMark === true}
                onDismissCoachMark={() => navigate(location.pathname, { replace: true, state: {} })}
              />
            ) : (
              <MailListPanel
                title={listTitle}
                onCompose={() => setReplyOpen(true)}
                emails={filtered}
                selectedId={selectedId}
                loading={loading}
                error={error}
                onSelect={selectEmail}
                selectedEmailIds={selectedEmailIds}
                onToggleSelection={(id) => {
                  setSelectedEmailIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  });
                }}
                onToggleAll={() => {
                  if (selectedEmailIds.size === filtered.length && filtered.length > 0) {
                    setSelectedEmailIds(new Set());
                  } else {
                    setSelectedEmailIds(new Set(filtered.map((e) => e.id)));
                  }
                }}
                onDeleteSelected={() => void handleBulkDelete()}
                filtersExpanded={filtersExpanded}
                onToggleFilters={() => setFiltersExpanded((v) => !v)}
                activeFilters={inboxFilters}
                onToggleFilter={toggleInboxFilter}
                onClearFilters={() => setInboxFilters(new Set())}
                onPriorityClick={handlePriorityFilter}
                batchClusterSizes={batchClusterSizes}
              />
            )}
          </MailPaneTransition>
        </div>

        <div className="min-w-0 overflow-hidden">
          <MailDetailPanel
            email={selected}
            folderLabel={listTitle}
            threadMessageCount={selectedThread?.messages.length}
            loading={emailLoading}
            error={emailLoadError}
            summary={summary}
            summaryVisible={summaryVisible}
            summaryError={summaryError}
            summarizing={summarizing}
            generating={generating}
            starred={selected ? starredIds.has(selected.id) : false}
            search={search}
            onSearchChange={setSearch}
            searchRef={searchRef}
            onSummarize={() => void onSummarize()}
            onReply={openReply}
            onReplyAll={openReplyAll}
            onForward={openForward}
            onArchive={() => selected && handleArchive(selected.id)}
            onJunk={() => selected && handleJunk(selected.id)}
            onToggleStar={() => selected && toggleStar(selected.id)}
            onMarkRead={() => selected && handleMarkRead(selected.id)}
            onDelete={() => selected && void handleDeleteEmail(selected.id)}
            onDismissSummary={() => setSummaryVisible(false)}
            tags={tags}
            emailTags={selected ? (emailTags[selected.id] || []) : []}
            onToggleTag={(tag) => selected && toggleEmailTag(selected.id, tag)}
            onAddTag={handleAddTag}
            onTagClick={(tag) => setSelectedTag(tag)}
            courses={courses}
            emailCourseId={selected ? (emailCourses[selected.id] || null) : null}
            onAssignCourse={(courseId) => selected && handleAssignCourse(selected.id, courseId)}
            draftData={selected ? bulkDrafts[selected.id] : undefined}
            onUpdateDraft={(updates) => selected && setBulkDrafts((prev) => ({ ...prev, [selected.id]: { ...prev[selected.id], ...updates } }))}
            onSendDraft={() => selected && handleSendDraft(selected.id)}
            onRegenerateDraft={() => selected && handleRegenerateDraft(selected.id)}
            draftSourceLabel={
              selected && emailCourses[selected.id]
                ? `${courses.find((c) => c.id === emailCourses[selected.id])?.name ?? "Course"} · your materials`
                : undefined
            }
          />
        </div>
      </div>

      <EmailyAIPanel
        open={emailyOpen}
        onClose={() => setAssistantOpen(false)}
        inboxContext={emailyInboxContext}
      />

      <ShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <ReplyComposer
        open={replyOpen}
        onClose={() => setReplyOpen(false)}
        replyTo={replyTo}
        replySubject={replySubject}
        replyBody={replyBody}
        onReplyToChange={setReplyTo}
        onReplySubjectChange={setReplySubject}
        onReplyBodyChange={setReplyBody}
        replyInstructions={replyInstructions}
        onReplyInstructionsChange={setReplyInstructions}
        courses={courses}
        coursesLoading={coursesLoading}
        coursesError={null}
        onRetryCourses={() => void refreshCourses()}
        courseId={replyCourseId}
        onCourseChange={setReplyCourseId}
        onGenerate={() => void onDraftForEmail()}
        onSend={() => void onSend()}
        generating={generating}
        sending={sending}
        statusNote={statusNote}
      />
    </div>
  );
}


