import type { Email, OutlookThread } from "../types";

export function replyTargetForEmail(
  email: Email,
  thread: OutlookThread | null | undefined,
): { email: string; name: string } {
  if (thread?.suggestedReplyTo) {
    return {
      email: thread.suggestedReplyTo,
      name: thread.suggestedReplyToName ?? thread.suggestedReplyTo,
    };
  }
  return {
    email: email.fromAddress || email.from,
    name: email.from,
  };
}
