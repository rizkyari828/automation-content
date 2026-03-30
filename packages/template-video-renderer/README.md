# Template Video Renderer

Package ini menyiapkan renderer lokal berbasis `Remotion` untuk `Phase 1A`.

Tujuan:

- render video promo `9:16`
- fokus pada template deterministic
- jadi titik integrasi untuk provider `template` di media pipeline

Start awal:

- composition starter `beauty/promo_offer`
- mapping sederhana dari `template scene plan`
- output lokal untuk development

Script:

- `npm run studio --workspace @creatorflow/template-video-renderer`
- `npm run render:sample --workspace @creatorflow/template-video-renderer`
- `npm run render:job --workspace @creatorflow/template-video-renderer -- --input <spec.json> --output <video.mp4>`
