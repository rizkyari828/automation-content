CREATE TABLE IF NOT EXISTS identity.external_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  provider_code TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  provider_email TEXT,
  provider_username TEXT,
  avatar_url TEXT,
  profile_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT external_accounts_provider_check CHECK (
    provider_code IN ('google', 'facebook', 'twitter', 'apple')
  ),
  CONSTRAINT external_accounts_provider_identity_unique UNIQUE (provider_code, provider_user_id)
);

CREATE INDEX IF NOT EXISTS external_accounts_user_id_idx
  ON identity.external_accounts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS external_accounts_provider_email_idx
  ON identity.external_accounts (provider_code, provider_email)
  WHERE provider_email IS NOT NULL;

CREATE TABLE IF NOT EXISTS identity.oauth_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code TEXT NOT NULL,
  state_token_hash TEXT NOT NULL UNIQUE,
  pkce_code_verifier TEXT,
  intent TEXT NOT NULL DEFAULT 'sign_in',
  redirect_uri TEXT NOT NULL,
  next_path TEXT,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT oauth_flows_provider_check CHECK (
    provider_code IN ('google', 'facebook', 'twitter', 'apple')
  ),
  CONSTRAINT oauth_flows_intent_check CHECK (
    intent IN ('sign_in', 'register')
  )
);

CREATE INDEX IF NOT EXISTS oauth_flows_provider_expiry_idx
  ON identity.oauth_flows (provider_code, expires_at DESC);
