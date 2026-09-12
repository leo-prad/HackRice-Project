CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  github_id BIGINT UNIQUE NOT NULL,
  github_login TEXT NOT NULL,
  avatar_url TEXT,
  github_token TEXT NOT NULL,
  total_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS issue_scores (
  issue_node_id TEXT PRIMARY KEY,
  issue_url TEXT NOT NULL,
  repo_full_name TEXT NOT NULL,
  repo_owner_id BIGINT NOT NULL,
  issue_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  xp INTEGER NOT NULL,
  days_open INTEGER NOT NULL,
  scored_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_issue_scores_url ON issue_scores(issue_url);

CREATE TABLE IF NOT EXISTS claims (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  issue_node_id TEXT NOT NULL REFERENCES issue_scores(issue_node_id),
  status TEXT NOT NULL DEFAULT 'claimed' CHECK (status IN ('claimed','submitted','merged','abandoned')),
  pr_url TEXT,
  pr_number INTEGER,
  pr_repo TEXT,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  merged_at TIMESTAMPTZ,
  UNIQUE (user_id, issue_node_id)
);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_user ON claims(user_id);

CREATE TABLE IF NOT EXISTS xp_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  claim_id INTEGER REFERENCES claims(id),
  delta INTEGER NOT NULL,
  kind TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_xp_events_user ON xp_events(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS pairing_codes (
  code TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  consumed BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL
);
