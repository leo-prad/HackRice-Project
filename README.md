# GitQuest

GitQuest is an AI game engine for open source. It turns live GitHub issues into RPG-style quests: structured difficulty, canonical XP, a skill tree, and a next-quest curriculum. Tutorials teach syntax. LeetCode teaches algorithms. GitQuest helps developers learn how to work on real software.

**Level up by solving real software problems.**

## What is included

- Chrome Manifest V3 extension that turns GitHub issue lists into a rarity-graded Quest Board
- Issue Quest Card with skills, objectives, claim, and merge-verified completion
- Full-screen Quest Complete animation: XP, level-up, skill-up, achievements, rank
- Express API with GitHub OAuth, JWT pairing, Gemini structured analysis, and PostgreSQL
- Deterministic difficulty and XP (`difficulty × 100`, rarity tiers, `scoring_version`)
- Maintainer verification via GitHub API — XP unlocks only when a PR is approved or merged
- Skill tree, 5 achievements, global leaderboard, and Find My Next Quest
- Dashboard onboarding: pick a growth goal, then land on three recommended issues

## Repo layout

```text
HackRice-Project/
├── .env.example          # Template only — copy to .env at repo root
├── .env                  # Local secrets (gitignored) — single source of truth
├── packages/
│   ├── server/           # Backend: Express API, OAuth, DB, Gemini scoring
│   ├── dashboard/        # Frontend: React web app
│   ├── extension/        # Frontend: Chrome extension
│   └── shared/           # Shared TypeScript types
└── README.md
```

Use **one** `.env` at the repo root. Do not create `packages/server/.env`. Never commit secrets into `README.md`.

## Git branches

| Branch | Use for |
| --- | --- |
| `main` | Stable shared default. Merge backend/frontend here when ready. |
| `backend` | API, database, auth, scoring (`packages/server`, `packages/shared`). |
| `frontend` | Dashboard and Chrome extension (`packages/dashboard`, `packages/extension`). |

```powershell
git checkout backend    # server / DB work
git checkout frontend   # UI / extension work
git checkout main       # integrate and release
```

Open PRs from `backend` or `frontend` into `main`.

## Quick start

Requirements: Node 20+, a shared Postgres database (Supabase works), a GitHub OAuth app, and a Gemini API key.

1. Install packages.

   ```powershell
   npm install
   ```

