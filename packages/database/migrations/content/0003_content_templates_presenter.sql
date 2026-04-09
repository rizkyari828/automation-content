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
    'beauty/testimonial_style',
    'Beauty creator testimonial',
    'Built for creator-style skincare videos that feel more like a host or UGC recommendation while still keeping the offer visible.',
    'beauty',
    'testimonial_style',
    'published',
    'UGC host',
    jsonb_build_object(
      'brandTone', 'premium',
      'ctaText', 'Cek paket skincare-nya sekarang',
      'offerText', 'Creator pick minggu ini',
      'promptHint', 'Bawakan seperti creator sedang kasih rekomendasi jujur, lalu tutup dengan CTA yang jelas.',
      'sourceType', 'product',
      'title', 'Serum calming untuk jerawat aktif'
    )
  )
ON CONFLICT DO NOTHING;
