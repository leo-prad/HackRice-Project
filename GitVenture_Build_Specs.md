# Build Spec: GitVenture

A Chrome extension plus web dashboard that turns GitHub issues into XP-bearing quests.

Read this entire document before writing code. Every decision below is already made. Do not substitute alternative libraries, databases, or architectures. If something in here is ambiguous, choose the simplest option that satisfies the MVP checklist and note the choice in a comment.

---

## 1. What we are building

Developers open GitHub and see a plain list of issues with no sense of what is worth their time. We inject a game layer directly onto github.com. Every issue gets an XP value assigned by an LLM, users claim issues, earn XP on completion, and climb a global leaderboard.

The extension is the product. The dashboard is the trophy case.

**One-line pitch:** an XP layer that follows you onto GitHub.

### Core loop

1. User browses GitHub issues
2. Extension injects an XP badge next to every issue title
3. User opens an issue, sees a quest card with the XP value and a Claim button
4. User claims the issue, writes the fix, links their PR
5. Full XP awarded the moment they link the PR
6. Global leaderboard updates

### Non-goals

Do not build any of these. They are explicitly out of scope.

- Mobile app
- Teams, orgs, or private leaderboards
- Payment, monetization, or real currency
- Issue creation or editing
- Chat, comments, or social feed
- Email notifications
- Firefox or Safari support (Chrome only)

---

## 2. Tech stack

Locked. Do not deviate.

| Layer | Choice |
|---|---|
| Language | TypeScript everywhere |
| Backend | Node 20 + Express |
| Database | PostgreSQL (Supabase free tier, hosted) |
| DB client | `pg` (node-postgres), raw SQL, no ORM |
| LLM | Gemini API, model `gemini-3.8-flash` |
| Gemini SDK | `@google/genai` |
| Extension | Chrome Manifest V3, vanilla TS, no framework |
| Dashboard | React 18 + Vite + Tailwind |
| Auth | GitHub OAuth (server-side), JWT sessions |
| Bundler (extension) | Vite in library mode, or esbuild |

No ORM. No Next.js. No Prisma. No `better-sqlite3` (it has native build problems on Windows). Raw SQL in a single migration file is faster to debug under time pressure.

---

## 3. Repo structure

Monorepo, npm workspaces.

```
gitventure/
├── package.json                 # workspaces root
├── .env.example
├── README.md
├── packages/
│   ├── shared/                  # types shared by all three packages
│   │   ├── package.json
│   │   └── src/
│   │       └── types.ts
│   ├── server/
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts         # express app entry
│   │       ├── db.ts            # pg pool + query helper
│   │       ├── migrations/
│   │       │   └── 001_init.sql
│   │       ├── auth/
│   │       │   ├── github.ts    # oauth flow
│   │       │   ├── jwt.ts
│   │       │   └── pairing.ts   # extension pairing codes
│   │       ├── routes/
│   │       │   ├── auth.ts
│   │       │   ├── issues.ts
│   │       │   ├── claims.ts
│   │       │   ├── users.ts
│   │       │   └── leaderboard.ts
│   │       ├── services/
│   │       │   ├── scoring.ts   # gemini call + cache
│   │       │   ├── github.ts    # github rest api client
│   │       │   └── xp.ts        # award / decay logic
│   │       └── jobs/
│   │           ├── pollMerges.ts
│   │           └── decay.ts
│   ├── extension/
│   │   ├── package.json
│   │   ├── manifest.json
│   │   └── src/
│   │       ├── content/
│   │       │   ├── index.ts     # entry, router, mutation observer
│   │       │   ├── issueList.ts # inject badges into list view
│   │       │   ├── issueDetail.ts # inject quest card
│   │       │   └── styles.css
│   │       ├── popup/
│   │       │   ├── popup.html
│   │       │   └── popup.ts
│   │       ├── background/
│   │       │   └── service-worker.ts
│   │       └── lib/
│   │           ├── api.ts       # fetch wrapper, auth header
│   │           └── storage.ts
│   └── dashboard/
│       ├── package.json
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── pages/
│           │   ├── Login.tsx
│           │   ├── Profile.tsx
│           │   ├── Leaderboard.tsx
│           │   └── Pair.tsx     # shows extension pairing code
│           └── lib/api.ts
```