2. Copy `.env.example` to `.env` at the **repo root** and fill it in (see [Environment variables](#environment-variables)).

3. Create the database tables (only needed once per database; skip if a teammate already migrated the shared Supabase project).

   ```powershell
   npm run migrate
   ```

4. Build the shared package, warm a demo Quest Board, then start the API and dashboard.

   ```powershell
   npm run build -w @questline/shared
   npm run seed
   npm run dev
   ```

5. Build the extension.

   ```powershell
   npm run build -w @questline/extension
   ```

6. Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `packages/extension/dist`.

The dashboard runs at `http://localhost:5173` and the API at `http://localhost:8787`.

## Environment variables

Create **one** `.env` in the **repo root** from `.env.example` (not under `packages/server`). The server loads this file automatically. Collaborators should use the **same shared values** for the database, GitHub OAuth app, JWT secret, and Gemini key — you do **not** need personal Supabase API keys (`anon` / `service_role`). Those are unused.

| Variable | Required | What to put |
| --- | --- | --- |
| `PORT` | No | API port. Default `8787`. |
| `DATABASE_URL` | Yes | Supabase **Transaction pooler** Postgres URI (see below). |
| `JWT_SECRET` | Yes | Any long random string (team can share one). Example: `openssl rand -hex 32`. |
| `API_BASE_URL` | Local default | `http://localhost:8787` |
| `DASHBOARD_URL` | Local default | `http://localhost:5173` |
| `GITHUB_CLIENT_ID` | Yes | From the shared GitHub OAuth App. |
| `GITHUB_CLIENT_SECRET` | Yes | From the shared GitHub OAuth App. |
| `GITHUB_OAUTH_CALLBACK` | Local default | `http://localhost:8787/auth/github/callback` |
| `GEMINI_API_KEY` | Yes | From [Google AI Studio](https://aistudio.google.com/apikey). |
| `GEMINI_MODEL` | No | Default `gemini-3.8-flash`. |
| `ENABLE_DECAY` | No | `false` unless you want XP decay. |
| `DECAY_PERCENT_PER_DAY` | No | Used only when decay is enabled. |
| `DEMO_REPOS` | No | Comma-separated `owner/repo` worlds for Next Quest and `npm run seed`. Default demo set: Express, FastAPI, Prisma (3 worlds). |

### `DATABASE_URL` (Supabase)

Use the **pooler** connection string, not the direct `db.*.supabase.co` host. Many networks cannot resolve the direct host (IPv6-only), which makes `npm run migrate` fail with `ENOTFOUND`.

1. Open Supabase → **Project Settings → Database → Connection string**.
2. Choose **URI** and the **Transaction pooler** (port `6543`).
3. Paste it as `DATABASE_URL`. It should look like:

   ```text
   postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
   ```

You only need this Postgres URI. Do not put Supabase `anon` or `service_role` keys in `.env`.

### GitHub OAuth (`GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`)

Create one OAuth App at [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers) and share the Client ID and Client Secret with the team:

- Homepage URL: `http://localhost:5173`
- Authorization callback URL: `http://localhost:8787/auth/github/callback`
- Scopes requested by GitQuest: `read:user`, `repo` (required for private repository issues)

After signing in, open `/pair`, copy the one-time code, and paste it into the extension popup.

### Gemini (`GEMINI_API_KEY`)

Create an API key at [Google AI Studio](https://aistudio.google.com/apikey) and set `GEMINI_API_KEY`. Teammates can share one key for local development.

## Environment and deployment

For production, set `DASHBOARD_URL`, `API_BASE_URL`, and `GITHUB_OAUTH_CALLBACK` to the deployed origins. Set `VITE_API_BASE_URL` and `VITE_DASHBOARD_URL` while building the dashboard and extension. Add the production API origin to `packages/extension/public/manifest.json` before publishing the Chrome package.

SQL migrations live in `packages/server/src/migrations/` (`001_init.sql`, `002_gitquest.sql`) and work directly in the Supabase SQL editor.

## API

- `GET /health`
- `GET /auth/github`
- `POST /auth/pair/create`
- `POST /auth/pair/redeem`
- `POST /issues/score`
- `GET /issues/:nodeId`
- `POST /quests/recommend`
- `POST /claims`
- `POST /claims/:id/submit`
- `POST /claims/:id/abandon`
- `GET /claims/mine`
- `GET /claims/latest-completion`
- `GET /users/me`
- `PUT /users/me/goals` (saves goals and runs GitHub→Gemini character seeding)
- `GET /leaderboard`

AI produces structured analysis only. The backend computes XP and stores it forever. Claiming does not pay XP. Linking a PR you authored that references the issue parks the claim in review. XP unlocks once when a maintainer approves or merges that PR.

Onboarding imports GitHub experience into a starter skill tree (no `xp_events`). Find My Next Quest uses an AI Quest Matcher over the curated `DEMO_REPOS` worlds, with a deterministic fallback.

## Demo script

1. Sign in at `http://localhost:5173` and pick a growth goal.
2. Open **Find my first quest** or go to `/next`.
3. Open a seeded world, such as `https://github.com/expressjs/express/issues`. The list becomes a Quest Board.
4. Open a high-XP issue. Claim it from the Quest Card.
5. Open (or prepare) a PR that includes `Closes #<issue>` and is authored by the signed-in GitHub account.
6. Link the PR on the card — status becomes **In review** (no XP yet).
7. Approve or merge the PR as a maintainer, then refresh / reopen the card — Quest Complete fires and XP awards once.
8. Open `/complete` or **Find next quest**.

XP is awarded once and is idempotent.
