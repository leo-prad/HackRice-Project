import type { Email } from "../../types";

const AVATAR_COLORS = [
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-teal-100 text-teal-700",
  "bg-sky-100 text-sky-700",
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-fuchsia-100 text-fuchsia-700",
];

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function formatListDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
  }
  if (date >= startOfYesterday) return "Yesterday";

  const weekAgo = new Date(startOfToday);
  weekAgo.setDate(weekAgo.getDate() - 6);
  if (date >= weekAgo) {
    return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
  }

  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

export function formatDetailDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function truncatePreview(text: string, max = 72) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function unreadCount(emails: Email[]) {
  return emails.filter((e) => e.isRead === false).length;
}

export type PriorityTag = "Urgent" | "Student" | "Admin" | "Meeting";

const PRIORITY_RE: { tag: PriorityTag; re: RegExp }[] = [
  { tag: "Urgent", re: /\b(urgent|asap|emergency|immediately|deadline|critical|by (today|tonight|tomorrow))\b/i },
  { tag: "Meeting", re: /\b(meeting|appointment|office hours?|schedule|reschedule|zoom|calendar|invite|availab)/i },
  { tag: "Admin", re: /\b(invoice|payroll|policy|department|faculty|committee|hr|benefits|enrollment|registrar|compliance)\b/i },
  { tag: "Student", re: /\b(assignment|homework|grade|exam|midterm|final|quiz|extension|lecture|class|syllabus|professor|question about)\b/i },
];

/** Lightweight heuristic classification for the list-row priority pill. */
export function classifyPriority(email: Email): PriorityTag | null {
  const text = `${email.subject || ""} ${email.preview || email.body || ""}`;
  for (const { tag, re } of PRIORITY_RE) {
    if (re.test(text)) return tag;
  }
  if (/\.edu\b/i.test(email.fromAddress || email.from || "")) return "Student";
  return null;
}

export const PRIORITY_PILL: Record<PriorityTag, string> = {
  Urgent: "bg-mac-urgent-bg text-mac-urgent",
  Student: "bg-mac-student-bg text-mac-student",
  Admin: "bg-mac-admin-bg text-mac-admin",
  Meeting: "bg-mac-meeting-bg text-mac-meeting",
};

/** Normalize a subject for clustering: strip reply/forward prefixes + punctuation. */
export function normalizeSubject(subject: string): string {
  return subject
    .replace(/^(re|fwd|fw|aw)\s*:\s*/gi, "")
    .replace(/^(re|fwd|fw|aw)\s*:\s*/gi, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export type EmailCluster = { key: string; label: string; emails: Email[] };

/** Group emails by normalized subject; returns clusters of 2+ messages, largest first. */
export function clusterSimilarEmails(emails: Email[]): EmailCluster[] {
  const groups = new Map<string, Email[]>();
  for (const email of emails) {
    const key = normalizeSubject(email.subject || "");
    if (!key) continue;
    const existing = groups.get(key);
    if (existing) existing.push(email);
    else groups.set(key, [email]);
  }
  return [...groups.entries()]
    .filter(([, list]) => list.length >= 2)
    .map(([key, list]) => ({ key, label: list[0].subject || key, emails: list }))
    .sort((a, b) => b.emails.length - a.emails.length);
}