---

## 4. Data model

Single migration file, `packages/server/src/migrations/001_init.sql`.

```sql
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  github_id       BIGINT UNIQUE NOT NULL,
  github_login    TEXT NOT NULL,
  avatar_url      TEXT,
  github_token    TEXT NOT NULL,       -- encrypted at rest in prod, plaintext ok for hackathon
  total_xp        INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The XP cache. One row per issue, written once, never updated.
CREATE TABLE issue_scores (
  issue_node_id   TEXT PRIMARY KEY,    -- GitHub GraphQL node_id, globally unique
  issue_url       TEXT NOT NULL,
  repo_full_name  TEXT NOT NULL,
  repo_owner_id   BIGINT NOT NULL,     -- for the self-farming penalty
  issue_number    INTEGER NOT NULL,
  title           TEXT NOT NULL,
  xp              INTEGER NOT NULL,
  days_open       INTEGER NOT NULL,
  scored_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_issue_scores_url ON issue_scores(issue_url);

CREATE TABLE claims (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  issue_node_id   TEXT NOT NULL REFERENCES issue_scores(issue_node_id),
  status          TEXT NOT NULL DEFAULT 'claimed',
                  -- claimed | submitted | merged | abandoned
  pr_url          TEXT,
  pr_number       INTEGER,
  pr_repo         TEXT,
  xp_awarded      INTEGER NOT NULL DEFAULT 0,
  claimed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at    TIMESTAMPTZ,
  merged_at       TIMESTAMPTZ,
  UNIQUE (user_id, issue_node_id)
);

CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_user ON claims(user_id);

-- Append-only ledger. total_xp on users is a denormalized sum of this.
CREATE TABLE xp_events (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  claim_id        INTEGER REFERENCES claims(id),
  delta           INTEGER NOT NULL,
  kind            TEXT NOT NULL,   -- claim_complete | pr_merged | decay | bonus
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_xp_events_user ON xp_events(user_id, created_at DESC);

-- Extension pairing codes, short lived
CREATE TABLE pairing_codes (
  code            TEXT PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  consumed        BOOLEAN NOT NULL DEFAULT false,
  expires_at      TIMESTAMPTZ NOT NULL
);
```

### The one invariant that matters

**An issue's XP is written exactly once and never changes.** Not when the issue body is edited. Not when new comments arrive. Not on a new Gemini model version. The first user to view an issue triggers the score; every other user on the planet reads that same cached row.

This is what makes the game fair, and it is also the pitch line: *the bounty is posted before anyone claims it.*

Because the value is cached, it does not matter that the LLM is non-deterministic. This is important with Gemini 3.x specifically, where `temperature`, `top_p`, and `top_k` are deprecated and cannot be used to pin sampling. Caching is the only consistency mechanism available, and it is sufficient.

Handle the concurrent-write case at the database, not in application code:

```sql
INSERT INTO issue_scores (issue_node_id, issue_url, repo_full_name, repo_owner_id,
                          issue_number, title, xp, days_open)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
ON CONFLICT (issue_node_id) DO NOTHING
RETURNING *;
```

If that returns zero rows, another request won the race. `SELECT` the existing row and return that one. First write wins, everybody sees the same number.

---

## 5. Scoring service

File: `packages/server/src/services/scoring.ts`

### Flow

```
scoreIssue(issueUrl, viewerGithubToken):
  1. parse owner/repo/number from issueUrl
  2. SELECT from issue_scores WHERE issue_url = issueUrl
     -> if hit, return immediately (this is the 99% path)
  3. GET issue from GitHub REST API
  4. build the Gemini prompt from issue data
  5. call Gemini, get { xp }
  6. snap xp to the nearest ladder rung
  7. INSERT ... ON CONFLICT DO NOTHING RETURNING
  8. if no row returned, SELECT and return the winner's row
```

### The XP ladder

