import type {
  Course,
  CourseDocument,
  Email,
  EmailSummary,
  EmailThreadMessage,
  MailFolder,
  OutlookThread,
} from "../types";
import { clearTokens, getAccessToken, isMicrosoftAuthError } from "./auth";
import { API_URL, MICROSOFT_REDIRECT_URI } from "./config";
import type { StoredTokenResponse } from "./auth";
import { htmlToPlainText } from "./htmlToText";
import { tierHeaders } from "./subscription";

export type GraphMessage = {
  id: string;
  subject?: string;
  bodyPreview?: string;
  body?: { contentType?: string; content?: string };
  receivedDateTime?: string;
  sentDateTime?: string;
  isRead?: boolean;
  from?: { emailAddress?: { name?: string; address?: string } };
  toRecipients?: Array<{ emailAddress?: { name?: string; address?: string } }>;
};

export type GraphMessagesResponse = { value: GraphMessage[] };

const inFlightCodeExchange = new Map<string, Promise<MicrosoftAuthResponse>>();
const completedCodeExchange = new Map<string, MicrosoftAuthResponse>();

function authHeaders(token?: string | null): HeadersInit {
  const t = token ?? getAccessToken();
  if (!t) throw new Error("Not signed in. Please sign in again.");
  return { Authorization: `Bearer ${t}`, Accept: "application/json" };
}

function courseHeaders(): HeadersInit {
  return { ...authHeaders(), ...tierHeaders() };
}

function courseJsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json", ...courseHeaders() };
}

function throwIfCourseAuthError(status: number, message: string): void {
  if (status === 401 && /missing authorization/i.test(message)) {
    throw new Error("Sign in with your university email first, then try again.");
  }
  if (status === 401) handleGraphAuthFailure(message);
}

function handleGraphAuthFailure(message: string): never {
  if (isMicrosoftAuthError(message)) {
    clearTokens();
    throw new Error(
      "Your session is invalid or expired. Sign out, then sign in again.",
    );
  }
  throw new Error(message);
}

function isHtmlBody(raw: string, contentType?: string): boolean {
  if (contentType?.toLowerCase() === "html") return true;
  return raw.includes("<") && /<[a-z][\s\S]*>/i.test(raw);
}

export function graphToEmail(m: GraphMessage): Email {
  const fromAddr = m.from?.emailAddress;
  const fromName = fromAddr?.name ?? fromAddr?.address ?? "Unknown";
  const rawBody = m.body?.content ?? m.bodyPreview ?? "";
  const html = isHtmlBody(rawBody, m.body?.contentType);
  const body = html ? htmlToPlainText(rawBody) : rawBody;
  const previewSource = m.bodyPreview ?? body;
  return {
    id: m.id,
    from: fromName,
    fromAddress: fromAddr?.address,
    subject: m.subject ?? "(No subject)",
    body,
    bodyHtml: html ? rawBody : undefined,
    bodyContentType: html ? "html" : "text",
    preview: htmlToPlainText(previewSource).slice(0, 160),
    date: m.receivedDateTime ?? m.sentDateTime ?? new Date().toISOString(),
    toAddresses: m.toRecipients?.map((r) => r.emailAddress?.address).filter(Boolean) as string[],
    isRead: m.isRead,
    hasAttachments: (m as { hasAttachments?: boolean }).hasAttachments,
  };
}

export type MicrosoftAuthResponse = StoredTokenResponse & {
  user?: {
    id: string;
    displayName: string;
    email?: string;
    plan?: "free" | "pro" | "premium";
    isNewUser?: boolean;
    onboardingCompleted?: boolean;
  };
};

async function readJsonResponse<T>(res: Response): Promise<T & { error?: string }> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      `Cannot reach the API at ${API_URL}. Start the backend (for example PORT=5173 npm run dev) and set VITE_API_URL in email-landing/.env if needed.`,
    );
  }
  try {
    return JSON.parse(text) as T & { error?: string };
  } catch {
    throw new Error(
      `The API at ${API_URL} returned an invalid response. Ensure VITE_API_URL points to the Express backend, not the Vite dev server.`,
    );
  }
}

