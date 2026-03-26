CREATE TABLE IF NOT EXISTS content.scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES identity.workspaces(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES identity.users(id),
  source_type TEXT NOT NULL,
  title TEXT NOT NULL,
  hook TEXT,
  body TEXT NOT NULL,
  cta TEXT,
  language_code TEXT NOT NULL DEFAULT 'id',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT scripts_source_type_check CHECK (
    source_type IN ('manual', 'product', 'long_video', 'ai_generate')
  ),
  CONSTRAINT scripts_status_check CHECK (
    status IN ('draft', 'ready', 'archived')
  )
);

CREATE TABLE IF NOT EXISTS content.captions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES content.scripts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES identity.workspaces(id) ON DELETE CASCADE,
  platform_code TEXT NOT NULL,
  caption_text TEXT NOT NULL,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT captions_platform_code_check CHECK (
    platform_code IN ('tiktok', 'instagram', 'facebook', 'youtube')
  )
);

CREATE INDEX IF NOT EXISTS scripts_workspace_created_at_idx
  ON content.scripts (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS captions_script_id_idx
  ON content.captions (script_id);
