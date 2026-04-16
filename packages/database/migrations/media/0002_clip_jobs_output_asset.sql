ALTER TABLE media.clip_jobs
  ADD COLUMN IF NOT EXISTS output_asset_id UUID REFERENCES asset.assets(id);
