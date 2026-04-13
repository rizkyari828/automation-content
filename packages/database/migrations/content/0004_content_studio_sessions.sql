CREATE TABLE IF NOT EXISTS content.studio_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES identity.workspaces(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES identity.users(id),
  workflow_mode TEXT NOT NULL DEFAULT 'assisted',
  status TEXT NOT NULL DEFAULT 'draft',
  last_layer TEXT NOT NULL DEFAULT 'L0',
  raw_brief JSONB NOT NULL DEFAULT '{}'::jsonb,
  draft_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  product_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  extracted_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  director_scripts JSONB NOT NULL DEFAULT '[]'::jsonb,
  completeness_score INTEGER NOT NULL DEFAULT 0,
  missing_fields TEXT[] NOT NULL DEFAULT '{}',
  warnings TEXT[] NOT NULL DEFAULT '{}',
  ready_to_proceed BOOLEAN NOT NULL DEFAULT false,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT studio_sessions_workflow_mode_check CHECK (
    workflow_mode IN ('quick', 'assisted', 'manual')
  ),
  CONSTRAINT studio_sessions_status_check CHECK (
    status IN ('draft', 'processing', 'ready', 'archived')
  ),
  CONSTRAINT studio_sessions_completeness_score_check CHECK (
    completeness_score >= 0 AND completeness_score <= 100
  )
);

CREATE INDEX IF NOT EXISTS studio_sessions_workspace_updated_at_idx
  ON content.studio_sessions (workspace_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS studio_sessions_workspace_status_idx
  ON content.studio_sessions (workspace_id, status);