Gemini returns a raw integer. Snap it to the nearest value in this array before writing:

```ts
const XP_LADDER = [200, 500, 1000, 2000, 3500, 5000, 8000, 12000, 20000];
```

`4,237 XP` reads as a bug. `3,500 XP` reads as designed. Games use round numbers for a reason.

### Gemini call

Model: `gemini-3.8-flash`. Set thinking effort to **low**. This is a fast classification call, not a reasoning task, and 3.8 will otherwise burn tokens verifying its own work.

Do not set `temperature`, `top_p`, or `top_k`. They are deprecated in Gemini 3.x and will error or be ignored.

Use structured output so the response never needs prose parsing. Verify the exact config parameter name against the current Gemini API docs at `ai.google.dev/gemini-api/docs` before writing the call, since the Interactions API surface is new. The response shape we want:

```json
{ "xp": 3500 }
```

`xp` is a positive integer. That is the entire output. Do not ask the model for an explanation, a difficulty label, a confidence score, or anything else. Every extra field is latency, cost, and a surface for the model to contradict itself on.

### System prompt

```
You assign XP bounties to open source GitHub issues for a developer game.

You will be given one issue. Return a single XP number representing how much
effort and skill closing it requires.

Calibrate against these anchors:

  200 XP    fix a typo in documentation
  500 XP    add a missing null check, under 10 lines changed
  1,000 XP  add a config option with an obvious implementation
  2,000 XP  write unit tests for an existing untested function
  3,500 XP  fix a bug that requires reading 2 to 3 files to understand
  5,000 XP  implement a small feature with a new public API surface
  8,000 XP  fix a race condition or memory leak with no reliable repro
  12,000 XP refactor a subsystem while preserving behavior
  20,000 XP architectural change spanning multiple subsystems

Weigh these factors:
  - How much of the codebase must be understood before a fix is possible
  - Whether the problem is well specified or requires investigation
  - Whether the fix is mechanical or requires design judgment
  - How much of the issue thread is unresolved disagreement
  - Repository size and review bar (a large widely used project has a
    higher bar than a small personal project)
  - How long the issue has been open without resolution

Do not reward verbosity. A long thread of bikeshedding is not a hard problem.
Do not penalize a short issue body if the underlying work is genuinely hard.

Return only {"xp": <integer>}. No explanation, no label, no other fields.
```

### User prompt payload

Interpolate these fields:

```
Repository: {repo_full_name} ({stars} stars, {open_issues} open issues)
Issue #{number}: {title}
Labels: {labels joined by comma, or "none"}
Opened: {days_open} days ago
Comments: {comment_count}
Already has a linked PR: {yes|no}

Body:
{body, truncated to 4000 characters}

Top comments:
{up to 3 comments, each truncated to 500 characters}
```

### Ownership penalty

Not part of the cached score. Applied at award time, not at score time, because it depends on who is claiming.

```ts
const multiplier = (claim.userGithubId === score.repoOwnerId) ? 0.25 : 1.0;
```

The badge always shows the full XP. The award is reduced. This is intentional, and it is worth demoing.

---

## 6. API contract

Base URL from `API_BASE_URL`. All authenticated routes take `Authorization: Bearer <jwt>`.

### Auth

```
GET  /auth/github
     -> 302 redirect to GitHub OAuth consent

GET  /auth/github/callback?code=...
     -> exchanges code, upserts user, issues JWT
     -> 302 redirect to DASHBOARD_URL/#token=<jwt>

POST /auth/pair/create          [auth required]
     -> { code: "QUEST-4F2A", expiresInSeconds: 300 }

POST /auth/pair/redeem
     body: { code: string }
     -> { token: string, user: User }
     -> marks code consumed; a code works exactly once
```

### Issues

```
POST /issues/score
     body: { issueUrls: string[] }    // max 30 per request
     -> { scores: IssueScore[] }
     Cache hits return instantly. Misses are scored in parallel with a
     concurrency cap of 5. Always returns whatever it has; a failed score
     is omitted from the array rather than failing the whole request.

GET  /issues/:nodeId
     -> { score: IssueScore, claim: Claim | null }
```

