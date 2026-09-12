CREATE TABLE IF NOT EXISTS quest_game_offers (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issue_node_id TEXT NOT NULL REFERENCES issue_scores(issue_node_id) ON DELETE CASCADE,
  risk_multiplier NUMERIC(4,2) NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quest_game_offers_user ON quest_game_offers(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_quest_game_offers_unused ON quest_game_offers(user_id, issue_node_id) WHERE used_at IS NULL;
