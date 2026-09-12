export type SubscriptionTier = "free" | "pro" | "premium";

export type EmailBodyContentType = "html" | "text";

export type EmailThreadMessage = {
  id: string;
  date: string;
  fromName: string;
  fromAddress?: string;
  toAddresses: string[];
  toNames: string[];
  body: string;
  isFromInstructor: boolean;
};

export type OutlookThread = {
  subject: string;
  conversationId?: string;
  messages: EmailThreadMessage[];
  suggestedReplyTo: string | null;
  suggestedReplyToName: string | null;
};

export type Email = {
  id: string;
  from: string;
  fromAddress?: string;
  subject: string;
  /** Plain text for search, AI, and text-only messages */
  body: string;
  /** Original HTML body when the message was sent as HTML */
  bodyHtml?: string;
  bodyContentType?: EmailBodyContentType;
  preview: string;
  date: string;
  toAddresses?: string[];
  urgency?: "low" | "medium" | "high";
  isRead?: boolean;
  hasAttachments?: boolean;
};

export type Course = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  trainedAt?: string;
};

export type CourseDocument = {
  id: string;
  courseId: string;
  filename: string;
  text: string;
  kind: "syllabus" | "lecture" | "note";
  createdAt: string;
};

export type EmailSummary = {
  tldr: string;
  keyPoints: string[];
  urgency: "low" | "medium" | "high";
  actionRequired?: string;
};

export type MailFolder =
  | "inbox"
  | "sentitems"
  | "drafts"
  | "junkemail"
  | "deleteditems"
  | "archive";

/** Incuria "special" smart views layered over Outlook folders. */
export type MailSpecial = "home" | "needs-reply" | "batch-ready";

/** The active center-pane view: either a smart special or a raw Outlook folder. */
export type MailView =
  | { kind: "special"; special: MailSpecial }
  | { kind: "folder"; folder: MailFolder };

/** Special course id: OpenAI only, no Pinecone RAG */
export const GENERAL_COURSE_ID = "general";