### Claims

```
POST /claims                     [auth]
     body: { issueNodeId: string }
     -> { claim: Claim }
     409 if this user already has an active claim on this issue.

POST /claims/:id/submit          [auth]
     body: { prUrl: string }
     -> { claim: Claim, xpAwarded: number }
     Validates that the PR author login matches the claiming user.
     Awards the full ladder XP times the ownership multiplier.
     Sets status = 'submitted'.

POST /claims/:id/abandon         [auth]
     -> { claim: Claim }

GET  /claims/mine                [auth]
     -> { claims: Claim[] }
```

### Users and leaderboard

```
GET  /users/me                   [auth]
     -> { user, level, xpIntoLevel, xpForNextLevel, claims, recentEvents }

GET  /leaderboard?limit=50
     -> { entries: [{ rank, login, avatarUrl, totalXp, level }] }
```

### Level curve

```ts
// XP required to reach level n
const levelThreshold = (n: number) => Math.floor(1000 * Math.pow(n, 1.6));
// L1 = 1000, L2 = 3031, L5 = 13797, L10 = 39810, L20 = 120000
```

---

## 7. Chrome extension

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "GitVenture",
  "version": "0.1.0",
  "description": "Turn GitHub issues into XP quests.",
  "permissions": ["storage"],
  "host_permissions": ["https://github.com/*", "<API_ORIGIN>/*"],
  "action": { "default_popup": "popup/popup.html" },
  "background": { "service_worker": "background/service-worker.js" },
  "content_scripts": [
    {
      "matches": ["https://github.com/*"],
      "js": ["content/index.js"],
      "css": ["content/styles.css"],
      "run_at": "document_idle"
    }
  ]
}
```

### The single most important technical detail

**GitHub navigates with Turbo. The page swaps without a reload.** A content script that runs once on `DOMContentLoaded` will work on first page load and then silently do nothing for the rest of the session. This will look like a mysterious intermittent bug and will cost hours if not handled up front.

Required approach in `content/index.ts`:

```ts
function route() {
  const path = location.pathname;
  if (/^\/[^/]+\/[^/]+\/issues\/?$/.test(path)) mountIssueList();
  else if (/^\/[^/]+\/[^/]+\/issues\/\d+$/.test(path)) mountIssueDetail();
  else unmountAll();
}

// 1. run on load
route();

// 2. re-run on Turbo navigation
document.addEventListener('turbo:load', route);

// 3. belt and braces: watch the DOM for content swaps
const observer = new MutationObserver(debounce(route, 150));
observer.observe(document.body, { childList: true, subtree: true });
```

Guard every injection with an idempotency check. Mark injected nodes with `data-gitventure="1"` and skip anything already marked, or the MutationObserver will inject duplicates infinitely.

### Selector strategy

GitHub changes its class names frequently. **Do not select on CSS classes.** Find issues by parsing anchor hrefs:

```ts
const links = Array.from(document.querySelectorAll('a[href]'))
  .filter(a => /^\/[^/]+\/[^/]+\/issues\/\d+$/.test(new URL((a as HTMLAnchorElement).href).pathname));
```

This survives redesigns. Class-based selectors do not.

### Issue list view

For each issue link found, inject an XP chip immediately after the title text.

```html
<span class="ql-chip" data-gitventure="1">
  <span class="ql-chip-xp">3,500</span>
  <span class="ql-chip-label">XP</span>
