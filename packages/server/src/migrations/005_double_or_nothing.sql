ALTER TABLE claims ADD COLUMN IF NOT EXISTS double_choice TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS double_won BOOLEAN;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS double_bonus_awarded INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_events_claim_double_bonus ON xp_events(claim_id) WHERE kind = 'double_bonus';
