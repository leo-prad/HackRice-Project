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
  created_at: string; comments: number; state: string; labels: Array<{ name?: string } | string>;
  pull_request?: unknown;
}
export interface GitHubRepo {
  full_name: string; stargazers_count: number; open_issues_count: number;
  language: string | null; description: string | null; owner: { id: number; login: string };
  name?: string; html_url?: string; topics?: string[]; pushed_at?: string; default_branch?: string;
  fork?: boolean;
}

export interface GitHubViewerProfile {
  login: string;
  bio: string | null;
  public_repos: number;
  followers: number;
}

export interface GitHubExperience {
  login: string;
  bio: string | null;
  publicRepos: number;
  followers: number;
  languages: Array<{ name: string; count: number }>;
  repos: Array<{ fullName: string; language: string | null; description: string | null; stars: number; topics: string[] }>;
}

/** Signed-in player's recent repos + language histogram for the Gemini profile builder. */
export async function getViewerExperience(token: string): Promise<GitHubExperience> {
  const [viewer, repos] = await Promise.all([
    githubFetch<GitHubViewerProfile>("/user", token),
    githubFetch<GitHubRepo[]>("/user/repos?sort=pushed&per_page=30&affiliation=owner,collaborator", token),
  ]);

  const languageCounts = new Map<string, number>();
  const summarized = (repos ?? [])
    .filter((repo) => !repo.fork)
    .slice(0, 25)
    .map((repo) => {
      if (repo.language) languageCounts.set(repo.language, (languageCounts.get(repo.language) ?? 0) + 1);
      return {
        fullName: repo.full_name,
        language: repo.language,
        description: repo.description,
        stars: repo.stargazers_count,
        topics: repo.topics ?? [],
      };
    });

  const languages = Array.from(languageCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    login: viewer.login,
    bio: viewer.bio,
    publicRepos: viewer.public_repos,
    followers: viewer.followers,
    languages,
    repos: summarized,
  };
}

/** Fetch a raw file blob from a repo (capped). Returns null when the path is missing. */
export async function getRepoFile(owner: string, repo: string, path: string, token?: string, maxChars = 2500): Promise<string | null> {
  try {
    const raw = await githubFetch<{ content?: string; encoding?: string; type?: string }>(
      `/repos/${owner}/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}`,
      token,
    );
    if (raw.type && raw.type !== "file") return null;
    if (raw.content && raw.encoding === "base64") {
      return Buffer.from(raw.content, "base64").toString("utf8").slice(0, maxChars);
    }
  } catch { /* optional context */ }
  return null;
}

/** Shallow top-level tree listing for architectural context. */
export async function getRepoTopLevel(owner: string, repo: string, token?: string): Promise<string[]> {
  try {
    const meta = await githubFetch<{ default_branch: string }>(`/repos/${owner}/${repo}`, token);
    const tree = await githubFetch<{ tree: Array<{ path: string; type: string }> }>(
      `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(meta.default_branch)}`,
      token,
    );
    return (tree.tree ?? [])
      .filter((entry) => !entry.path.includes("/"))
      .slice(0, 40)
      .map((entry) => `${entry.type === "tree" ? "dir" : "file"}:${entry.path}`);
  } catch {
    return [];
  }
}
export interface GitHubComment { body: string | null }
export interface GitHubPull {
  number: number; html_url: string; title: string; body: string | null;
  user: { id: number; login: string }; merged: boolean; merged_at: string | null; state: string;
  base: { repo: { full_name: string } };
}

export const issueLabels = (issue: GitHubIssue): string[] =>
  issue.labels.map((label) => (typeof label === "string" ? label : label.name)).filter((name): name is string => Boolean(name));

interface RepoContext { repository: GitHubRepo; readme: string }

const REPO_CACHE_TTL_MS = 5 * 60 * 1000;
const repoCache = new Map<string, { at: number; value: Promise<RepoContext> }>();

/** Repo metadata plus a README slice, cached in-process so batch scoring stays inside GitHub rate limits. */
export function getRepoContext(owner: string, repo: string, token?: string): Promise<RepoContext> {
  const key = `${owner}/${repo}`.toLowerCase();
  const cached = repoCache.get(key);
  if (cached && Date.now() - cached.at < REPO_CACHE_TTL_MS) return cached.value;

  const value = (async () => {
    const repository = await githubFetch<GitHubRepo>(`/repos/${owner}/${repo}`, token);
    let readme = "";
    try {
      const raw = await githubFetch<{ content?: string; encoding?: string }>(`/repos/${owner}/${repo}/readme`, token);
      if (raw.content && raw.encoding === "base64") readme = Buffer.from(raw.content, "base64").toString("utf8").slice(0, 1200);
    } catch { /* Many repos have no README; architectural context is optional. */ }
    return { repository, readme };
  })();

  repoCache.set(key, { at: Date.now(), value });
  value.catch(() => repoCache.delete(key));
  return value;
}