</span>
```

Chip color is derived from the ladder position, low to high: slate, teal, blue, violet, amber, orange, red. Only the rung index maps to color, nothing else.

Batch all URLs on the page into a single `POST /issues/score` call. Do not make one request per issue.

Render a skeleton chip with a shimmer while the request is in flight, then fill it. Never leave a blank gap.

### Issue detail view

Inject a fixed-position quest card in the bottom right. 320px wide, above GitHub's own UI, `z-index: 9999`.

Card contents, top to bottom:
1. XP value, very large, tabular-nums. This is the whole card. Give it room.
2. Repo name and issue number, small, muted
3. "Open N days" counter
4. Primary button, state dependent:
   - Not claimed: **Claim quest**
   - Claimed: **Link your PR** (opens an inline input)
   - Submitted: **Complete** with a checkmark and the XP earned
5. Footer: current level and XP bar

With no explanation text, the number has to carry the card visually. Make it big, give it the ladder color as a glow, and let the rest of the card be quiet around it.

The card is collapsible to a small floating orb. Persist the collapsed state in `chrome.storage.local`.

### XP gain animation

**Not optional.** This is the moment a judge remembers.

On any XP award, play a full-screen overlay: the number counts up from 0 to the awarded amount over 800ms with an ease-out curve, particles burst outward, and the level bar fills. If the award crosses a level threshold, hold for an extra 600ms and show a LEVEL UP banner.

Use CSS transforms and `requestAnimationFrame`. No animation library.

### Popup

Small, four sections:
- Avatar, login, level, XP bar
- Active claims (title, XP, status)
- Top 5 leaderboard with the user's own row pinned if outside the top 5
- Footer link to the dashboard

If not paired, the popup shows a single input for the pairing code and a link to the dashboard.

---

## 8. Auth flow

The extension does not perform OAuth. That avoids all redirect-URI and extension-ID configuration, which is a time sink.

```
1. User clicks "Sign in" in the popup
   -> opens DASHBOARD_URL/pair in a new tab

2. Dashboard sends them through GET /auth/github
   -> GitHub consent
   -> callback issues a JWT
   -> dashboard stores the JWT

3. Dashboard calls POST /auth/pair/create
   -> displays a 9-character code, e.g. QUEST-4F2A, valid 5 minutes

4. User pastes the code into the extension popup

5. Extension calls POST /auth/pair/redeem
   -> receives its own JWT
   -> stores it in chrome.storage.local
```

Requested OAuth scopes: `read:user`, `public_repo`. Nothing more. Say this out loud in the demo.

Store the user's GitHub token server-side and use it for API calls on their behalf. This raises the rate limit from 60/hour (unauthenticated) to 5,000/hour, which matters the moment more than one person uses the extension.

---

## 9. Merge detection

**Not part of the MVP.** XP is awarded in full at PR submit, so nothing is waiting on a merge. Build this only if steps 1 through 10 are done.

When you do build it, it is cosmetic status tracking rather than a payout gate. File: `packages/server/src/jobs/pollMerges.ts`, on `setInterval` every 60 seconds inside the server process. No external scheduler, no queue.

```
for each claim WHERE status = 'submitted':
  GET /repos/{pr_repo}/pulls/{pr_number}
  if response.merged === true:
    set status = 'merged', merged_at = now()
    no XP change, it was already paid in full
  if response.state === 'closed' && !merged:
    set status = 'abandoned'
    XP is not clawed back
```

Do not build a GitHub App with webhooks. Registration, signature verification, and installation flow will cost an hour and buy nothing for a demo.

---

## 10. Anti-cheat

A judge will ask. Implement all four.

1. **PR author must match the claimant.** On `POST /claims/:id/submit`, fetch the PR and compare `pull.user.id` to the claiming user's `github_id`. Reject on mismatch.
2. **Self-owned repos pay 25%.** Compare `issue_scores.repo_owner_id` to the claimant's `github_id`.
3. **XP requires a real PR, not a self-report.** There is no "mark complete" button. The only path to XP is submitting a PR URL that GitHub confirms exists and is authored by the claimant.
4. **Scores are immutable.** An issue cannot be re-scored, so nobody can edit an issue body to inflate its bounty after the fact.

---

## 11. Environment variables

`.env.example`:

```
# Server
PORT=8787
DATABASE_URL=postgresql://...
JWT_SECRET=
API_BASE_URL=http://localhost:8787
DASHBOARD_URL=http://127.0.0.1:5174

# GitHub OAuth app
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_OAUTH_CALLBACK=http://localhost:8787/auth/github/callback

# Gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash

