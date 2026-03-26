CREATE TABLE IF NOT EXISTS publishing.connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES identity.workspaces(id) ON DELETE CASCADE,
  platform_code TEXT NOT NULL,
  account_label TEXT NOT NULL,
  external_account_id TEXT NOT NULL,
  access_token_ciphertext TEXT,
  refresh_token_ciphertext TEXT,
  token_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT connected_accounts_platform_check CHECK (
    platform_code IN ('tiktok', 'instagram', 'facebook', 'youtube')
  ),
  CONSTRAINT connected_accounts_status_check CHECK (
    status IN ('active', 'expired', 'revoked', 'error')
  ),
  CONSTRAINT connected_accounts_external_unique UNIQUE (platform_code, external_account_id)
);

CREATE TABLE IF NOT EXISTS publishing.publish_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES identity.workspaces(id) ON DELETE CASCADE,
  connected_account_id UUID REFERENCES publishing.connected_accounts(id),
  asset_id UUID REFERENCES asset.assets(id),
  caption_id UUID REFERENCES content.captions(id),
  platform_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_for TIMESTAMPTZ NOT NULL,
  lease_owner TEXT,
  leased_until TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  idempotency_key TEXT NOT NULL,
  last_error_code TEXT,
  last_error_message TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT publish_jobs_platform_check CHECK (
    platform_code IN ('tiktok', 'instagram', 'facebook', 'youtube')
  ),
  CONSTRAINT publish_jobs_status_check CHECK (
    status IN ('scheduled', 'queued', 'processing', 'published', 'failed', 'canceled')
  ),
  CONSTRAINT publish_jobs_idempotency_unique UNIQUE (idempotency_key)
);

CREATE TABLE IF NOT EXISTS publishing.outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS publish_jobs_due_idx
  ON publishing.publish_jobs (status, scheduled_for)
  WHERE status IN ('scheduled', 'queued');

CREATE INDEX IF NOT EXISTS publish_jobs_lease_idx
  ON publishing.publish_jobs (leased_until)
  WHERE status IN ('queued', 'processing');

CREATE INDEX IF NOT EXISTS publishing_outbox_unpublished_idx
  ON publishing.outbox_events (published_at, occurred_at)
  WHERE published_at IS NULL;