export async function getIssueBundle(owner: string, repo: string, number: number, token?: string) {
  const [issue, context, comments] = await Promise.all([
    githubFetch<GitHubIssue>(`/repos/${owner}/${repo}/issues/${number}`, token),
    getRepoContext(owner, repo, token),
    githubFetch<GitHubComment[]>(`/repos/${owner}/${repo}/issues/${number}/comments?per_page=3`, token),
  ]);
  if (issue.pull_request) throw new Error("Pull request URLs cannot be scored as issues");

  const haystack = `${issue.title}\n${issue.body ?? ""}`;
  const pathHits = Array.from(
    haystack.matchAll(/(?:^|[\s`"'(])((?:[\w.-]+\/)+[\w.-]+\.[a-zA-Z0-9]{1,8})/g),
  )
    .map((match) => match[1])
    .filter((path) => !path.startsWith("http"))
    .slice(0, 3);

  const manifestCandidates = [
    "package.json",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
    "Gemfile",
    "composer.json",
  ];

  const [topLevel, ...fileLoads] = await Promise.all([
    getRepoTopLevel(owner, repo, token),
    ...[...new Set([...pathHits, ...manifestCandidates])].slice(0, 5).map(async (path) => {
      const content = await getRepoFile(owner, repo, path, token, pathHits.includes(path) ? 2500 : 1200);
      return content ? { path, content } : null;
    }),
  ]);

  const codeFiles = fileLoads.filter((entry): entry is { path: string; content: string } => Boolean(entry));
  // Prefer paths that look like tests when present in the issue body.
  const testFiles = codeFiles.filter((file) => /test|spec|__tests__/i.test(file.path));

  return {
    issue,
    repository: context.repository,
    readme: context.readme,
    comments,
    architecture: topLevel,
    codeFiles,
    testFiles,
  };
}

export const getPull = (owner: string, repo: string, number: number, token?: string) =>
  githubFetch<GitHubPull>(`/repos/${owner}/${repo}/pulls/${number}`, token);

export interface GitHubReview { state: string }

export const getPullReviews = (owner: string, repo: string, number: number, token?: string) =>
  githubFetch<GitHubReview[]>(`/repos/${owner}/${repo}/pulls/${number}/reviews?per_page=100`, token);

/** True when the PR title or body links the issue via `#12`, a closing keyword, or the full issue URL. */
export function pullReferencesIssue(pull: GitHubPull, owner: string, repo: string, number: number): boolean {
  const text = `${pull.title}\n${pull.body ?? ""}`;
  const fullUrl = new RegExp(`github\\.com/${owner}/${repo}/issues/${number}(?!\\d)`, "i");
  if (fullUrl.test(text)) return true;
  const crossRepo = new RegExp(`${owner}/${repo}#${number}(?!\\d)`, "i");
  if (crossRepo.test(text)) return true;
  const sameRepo = pull.base.repo.full_name.toLowerCase() === `${owner}/${repo}`.toLowerCase();
  return sameRepo && new RegExp(`(^|[^\\w/])#${number}(?!\\d)`).test(text);
}

export interface SearchedIssue {
  node_id: string; html_url: string; number: number; title: string;
  repository_url: string; labels: Array<{ name?: string } | string>; pull_request?: unknown;
}

/** GitHub issue search restricted to open issues, used to build Next Quest candidates. */
export async function searchIssues(query: string, perPage = 12, token?: string): Promise<SearchedIssue[]> {
  const q = `is:issue is:open ${query}`;
  const result = await githubFetch<{ items: SearchedIssue[] }>(
    `/search/issues?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=${perPage}`,
    token,
  );
  return (result.items ?? []).filter((item) => !item.pull_request);
}

export async function listRepoIssues(owner: string, repo: string, perPage = 10, token?: string): Promise<GitHubIssue[]> {
  const collected: GitHubIssue[] = [];
  for (let page = 1; page <= 3 && collected.length < perPage; page += 1) {
    const issues = await githubFetch<GitHubIssue[]>(
      `/repos/${owner}/${repo}/issues?state=open&per_page=30&page=${page}&sort=updated`,
      token,
    );
    collected.push(...issues.filter((issue) => !issue.pull_request));
    if (issues.length < 30) break;
  }
  return collected.slice(0, perPage);
}
