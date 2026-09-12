export type PeriodKey = "day" | "week" | "month" | "year";

export const PERIODS: Record<
  PeriodKey,
  { before: Record<string, string>; after: Record<string, string> }
> = {
  day: {
    before: {
      totalTime: "2h 18m",
      emailsReplied: "9",
      avgPerEmail: "15m 20s",
      inboxSort: "38m",
      avgResponse: "3h 05m",
    },
    after: {
      totalTime: "52m",
      emailsReplied: "9",
      avgPerEmail: "5m 46s",
      inboxSort: "9m",
      avgResponse: "48m",
    },
  },
  week: {
    before: {
      totalTime: "14h 20m",
      emailsReplied: "62",
      avgPerEmail: "13m 50s",
      inboxSort: "4h 10m",
      avgResponse: "2h 40m",
    },
    after: {
      totalTime: "5h 05m",
      emailsReplied: "62",
      avgPerEmail: "4m 55s",
      inboxSort: "1h 02m",
      avgResponse: "52m",
    },
  },
  month: {
    before: {
      totalTime: "58h",
      emailsReplied: "248",
      avgPerEmail: "14m",
      inboxSort: "16h 30m",
      avgResponse: "2h 55m",
    },
    after: {
      totalTime: "21h 15m",
      emailsReplied: "248",
      avgPerEmail: "5m 08s",
      inboxSort: "4h 20m",
      avgResponse: "1h 05m",
    },
  },
  year: {
    before: {
      totalTime: "612h",
      emailsReplied: "2,840",
      avgPerEmail: "13m 45s",
      inboxSort: "168h",
      avgResponse: "2h 48m",
    },
    after: {
      totalTime: "218h",
      emailsReplied: "2,840",
      avgPerEmail: "4m 36s",
      inboxSort: "44h",
      avgResponse: "58m",
    },
  },
};

export const LABELS_BEFORE = [
  { key: "totalTime", text: "Total time spent" },
  { key: "emailsReplied", text: "Number of emails replied to" },
  { key: "avgPerEmail", text: "Avg time per email response" },
  { key: "inboxSort", text: "Time spent sorting inbox" },
  { key: "avgResponse", text: "Avg response time (before)" },
] as const;

export const LABELS_AFTER = [
  { key: "totalTime", text: "Total time spent" },
  { key: "emailsReplied", text: "Number of emails replied to" },
  { key: "avgPerEmail", text: "Avg time per email response" },
  { key: "inboxSort", text: "Time spent sorting inbox" },
  { key: "avgResponse", text: "Avg response time (after)" },
] as const;
