const headers = (token?: string) => ({
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function githubFetch<T>(path: string, token?: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, { headers: headers(token) });
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${await response.text()}`);
  return response.json() as Promise<T>;
}

export function parseIssueUrl(raw: string) {
  const url = new URL(raw);
  if (url.hostname !== "github.com") throw new Error("Only github.com issue URLs are supported");
  const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/issues\/(\d+)\/?$/);
  if (!match) throw new Error("Invalid GitHub issue URL");
  return { owner: match[1], repo: match[2], number: Number(match[3]), canonical: `https://github.com/${match[1]}/${match[2]}/issues/${Number(match[3])}` };
}

export function parsePullUrl(raw: string) {
  const url = new URL(raw);
  if (url.hostname !== "github.com") throw new Error("Only github.com pull requests are supported");
  const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/);
  if (!match) throw new Error("Invalid GitHub pull request URL");
  return { owner: match[1], repo: match[2], number: Number(match[3]), canonical: `https://github.com/${match[1]}/${match[2]}/pull/${Number(match[3])}` };
}

export interface GitHubIssue {
  node_id: string; html_url: string; number: number; title: string; body: string | null;
  created_at: string; comments: number; labels: Array<{ name?: string } | string>;
  pull_request?: unknown;
}
export interface GitHubRepo { full_name: string; stargazers_count: number; open_issues_count: number; private: boolean; owner: { id: number; type?: string } }
export interface GitHubComment { body: string | null }
export interface GitHubPull { user: { id: number; login: string }; merged: boolean; state: string }
export interface GitHubReview { state: string }

export async function getIssueBundle(owner: string, repo: string, number: number, token?: string) {
  const [issue, repository, comments] = await Promise.all([
    githubFetch<GitHubIssue>(`/repos/${owner}/${repo}/issues/${number}`, token),
    githubFetch<GitHubRepo>(`/repos/${owner}/${repo}`, token),
    githubFetch<GitHubComment[]>(`/repos/${owner}/${repo}/issues/${number}/comments?per_page=3`, token),
  ]);
  if (issue.pull_request) throw new Error("Pull request URLs cannot be scored as issues");
  return { issue, repository, comments };
}

export const getPull = (owner: string, repo: string, number: number, token?: string) =>
  githubFetch<GitHubPull>(`/repos/${owner}/${repo}/pulls/${number}`, token);

export const getPullReviews = (owner: string, repo: string, number: number, token?: string) =>
  githubFetch<GitHubReview[]>(`/repos/${owner}/${repo}/pulls/${number}/reviews?per_page=100`, token);

// Cheap contributor probe: ask for two, so we can tell "single-contributor"
// from "many" without paginating the full list. Anonymous view for public
// repos, authenticated for private.
export async function contributorCount(owner: string, repo: string, token?: string): Promise<number> {
  try {
    const list = await githubFetch<Array<unknown>>(`/repos/${owner}/${repo}/contributors?per_page=2&anon=1`, token);
    return list.length;
  } catch { return 0; }
}
