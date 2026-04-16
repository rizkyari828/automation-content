ALTER TABLE publishing.publish_jobs
ADD COLUMN IF NOT EXISTS publish_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