export async function exchangeMicrosoftCode(code: string): Promise<MicrosoftAuthResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/microsoft`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...tierHeaders() },
      body: JSON.stringify({ code, redirect_uri: MICROSOFT_REDIRECT_URI }),
    });
  } catch {
    throw new Error(
      `Cannot reach the API at ${API_URL}. Start the backend (for example PORT=5173 npm run dev) and set VITE_API_URL in email-landing/.env if needed.`,
    );
  }
  const data = await readJsonResponse<MicrosoftAuthResponse>(res);
  if (!res.ok) throw new Error(data.error ?? `Authentication failed (${res.status})`);
  return data;
}

export function exchangeMicrosoftCodeOnce(code: string): Promise<MicrosoftAuthResponse> {
  const done = completedCodeExchange.get(code);
  if (done) return Promise.resolve(done);
  const pending = inFlightCodeExchange.get(code);
  if (pending) return pending;
  const promise = exchangeMicrosoftCode(code)
    .then((tokens) => {
      completedCodeExchange.set(code, tokens);
      inFlightCodeExchange.delete(code);
      return tokens;
    })
    .catch((err) => {
      inFlightCodeExchange.delete(code);
      throw err;
    });
  inFlightCodeExchange.set(code, promise);
  return promise;
}

export function friendlyOAuthError(message: string): string {
  if (/invalid response|cannot reach the api|VITE_API_URL/i.test(message)) {
    return message;
  }
  if (/AADSTS70000|invalid_grant|code.*expired|already been redeemed/i.test(message)) {
    return "This sign-in link was already used or has expired. Go home and sign in again.";
  }
  if (/redirect_uri|AADSTS50011/i.test(message)) {
    return "Sign-in redirect URI mismatch. Ensure server redirect URI and the app callback URL match (for example http://localhost:3000/auth/callback).";
  }
  if (isMicrosoftAuthError(message)) {
    return "Sign-in failed. Clear your session, sign out, then try again.";
  }
  return message;
}

export async function fetchOutlookMessages(
  folder: MailFolder = "inbox",
  top = 30,
): Promise<Email[]> {
  const res = await fetch(`${API_URL}/api/outlook/messages?folder=${folder}&top=${top}`, {
    headers: authHeaders(),
  });
  const data = (await res.json()) as GraphMessagesResponse & { error?: string };
  if (!res.ok) handleGraphAuthFailure(data.error ?? `Failed to load messages (${res.status})`);
  return (data.value ?? []).map(graphToEmail);
}

export async function fetchOutlookMessage(id: string): Promise<Email> {
  const res = await fetch(`${API_URL}/api/outlook/messages/${id}`, { headers: authHeaders() });
  const data = (await res.json()) as GraphMessage & { error?: string };
  if (!res.ok) handleGraphAuthFailure(data.error ?? `Failed to load message (${res.status})`);
  return graphToEmail(data);
}

export async function moveOutlookMessage(id: string, folder: MailFolder): Promise<void> {
  const res = await fetch(`${API_URL}/api/outlook/messages/${id}/move`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) handleGraphAuthFailure(data.error ?? `Failed to move message (${res.status})`);
}

export async function patchOutlookMessageRead(id: string, isRead: boolean): Promise<void> {
  const res = await fetch(`${API_URL}/api/outlook/messages/${id}`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ isRead }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) handleGraphAuthFailure(data.error ?? `Failed to update message (${res.status})`);
}

export async function deleteOutlookMessage(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/outlook/messages/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    handleGraphAuthFailure(data.error ?? `Failed to delete message (${res.status})`);
  }
}

export async function fetchOutlookThread(messageId: string): Promise<OutlookThread> {
  const res = await fetch(`${API_URL}/api/outlook/messages/${messageId}/thread`, {
    headers: authHeaders(),
  });
  const data = (await res.json()) as OutlookThread & { error?: string };
  if (!res.ok) handleGraphAuthFailure(data.error ?? `Failed to load thread (${res.status})`);
  return data;
}

export type { EmailThreadMessage, OutlookThread };

export async function sendOutlookMail(input: {
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  const res = await fetch(`${API_URL}/api/outlook/send`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) handleGraphAuthFailure(data.error ?? `Send failed (${res.status})`);
}

export async function summarizeEmail(
  content: string,
  subject?: string,
  student?: { name?: string; email?: string },
  options?: {
    threadMessages?: EmailThreadMessage[];
    professorName?: string;
  },
): Promise<EmailSummary> {
  const res = await fetch(`${API_URL}/ai/summarizeEmail`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...tierHeaders() },
    body: JSON.stringify({
      content,
      subject,
      studentName: student?.name,
      studentEmail: student?.email,
      threadMessages: options?.threadMessages,
      professorName: options?.professorName,
    }),
  });
  const data = (await res.json()) as EmailSummary & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Summarize failed");
  return data;
}

export async function fetchOutlookProfile(): Promise<{
  id: string;
  displayName: string;
  email?: string;
  plan?: "free" | "pro" | "premium";
  isNewUser?: boolean;
  onboardingCompleted?: boolean;
}> {
  const res = await fetch(`${API_URL}/api/outlook/me`, { headers: courseHeaders() });
  const data = (await res.json()) as {
    id: string;
    displayName: string;
    email?: string;
    plan?: "free" | "pro" | "premium";
    isNewUser?: boolean;
    onboardingCompleted?: boolean;
    error?: string;
  };
  if (!res.ok) handleGraphAuthFailure(data.error ?? "Failed to load profile");
  return data;
}

export async function completeOnboardingOnServer(): Promise<{ onboardingCompleted: boolean }> {
  const res = await fetch(`${API_URL}/api/users/me/onboarding/complete`, {
    method: "POST",
    headers: courseJsonHeaders(),
  });
  const data = (await res.json()) as { onboardingCompleted?: boolean; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Failed to complete onboarding");
  return { onboardingCompleted: data.onboardingCompleted === true };
}

export type ScheduleMeetingResult = {
  scheduled: boolean;
  message: string;
  eventId?: string;
  webLink?: string;
  start?: string;
  end?: string;
  subject?: string;
  error?: string;
};

export async function scheduleMeetingFromInstructions(input: {
  replyInstructions: string;
  studentEmail?: string;
  studentName?: string;
  emailSubject?: string;
  courseName?: string;
}): Promise<ScheduleMeetingResult> {
  const res = await fetch(`${API_URL}/api/outlook/schedule-meeting`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...courseHeaders() },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as ScheduleMeetingResult;
  if (!res.ok) {
    throwIfCourseAuthError(res.status, data.error ?? data.message ?? "");
    throw new Error(data.error ?? data.message ?? "Schedule meeting failed");
  }
  return data;
}

export async function generateReply(input: {
  emailContent: string;
  subject: string;
  courseId: string;
  studentName?: string;
  studentEmail?: string;
  professorName?: string;
  replyInstructions?: string;
  /** Bulk mode: backend prompts for a unique reply per student message. */
  tailorPerRecipient?: boolean;
  threadMessages?: EmailThreadMessage[];
}): Promise<{ draft: string; contextUsed: boolean; chunksUsed: number; courseName: string }> {
  const res = await fetch(`${API_URL}/ai/generateReply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as {
    draft: string;
    contextUsed: boolean;
    chunksUsed: number;
    courseName: string;
    error?: string;
  };
  if (!res.ok) throw new Error(data.error ?? "Generate reply failed");
  return data;
}

