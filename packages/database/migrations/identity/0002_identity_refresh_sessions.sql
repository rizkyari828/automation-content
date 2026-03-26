CREATE TABLE IF NOT EXISTS identity.refresh_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_family_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES identity.workspaces(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ,
  rotated_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  replaced_by_session_id UUID REFERENCES identity.refresh_sessions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS refresh_sessions_user_id_idx
  ON identity.refresh_sessions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS refresh_sessions_workspace_id_idx
  ON identity.refresh_sessions (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS refresh_sessions_family_idx
  ON identity.refresh_sessions (token_family_id, created_at DESC);

CREATE INDEX IF NOT EXISTS refresh_sessions_active_idx
  ON identity.refresh_sessions (expires_at, revoked_at)
  WHERE revoked_at IS NULL;
