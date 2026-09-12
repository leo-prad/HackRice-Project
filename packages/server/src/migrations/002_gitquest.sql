-- GitVenture engine: structured analysis, deterministic difficulty/XP, skills, goals, achievements.

ALTER TABLE issue_scores
  ADD COLUMN IF NOT EXISTS quest_key TEXT,
  ADD COLUMN IF NOT EXISTS difficulty_score NUMERIC(4,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rarity TEXT NOT NULL DEFAULT 'common',
  ADD COLUMN IF NOT EXISTS scoring_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS analysis_json JSONB;

UPDATE issue_scores SET quest_key = repo_full_name || '#' || issue_number WHERE quest_key IS NULL;
ALTER TABLE issue_scores ALTER COLUMN quest_key SET NOT NULL;

-- Canonical identity: owner/repo#issue_number resolves to exactly one quest.
CREATE UNIQUE INDEX IF NOT EXISTS idx_issue_scores_quest_key ON issue_scores(quest_key);

CREATE TABLE IF NOT EXISTS quest_skills (
  id SERIAL PRIMARY KEY,
  issue_node_id TEXT NOT NULL REFERENCES issue_scores(issue_node_id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_level_required INTEGER NOT NULL DEFAULT 1,
  skill_xp_reward INTEGER NOT NULL DEFAULT 0,
  weight NUMERIC(5,3) NOT NULL DEFAULT 0,
  UNIQUE (issue_node_id, skill_name)
);

-- The Quest Complete screen is rendered from the payload computed at award time.
ALTER TABLE claims ADD COLUMN IF NOT EXISTS completion_json JSONB;

CREATE TABLE IF NOT EXISTS user_skills (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  skill_name TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_name)
);
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);

CREATE TABLE IF NOT EXISTS user_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  goal TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, goal)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS goals_completed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS achievements (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL
);

INSERT INTO achievements (code, name, description) VALUES
  ('first_blood', 'First Blood', 'Complete your first quest.'),
  ('open_source_hero', 'Open Source Hero', 'Complete 10 quests.'),
  ('boss_slayer', 'High Stakes', 'Complete a quest worth 850+ XP.'),
  ('polyglot', 'Polyglot', 'Complete quests across 3 different languages.'),
  ('speedrunner', 'Speedrunner', 'Complete a quest within a day of claiming it.')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  code TEXT NOT NULL REFERENCES achievements(code),
  claim_id INTEGER REFERENCES claims(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);

-- Ledger rows carry the quest they paid for so completion history survives claim edits.
ALTER TABLE xp_events ADD COLUMN IF NOT EXISTS issue_node_id TEXT REFERENCES issue_scores(issue_node_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_claim_kind ON xp_events(claim_id, kind);