export type EmailyChatMessage = { role: "user" | "assistant"; content: string };

export type EmailyInboxContext = {
  folder: string;
  searchQuery?: string;
  selectedTag?: string | null;
  selectedCourseName?: string | null;
  totalVisible: number;
  emails: {
    id: string;
    from: string;
    subject: string;
    date: string;
    preview: string;
    urgency?: string;
    tags?: string[];
  }[];
  selectedEmail?: {
    subject: string;
    from: string;
    date: string;
    body: string;
    threadMessages?: EmailThreadMessage[];
  } | null;
  courseNames?: string[];
};

export async function emailyChat(
  message: string,
  history: EmailyChatMessage[],
  inboxContext: EmailyInboxContext,
): Promise<{ reply: string }> {
  const res = await fetch(`${API_URL}/ai/emailyChat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, inboxContext }),
  });
  const data = (await res.json()) as { reply: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "emailyAI request failed");
  return data;
}

export async function listCourses(): Promise<Course[]> {
  const res = await fetch(`${API_URL}/api/courses`, { headers: courseHeaders() });
  const data = (await res.json()) as { courses: Course[]; error?: string };
  if (!res.ok) {
    throwIfCourseAuthError(res.status, data.error ?? "");
    throw new Error(data.error ?? "Failed to list courses");
  }
  return data.courses;
}

export async function getCourse(id: string): Promise<{ course: Course; documents: CourseDocument[] }> {
  const res = await fetch(`${API_URL}/api/courses/${id}`, { headers: courseHeaders() });
  const data = (await res.json()) as { course: Course; documents: CourseDocument[]; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Failed to load course");
  return data;
}

export async function updateCourse(
  courseId: string,
  input: { name?: string; description?: string },
): Promise<Course> {
  const res = await fetch(`${API_URL}/api/courses/${courseId}`, {
    method: "PATCH",
    headers: courseJsonHeaders(),
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { course: Course; error?: string };
  if (!res.ok) {
    throwIfCourseAuthError(res.status, data.error ?? "");
    throw new Error(data.error ?? "Failed to update course");
  }
  return data.course;
}

export async function createCourse(name: string, description: string): Promise<Course> {
  const res = await fetch(`${API_URL}/api/courses`, {
    method: "POST",
    headers: courseJsonHeaders(),
    body: JSON.stringify({ name, description }),
  });
  const data = (await res.json()) as { course: Course; error?: string };
  if (!res.ok) {
    throwIfCourseAuthError(res.status, data.error ?? "");
    throw new Error(data.error ?? "Failed to create course");
  }
  return data.course;
}

export async function uploadCourseDocument(
  courseId: string,
  form: FormData,
): Promise<CourseDocument> {
  const res = await fetch(`${API_URL}/api/courses/${courseId}/documents`, {
    method: "POST",
    headers: courseHeaders(),
    body: form,
  });
  const data = (await res.json()) as { document: CourseDocument; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.document;
}

export async function deleteCourseDocument(courseId: string, documentId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/courses/${courseId}/documents/${documentId}`, {
    method: "DELETE",
    headers: courseHeaders(),
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Delete failed");
}

export async function trainCourse(courseId: string): Promise<{ chunksIndexed: number }> {
  const res = await fetch(`${API_URL}/api/courses/${courseId}/train`, {
    method: "POST",
    headers: courseHeaders(),
  });
  const data = (await res.json()) as { chunksIndexed: number; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Train failed");
  return { chunksIndexed: data.chunksIndexed };
}
