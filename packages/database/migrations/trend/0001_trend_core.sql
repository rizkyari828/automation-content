CREATE SCHEMA IF NOT EXISTS trend;

CREATE TABLE IF NOT EXISTS trend.trend_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_code TEXT NOT NULL,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trend_sources_source_code_unique UNIQUE (source_code),
  CONSTRAINT trend_sources_source_type_check CHECK (
    source_type IN ('public_signal', 'internal_metric', 'manual')
  )
);

CREATE TABLE IF NOT EXISTS trend.trend_collection_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES identity.workspaces(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES trend.trend_sources(id) ON DELETE RESTRICT,
  trigger_mode TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_error TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trend_collection_runs_trigger_mode_check CHECK (
    trigger_mode IN ('manual', 'scheduled', 'event')
  ),
  CONSTRAINT trend_collection_runs_status_check CHECK (
    status IN ('queued', 'running', 'completed', 'failed')
  )
);

CREATE TABLE IF NOT EXISTS trend.trend_signal_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES identity.workspaces(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES trend.trend_sources(id) ON DELETE RESTRICT,
  collection_run_id UUID REFERENCES trend.trend_collection_runs(id) ON DELETE SET NULL,
  signal_type TEXT NOT NULL,
  title TEXT NOT NULL,
  external_ref TEXT,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trend_signal_snapshots_signal_type_check CHECK (
    signal_type IN ('topic', 'product', 'angle', 'keyword')
  )
);

CREATE TABLE IF NOT EXISTS trend.trend_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES identity.workspaces(id) ON DELETE CASCADE,
  signal_snapshot_id UUID NOT NULL REFERENCES trend.trend_signal_snapshots(id) ON DELETE CASCADE,
  momentum_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
  acceleration_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
  saturation_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
  seasonality_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
  total_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trend.trend_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES identity.workspaces(id) ON DELETE CASCADE,
  signal_snapshot_id UUID REFERENCES trend.trend_signal_snapshots(id) ON DELETE SET NULL,
  score_id UUID REFERENCES trend.trend_scores(id) ON DELETE SET NULL,
  collection_run_id UUID REFERENCES trend.trend_collection_runs(id) ON DELETE SET NULL,
  recommendation_type TEXT NOT NULL,
  title TEXT NOT NULL,
  recommendation_text TEXT NOT NULL,
  period TEXT NOT NULL DEFAULT 'daily',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trend_recommendations_recommendation_type_check CHECK (
    recommendation_type IN ('topic', 'product', 'angle', 'cta')
  ),
  CONSTRAINT trend_recommendations_period_check CHECK (
    period IN ('daily', 'weekly')
  ),
  CONSTRAINT trend_recommendations_status_check CHECK (
    status IN ('active', 'dismissed', 'converted')
  )
);

CREATE TABLE IF NOT EXISTS trend.trend_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES identity.workspaces(id) ON DELETE CASCADE,
  collection_run_id UUID REFERENCES trend.trend_collection_runs(id) ON DELETE SET NULL,
  period TEXT NOT NULL DEFAULT 'daily',
  summary TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trend_digests_period_check CHECK (
    period IN ('daily', 'weekly')
  )
);

CREATE TABLE IF NOT EXISTS trend.trend_digest_items (
  digest_id UUID NOT NULL REFERENCES trend.trend_digests(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL REFERENCES trend.trend_recommendations(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (digest_id, recommendation_id)
);

CREATE INDEX IF NOT EXISTS trend_collection_runs_workspace_created_idx
  ON trend.trend_collection_runs (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS trend_signal_snapshots_workspace_observed_idx
  ON trend.trend_signal_snapshots (workspace_id, observed_at DESC);

CREATE INDEX IF NOT EXISTS trend_scores_signal_snapshot_id_idx
  ON trend.trend_scores (signal_snapshot_id);

CREATE INDEX IF NOT EXISTS trend_recommendations_workspace_status_created_idx
  ON trend.trend_recommendations (workspace_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS trend_digests_workspace_period_generated_idx
  ON trend.trend_digests (workspace_id, period, generated_at DESC);
