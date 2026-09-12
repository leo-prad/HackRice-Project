# ENV:
PORT=8787

DATABASE_URL=postgresql://postgres:[HackRice1201]@db.ueqevqwtnyobezugwief.supabase.co:5432/postgres

JWT_SECRET=b7710fd880d83cf1beb078b0a2ebc87776e346cc8307acdba63c49e5e4ce224a

API_BASE_URL=http://localhost:8787

DASHBOARD_URL=http://localhost:5173

# GitHub OAuth app
GITHUB_CLIENT_ID=Ov23liOJPT6bsBpfaN1U
GITHUB_CLIENT_SECRET=e5baf64e89e3bdb8902e8d068ba4c826cdfbe161
GITHUB_OAUTH_CALLBACK=http://localhost:8787/auth/github/callback
DASHBOARD_URL=http://127.0.0.1:5174

# Gemini
GEMINI_API_KEY=AIzaSyBfnOkZvUSjSdhebrykAir7QeYzdVxj71M
GEMINI_MODEL=gemini-3.8-flash

# Feature flags
ENABLE_DECAY=false
DECAY_PERCENT_PER_DAY=2

# Questline

Questline is a Chrome extension and web dashboard that turns GitHub issues into XP quests. The first viewer triggers an AI score, PostgreSQL stores that score forever, and every player sees the same bounty.

## What is included

- Chrome Manifest V3 extension with GitHub Turbo navigation support
- Batched issue-list XP badges with loading shimmer and ladder colors
- Collapsible issue quest card with claim and PR submission flows
- Full-screen XP count-up, particle burst, and level-up animation
- Express API with GitHub OAuth, JWT sessions, one-time pairing codes, and raw PostgreSQL
- Gemini `gemini-3.8-flash` structured scoring with low thinking effort
- PR author validation, 25% self-owned repo payout, and immutable scores
- React and Tailwind dashboard with profile, quest log, and global leaderboard

## Quick start

Requirements: Node 20+, PostgreSQL, a GitHub OAuth app, and a Gemini API key.

1. Install packages.

   ```powershell
   npm install
   ```

2. Copy `.env.example` to `.env`, then fill in the database, GitHub, JWT, and Gemini values.

3. Create the database tables.

   ```powershell
   npm run migrate
   ```

4. Start the API and dashboard.

   ```powershell
   npm run dev
   ```

5. Build the extension.

   ```powershell
   npm run build -w @questline/extension
   ```

6. Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `packages/extension/dist`.

The dashboard runs at `http://localhost:5173` and the API at `http://localhost:8787`.

## GitHub OAuth setup

Create an OAuth app with:

- Homepage URL: `http://localhost:5173`
- Callback URL: `http://localhost:8787/auth/github/callback`
- Scopes requested by Questline: `read:user`, `public_repo`

After signing in, open `/pair`, copy the one-time code, and paste it into the extension popup.

## Environment and deployment

For production, set `DASHBOARD_URL`, `API_BASE_URL`, and `GITHUB_OAUTH_CALLBACK` to the deployed origins. Set `VITE_API_BASE_URL` and `VITE_DASHBOARD_URL` while building the dashboard and extension. Add the production API origin to `packages/extension/public/manifest.json` before publishing the Chrome package.

The SQL migration is at `packages/server/src/migrations/001_init.sql` and works directly in the Supabase SQL editor.

## API

- `GET /health`
- `GET /auth/github`
- `POST /auth/pair/create`
- `POST /auth/pair/redeem`
- `POST /issues/score`
- `GET /issues/:nodeId`
- `POST /claims`
- `POST /claims/:id/submit`
- `POST /claims/:id/abandon`
- `GET /claims/mine`
- `GET /users/me`
- `GET /leaderboard`

Scores are immutable. XP is awarded only after GitHub confirms that the linked PR exists and belongs to the claiming user.
