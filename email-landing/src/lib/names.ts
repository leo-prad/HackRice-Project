/** First name from Graph display name or "Name <email@...>" */
export function studentFirstName(from: string): string {
  const cleaned = from.replace(/<[^>]+>/g, "").replace(/"/g, "").trim();
  if (!cleaned) return "Student";
  const first = cleaned.split(/\s+/)[0];
  return first || "Student";
}
