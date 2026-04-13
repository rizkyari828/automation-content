ALTER TABLE content.studio_sessions
  ADD COLUMN IF NOT EXISTS scene_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS render_specs JSONB NOT NULL DEFAULT '[]'::jsonb;
