-- Developer character seeding from GitHub experience (Gemini profile builder).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_seeded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS profile_json JSONB;
