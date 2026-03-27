ALTER TABLE identity.users
  ADD COLUMN IF NOT EXISTS about_text TEXT;

CREATE TABLE IF NOT EXISTS identity.auth_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES identity.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT auth_challenges_purpose_check CHECK (
    purpose IN ('verify_email', 'reset_password')
  )
);

CREATE INDEX IF NOT EXISTS auth_challenges_user_id_idx
  ON identity.auth_challenges (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS auth_challenges_email_purpose_idx
  ON identity.auth_challenges (email, purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS auth_challenges_active_idx
  ON identity.auth_challenges (email, purpose, expires_at DESC)
  WHERE consumed_at IS NULL;
