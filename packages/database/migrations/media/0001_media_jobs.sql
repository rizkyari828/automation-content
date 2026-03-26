CREATE TABLE IF NOT EXISTS media.render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES identity.workspaces(id) ON DELETE CASCADE,
  source_asset_id UUID REFERENCES asset.assets(id),
  output_asset_id UUID REFERENCES asset.assets(id),
  script_id UUID REFERENCES content.scripts(id),
  status TEXT NOT NULL DEFAULT 'queued',
  requested_by_user_id UUID REFERENCES identity.users(id),
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lease_owner TEXT,
  leased_until TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  provider_name TEXT,
  provider_job_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  last_error_code TEXT,
  last_error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT render_jobs_status_check CHECK (
    status IN ('queued', 'processing', 'completed', 'failed', 'canceled')
  )
);

CREATE TABLE IF NOT EXISTS media.clip_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES identity.workspaces(id) ON DELETE CASCADE,
  source_asset_id UUID NOT NULL REFERENCES asset.assets(id),
  status TEXT NOT NULL DEFAULT 'queued',
  requested_by_user_id UUID REFERENCES identity.users(id),
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lease_owner TEXT,
  leased_until TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  last_error_code TEXT,
  last_error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT clip_jobs_status_check CHECK (
    status IN ('queued', 'processing', 'completed', 'failed', 'canceled')
  )
);

CREATE TABLE IF NOT EXISTS media.subtitle_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES identity.workspaces(id) ON DELETE CASCADE,
  source_asset_id UUID NOT NULL REFERENCES asset.assets(id),
  output_asset_id UUID REFERENCES asset.assets(id),
  status TEXT NOT NULL DEFAULT 'queued',
  language_code TEXT NOT NULL DEFAULT 'id',
  requested_by_user_id UUID REFERENCES identity.users(id),
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lease_owner TEXT,
  leased_until TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  last_error_code TEXT,
  last_error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subtitle_jobs_status_check CHECK (
    status IN ('queued', 'processing', 'completed', 'failed', 'canceled')
  )
);

CREATE TABLE IF NOT EXISTS media.outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS render_jobs_due_idx
  ON media.render_jobs (status, scheduled_for)
  WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS render_jobs_lease_idx
  ON media.render_jobs (leased_until)
  WHERE status = 'processing';

CREATE INDEX IF NOT EXISTS clip_jobs_due_idx
  ON media.clip_jobs (status, scheduled_for)
  WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS subtitle_jobs_due_idx
  ON media.subtitle_jobs (status, scheduled_for)
  WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS media_outbox_unpublished_idx
  ON media.outbox_events (published_at, occurred_at)
  WHERE published_at IS NULL;
