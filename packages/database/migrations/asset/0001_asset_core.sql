CREATE TABLE IF NOT EXISTS asset.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES identity.workspaces(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES identity.users(id),
  asset_type TEXT NOT NULL,
  storage_bucket TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes BIGINT,
  checksum_sha256 TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded',
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT assets_asset_type_check CHECK (
    asset_type IN ('video', 'image', 'audio', 'subtitle', 'thumbnail', 'document')
  ),
  CONSTRAINT assets_status_check CHECK (
    status IN ('pending', 'uploaded', 'processed', 'failed', 'deleted')
  ),
  CONSTRAINT assets_storage_location_unique UNIQUE (storage_bucket, storage_key)
);

CREATE TABLE IF NOT EXISTS asset.uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES asset.assets(id) ON DELETE CASCADE,
  upload_token TEXT NOT NULL,
  upload_url TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uploads_upload_token_unique UNIQUE (upload_token)
);

CREATE INDEX IF NOT EXISTS assets_workspace_created_at_idx
  ON asset.assets (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS uploads_asset_id_idx
  ON asset.uploads (asset_id);
