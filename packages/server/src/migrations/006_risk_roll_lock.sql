-- One unresolved Risk Roll per player per issue — a repeat roll call returns it, never a new one.
CREATE UNIQUE INDEX IF NOT EXISTS idx_quest_game_offers_unused ON quest_game_offers(user_id, issue_node_id) WHERE used_at IS NULL;
