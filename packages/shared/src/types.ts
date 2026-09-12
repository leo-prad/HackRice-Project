export const XP_LADDER = [200, 500, 1000, 2000, 3500, 5000, 8000, 12000, 20000] as const;

export interface User {
  id: number;
  githubId: string;
  githubLogin: string;
  avatarUrl: string | null;
  totalXp: number;
  createdAt?: string;
}

export interface IssueScore {
  issueNodeId: string;
  issueUrl: string;
  repoFullName: string;
  repoOwnerId: string;
  issueNumber: number;
  title: string;
  xp: number;
  daysOpen: number;
  scoredAt: string;
}

export type ClaimStatus = "claimed" | "submitted" | "merged" | "abandoned" | "closed";

export interface Claim {
  id: number;
  userId: number;
  issueNodeId: string;
  status: ClaimStatus;
  prUrl: string | null;
  prNumber: number | null;
  prRepo: string | null;
  xpAwarded: number;
  claimedAt: string;
  submittedAt: string | null;
  mergedAt: string | null;
  score?: IssueScore;
}

export interface XpEvent {
  id: number;
  delta: number;
  kind: string;
  note: string | null;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  login: string;
  avatarUrl: string | null;
  totalXp: number;
  level: number;
}

export interface UserProfile {
  user: User;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  claims: Claim[];
  recentEvents: XpEvent[];
}

export const levelThreshold = (level: number): number =>
  Math.floor(1000 * Math.pow(Math.max(level, 1), 1.6));

export function levelProgress(totalXp: number) {
  let level = 0;
  while (levelThreshold(level + 1) <= totalXp) level += 1;
  const floor = level === 0 ? 0 : levelThreshold(level);
  const ceiling = levelThreshold(level + 1);
  return {
    level,
    xpIntoLevel: totalXp - floor,
    xpForNextLevel: ceiling - floor,
  };
}
