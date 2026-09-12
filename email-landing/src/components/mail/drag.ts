/** MIME type for dragging email rows onto sidebar targets. */
export const EMAIL_DRAG_MIME = "application/x-incuria-email";

export function emailDragPayload(emailId: string): string {
  return JSON.stringify({ id: emailId });
}

export function readEmailDragId(dt: DataTransfer): string | null {
  const raw = dt.getData(EMAIL_DRAG_MIME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { id?: string };
    return parsed.id ?? null;
  } catch {
    return null;
  }
}
