CREATE TABLE IF NOT EXISTS content.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES identity.workspaces(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES identity.users(id),
  updated_by_user_id UUID REFERENCES identity.users(id),
  scope TEXT NOT NULL,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  niche TEXT NOT NULL,
  objective TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  use_case_badge TEXT NOT NULL DEFAULT '',
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT templates_scope_check CHECK (
    scope IN ('official', 'workspace')
  ),
  CONSTRAINT templates_status_check CHECK (
    status IN ('draft', 'published', 'archived')
  ),
  CONSTRAINT templates_niche_check CHECK (
    niche IN ('beauty', 'gadget', 'fashion')
  ),
  CONSTRAINT templates_objective_check CHECK (
    objective IN ('comparison', 'problem_solution', 'promo_offer', 'testimonial_style')
  ),
  CONSTRAINT templates_workspace_scope_check CHECK (
    (scope = 'official' AND workspace_id IS NULL) OR
    (scope = 'workspace' AND workspace_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS templates_official_key_unique_idx
  ON content.templates (key)
  WHERE scope = 'official';

CREATE UNIQUE INDEX IF NOT EXISTS templates_workspace_scope_key_unique_idx
  ON content.templates (workspace_id, key)
  WHERE scope = 'workspace';

CREATE INDEX IF NOT EXISTS templates_scope_status_updated_at_idx
  ON content.templates (scope, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS templates_workspace_status_updated_at_idx
  ON content.templates (workspace_id, status, updated_at DESC);

INSERT INTO content.templates (
  scope,
  key,
  title,
  body,
  niche,
  objective,
  status,
  use_case_badge,
  variables
)
VALUES
  (
    'official',
    'beauty/promo_offer',
    'Beauty promo offer starter',
    'Built for skincare affiliate batches that need one clean offer, one visible pain point, and a direct CTA.',
    'beauty',
    'promo_offer',
    'published',
    'Beauty first',
    jsonb_build_object(
      'brandTone', 'premium',
      'ctaText', 'Cek promo skincare-nya sekarang',
      'offerText', 'Flash sale skincare dengan voucher tambahan',
      'promptHint', 'Tonjolkan masalah bekas jerawat, before-after, dan urgency promo.',
      'sourceType', 'product',
      'title', 'Serum brightening untuk bekas jerawat'
    )
  ),
  (
    'official',
    'beauty/problem_solution',
    'Beauty problem-solution',
    'For education-led skincare creatives that open with a relatable skin issue before introducing the product.',
    'beauty',
    'problem_solution',
    'published',
    'Trust builder',
    jsonb_build_object(
      'brandTone', 'soft',
      'ctaText', 'Lihat cara pakainya di link produk',
      'promptHint', 'Mulai dari masalah kulit kusam dan jelaskan solusi secara ringan.',
      'sourceType', 'product',
      'title', 'Moisturizer barrier repair untuk kulit kusam'
    )
  ),
  (
    'official',
    'gadget/comparison',
    'Gadget comparison quick hit',
    'Designed for gadget affiliates who want to compare one standout benefit versus common alternatives.',
    'gadget',
    'comparison',
    'published',
    'Comparison',
    jsonb_build_object(
      'brandTone', 'direct',
      'ctaText', 'Bandingkan speknya sekarang',
      'promptHint', 'Fokus ke perbedaan paling jelas dan tunjukkan kenapa produk ini lebih worth it.',
      'sourceType', 'product',
      'title', 'Wireless earbuds ANC untuk daily commute'
    )
  )
ON CONFLICT DO NOTHING;
