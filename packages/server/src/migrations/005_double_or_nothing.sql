ALTER TABLE claims ADD COLUMN IF NOT EXISTS double_choice TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS double_won BOOLEAN;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS double_bonus_awarded INTEGER NOT NULL DEFAULT 0;
-- Not unique: xp_events is a hypertable and unique indexes must include the partition key.
-- Duplicate double_bonus inserts are already blocked by the atomic UPDATE ... WHERE double_choice IS NULL check on claims.
CREATE INDEX IF NOT EXISTS idx_xp_events_claim_double_bonus ON xp_events(claim_id) WHERE kind = 'double_bonus';
