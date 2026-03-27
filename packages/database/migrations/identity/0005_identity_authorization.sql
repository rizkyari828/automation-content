CREATE TABLE IF NOT EXISTS identity.platform_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  role_code TEXT NOT NULL,
  created_by_user_id UUID REFERENCES identity.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT platform_role_assignments_role_check CHECK (
    role_code IN ('superadmin')
  ),
  CONSTRAINT platform_role_assignments_user_role_unique UNIQUE (user_id, role_code)
);

CREATE INDEX IF NOT EXISTS platform_role_assignments_user_id_idx
  ON identity.platform_role_assignments (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS identity.workspace_features (
  workspace_id UUID NOT NULL REFERENCES identity.workspaces(id) ON DELETE CASCADE,
  feature_code TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  configured_by_user_id UUID REFERENCES identity.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT workspace_features_feature_check CHECK (
    feature_code IN (
      'assets',
      'billing',
      'content',
      'media',
      'publishing',
      'sso',
      'team',
      'trend',
      'workspace_settings'
    )
  ),
  PRIMARY KEY (workspace_id, feature_code)
);

CREATE INDEX IF NOT EXISTS workspace_features_enabled_idx
  ON identity.workspace_features (workspace_id, feature_code, is_enabled);

INSERT INTO identity.workspace_features (
  workspace_id,
  feature_code,
  is_enabled
)
SELECT
  w.id,
  feature.feature_code,
  TRUE
FROM identity.workspaces w
CROSS JOIN (
  VALUES
    ('assets'),
    ('billing'),
    ('content'),
    ('media'),
    ('publishing'),
    ('sso'),
    ('team'),
    ('trend'),
    ('workspace_settings')
) AS feature(feature_code)
ON CONFLICT (workspace_id, feature_code) DO NOTHING;