# Feature flags
ENABLE_DECAY=false
DECAY_PERCENT_PER_DAY=2
```

---

## 12. Build order

Build in this sequence. Each step must run before starting the next. Do not build ahead.

| # | Step | Done when |
|---|---|---|
| 1 | Workspaces, shared types, `.env`, Supabase project, run `001_init.sql` | `SELECT 1` works from `db.ts` |
| 2 | GitHub OAuth + JWT + `/users/me` | curl with a real token returns a user |
| 3 | `scoring.ts` and `POST /issues/score` | curl a real issue URL twice, second call is a cache hit and returns the identical number |
| 4 | Extension scaffold, content script, Turbo router | `console.log` fires on every GitHub navigation, no duplicates |
| 5 | XP chips on the issue list | Badges appear on a real repo's issue page |
| 6 | Quest card on issue detail | Card renders with the real cached XP value |
| 7 | Pairing flow + claim endpoint + claim button | Claim persists and survives a page reload |
| 8 | PR submit, author validation, full XP award | XP lands in the ledger and `total_xp` matches the sum of `xp_events` |
| 9 | Dashboard: leaderboard + profile | Deployed and loadable from another laptop |
| 10 | **XP gain animation and level-up banner** | It feels good, not just correct |

Step 10 is not polish. It is the demo.

### If time runs short

Cut in this order: decay job, then cosmetics, then the dashboard profile page (keep the leaderboard). Never cut the animation or the quest card.

---

## 13. Demo requirements

### Seed repo

Create a public repo named `gitventure-demo` with 8 issues, deliberately spanning the ladder so the XP range is visible:

| Issue | Intended rung |
|---|---|
| Typo in README | 200 |
| Missing null check in parser | 500 |
| Add a `--verbose` flag | 1,000 |
| No tests for `formatDuration()` | 2,000 |
| Wrong timezone offset in log output | 3,500 |
| Add pluggable storage backend | 5,000 |
| Intermittent deadlock under concurrent writes | 8,000 |
| Migrate the event system off globals | 12,000 |

If every issue scores the same, the whole premise looks fake. The spread is the proof.

### Pre-seed the cache

Run scoring against all 8 demo issues the night before and leave the rows in the database. Hackathon wifi fails during demos, and a spinning loader kills a pitch.

### Also score one live

During the demo, open a real issue on a well-known repo and let it score live. That two-second badge appearance is what proves nothing is hardcoded. Wrap the call with a 6-second timeout and a cached fallback.

### Include a self-owned issue

Claim one issue in `gitventure-demo` on stage to show the 25% ownership penalty firing. Five seconds of demo time, and it preempts the obvious "can't you just farm your own repo" question.

---

## 14. Stretch features

Only after step 10 is complete and the demo runs end to end.

- **Split payout.** Change the submit award to 50% and let `pollMerges` (section 9) pay the other 50% on merge. This is the more honest model long term, since an unmerged PR did not actually close the issue. It is a stretch feature only because it makes the MVP demo harder: nothing merges during a hackathon, so the demo would end on a half-filled bar.
- **Daily XP decay.** Cron at 00:00 UTC, `total_xp -= floor(total_xp * 0.02)` for users with no `xp_event` in 24 hours. Floor at the current level's threshold so nobody de-levels.
- **Staleness bonus.** Multiply awards by `1 + min(days_open / 365, 1) * 0.5`. Pitch line: we pay a bounty on forgotten issues.
- **Cosmetics.** `cosmetics` and `unlocks` tables, avatar frames and badges purchasable with XP, rendered on the leaderboard.
- **Streaks.** Consecutive days with at least one XP event.

---

## 15. Code quality bar

This is a hackathon build, so:

- Prefer working over elegant
- No test suite. Manual verification against the build-order table is the test.
- Error handling: every external call (GitHub, Gemini) wrapped in try/catch, log and degrade rather than crash. A failed score means no badge, not a broken page.
- No `any` in shared types. Elsewhere it is acceptable.
- Comment only where the reason is non-obvious. The Turbo observer and the `ON CONFLICT` race handling both need a comment explaining why.
