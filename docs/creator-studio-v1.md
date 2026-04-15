# Creator Studio V1

## Purpose

Dokumen ini menjadi blueprint implementasi awal untuk `Creator Studio` sebagai perluasan dari `Content Studio` yang saat ini masih dominan seller dan affiliate.

Target dokumen ini:

- memberi scope yang sempit dan realistis untuk fase pertama
- menjaga supaya reuse fondasi yang sudah ada tetap tinggi
- mencegah Creator Studio berubah menjadi editor generik tanpa wedge yang jelas
- memberi urutan implementasi yang bisa langsung diturunkan ke backlog engineering

Dokumen ini melengkapi:

- `creatorflow-product-foundation.md`
- `creatorflow-next-development-brief.md`
- `creatorflow-microservice-blueprint.md`
- `creatorflow-template-video-blueprint.md`

## Product Frame

Creator Studio V1 bukan produk untuk semua creator.

Wedge yang direkomendasikan:

- `long_to_short`
- `creator_short`

Definisi singkat:

- `long_to_short`: video panjang, rekaman, atau transcript diubah menjadi draft konten short-form
- `creator_short`: user memberi ide singkat atau brief, lalu sistem membantu membuat hook, beat plan, packaging, dan draft output short-form

Use case yang sengaja belum menjadi fokus fase ini:

- editor timeline penuh
- collaboration kompleks setara NLE
- live stream workflow
- personal brand suite yang sangat luas
- automation publish parity penuh di semua platform

## Why This Scope

Alasan memilih wedge ini:

1. berbeda jelas dari affiliate promo flow
2. tetap bisa reuse session, review, render, dan publish pipeline yang sudah ada
3. pain creator lebih spesifik dan mudah diuji:
   - bingung potongan mana yang layak jadi short
   - butuh hook yang lebih kuat
   - perlu packaging berbeda per platform
   - ingin output lebih cepat dari source content yang sudah ada

## Current State Summary

Saat ini fondasi teknis yang sudah ada cukup kuat:

- `studio_sessions` sudah generic dan bisa menyimpan `raw_brief`, `draft_state`, `scene_plan`, dan `render_specs`
- mode `quick`, `assisted`, dan `manual` sudah ada
- review flow, render batch, dan publish job sudah berjalan
- platform publish sudah mengenal `tiktok`, `instagram`, `facebook`, dan `youtube`

Tetapi implementasi business logic saat ini masih product-centric:

- brief form masih fokus ke `productUrl`, `offerText`, `priceText`, `presenterImageUrl`
- extraction masih membentuk `ProductBrief`
- director script masih berasumsi angle jualan
- template planner masih membangun `template_promo`
- caption packaging masih memakai bahasa affiliate

Karena itu Creator Studio V1 sebaiknya dibangun sebagai domain baru di atas engine yang sama, bukan sekadar rename UI.

## Recommended Studio Use Cases

Tambahkan field baru pada `raw_brief`:

- `studioUseCase`

Nilai awal yang direkomendasikan:

- `affiliate_promo`
- `creator_short`
- `long_to_short`
- `podcast_clip`

Rule:

- `affiliate_promo` tetap memakai flow lama
- `creator_short` dan `long_to_short` memakai flow creator
- `podcast_clip` boleh diperlakukan sebagai varian dari `long_to_short` pada fase awal

## Recommended Raw Brief Schema

Creator Studio V1 sebaiknya tetap memakai `content.studio_sessions.raw_brief`, tetapi isi objeknya dibedakan oleh `studioUseCase`.

Contoh schema untuk `long_to_short`:

```json
{
  "studioUseCase": "long_to_short",
  "sourceType": "long_video",
  "workingTitle": "Cara bikin hook YouTube Shorts",
  "topic": "content repurposing",
  "sourceVideoUrl": "",
  "sourceAssetId": "",
  "transcriptText": "",
  "creatorPersona": "educator",
  "contentPillar": "education",
  "platformTargets": ["youtube", "tiktok", "instagram"],
  "durationTargetSec": 30,
  "toneStyle": "direct",
  "hookStyle": "curiosity_gap",
  "ctaGoal": "follow",
  "seriesName": "",
  "notes": "",
  "videoEngine": "template_local",
  "languageCode": "id",
  "workflowMode": "assisted"
}
```

## Initial Field Set

Field yang direkomendasikan untuk Creator Studio V1:

- `studioUseCase`
- `sourceType`
- `workingTitle`
- `topic`
- `sourceVideoUrl`
- `sourceAssetId`
- `transcriptText`
- `creatorPersona`
- `contentPillar`
- `platformTargets`
- `durationTargetSec`
- `toneStyle`
- `hookStyle`
- `ctaGoal`
- `seriesName`
- `notes`
- `videoEngine`
- `languageCode`
- `workflowMode`

## Field Rules

Rule minimum:

- `studioUseCase` wajib
- `sourceType` wajib
- `workingTitle` atau `topic` minimal salah satu wajib
- untuk `long_to_short`, minimal salah satu dari `sourceVideoUrl`, `sourceAssetId`, atau `transcriptText` wajib
- `platformTargets` minimal 1 item
- `durationTargetSec` wajib untuk creator flows

Rule UX:

- jangan minta semua field di awal
- tampilkan advanced fields hanya untuk `manual`
- gunakan empty state dan helper text yang menjelaskan kenapa field dibutuhkan

## Recommended UX Flow

Creator Studio V1 sebaiknya memakai struktur langkah berikut:

1. `Use case`
2. `Brief`
3. `Review`
4. `Template`
5. `Output`

### 1. Use Case

User memilih dulu:

- repurpose video panjang
- bikin short dari ide
- bikin klip podcast

Tujuan:

- memecah domain sejak awal
- mencegah brief menjadi campur aduk
- membuka peluang routing backend yang lebih bersih

### 2. Brief

Brief creator menggantikan brief product:

- source content
- topic
- creator persona
- content pillar
- platform target
- target durasi
- tone dan hook style

### 3. Review

Review creator tidak lagi berpusat pada `product / offer / price`.

Panel review yang direkomendasikan:

- `Hook`
- `Clip Plan`
- `Packaging`
- `Validation`

`Hook`:

- 1 sampai 3 hook candidates
- editable inline

`Clip Plan`:

- beat-by-beat outline
- durasi per beat
- role per beat, misalnya hook, proof, context, CTA

`Packaging`:

- title, caption, cover text, hashtags per platform

`Validation`:

- source ready
- hook ready
- clip plan ready
- duration valid
- platform package ready

### 4. Template

Template creator sebaiknya difilter bukan hanya berdasarkan niche, tetapi juga format.

Dimensi filter awal:

- `format`
- `tone`
- `duration`

Format awal yang direkomendasikan:

- `talking_head`
- `podcast_clip`
- `tutorial`
- `listicle`
- `reaction`

### 5. Output

Output creator sebaiknya menampilkan:

- preview video
- caption per platform
- title per platform
- cover text
- hashtags
- publish atau schedule
- download

## Recommended Output Package Schema

Tambahkan struktur hasil packaging per platform ke `draft_state` atau `assembly_result`.

Contoh:

```json
{
  "platformPackages": {
    "youtube": {
      "title": "Cara Bikin Hook Shorts yang Bikin Orang Nonton",
      "caption": "3 pola hook yang paling aman buat content repurposing.",
      "coverText": "3 Hook Shorts",
      "hashtags": ["#youtubeshorts", "#contentcreator"]
    },
    "tiktok": {
      "caption": "Kalau hook kamu lemah, video bagus pun bakal di-skip.",
      "coverText": "Hook Jangan Lemah",
      "hashtags": ["#tiktoktips", "#contentcreator"]
    },
    "instagram": {
      "caption": "Mulai dari hook, bukan dari intro yang terlalu lama.",
      "coverText": "Fix Hook Reels",
      "hashtags": ["#reelstips", "#creatorworkflow"]
    }
  }
}
```

## Backend Flow

Creator Studio V1 tetap memakai entrypoint session yang sama.

Alur awal yang direkomendasikan:

1. create or patch studio session
2. save creator raw brief
3. run context extraction khusus creator
4. run director script khusus creator
5. build creator scene plan
6. build creator render specs
7. render batch
8. assemble
9. generate platform packages
10. publish or export

## Domain Split Recommendation

Fungsi-fungsi berikut sebaiknya dipecah berdasarkan `studioUseCase`:

- `buildContextExtraction`
- `buildDirectorScripts`
- `buildTemplatePlannerInput`
- `buildCaptionPackage`

Rule yang direkomendasikan:

- `affiliate_promo` tetap memakai flow lama
- `creator_short` dan `long_to_short` memakai builder baru
- fallback lama tetap ada agar perubahan tidak memutus flow existing

## Creator Extraction Output

Alih-alih membentuk `ProductBrief`, creator extraction sebaiknya membentuk objek seperti:

```json
{
  "sourceSummary": "Pembahasan tentang 3 pola hook untuk short-form video.",
  "mainPoints": [
    "Hook harus cepat dan spesifik",
    "Jangan mulai dengan intro panjang",
    "Platform butuh packaging berbeda"
  ],
  "clipCandidates": [
    {
      "id": "clip_01",
      "label": "Hook mistake",
      "startSec": 12,
      "endSec": 34
    }
  ],
  "platformNotes": {
    "youtube": "Title dan opening harus jelas manfaatnya",
    "tiktok": "Hook text harus lebih agresif",
    "instagram": "Cover text harus lebih singkat"
  },
  "warnings": []
}
```

## Creator Director Script Output

Director script creator sebaiknya fokus ke:

- hook candidates
- beat plan
- voiceover lines
- scene role
- pacing
- CTA goal

Contoh struktur:

```json
{
  "id": "dir_ab12cd34",
  "platform": "tiktok",
  "hook": {
    "text": "Masalah terbesar creator itu bukan ide, tapi 3 detik pertama.",
    "durationMs": 2200
  },
  "beats": [
    {
      "role": "hook",
      "text": "Masalah terbesar creator itu bukan ide."
    },
    {
      "role": "proof",
      "text": "Video bagus tetap bisa gagal kalau opening-nya lambat."
    },
    {
      "role": "cta",
      "text": "Simpan kalau mau breakdown template hook-nya."
    }
  ],
  "voiceover": {
    "voiceId": "id-ID-female-warm",
    "speed": 1.0
  }
}
```

## Creator Scene Plan

Scene plan creator tidak perlu menyimpan istilah product-centric seperti `offer` atau `price`.

Role scene awal yang direkomendasikan:

- `hook`
- `context`
- `proof`
- `pattern`
- `example`
- `cta`

Layout awal yang direkomendasikan:

- `talking-head`
- `subtitled-clip`
- `highlight-card`
- `split-proof`
- `cover-cta`

## Render Strategy

Untuk fase awal, strategi render creator sebaiknya tetap deterministic.

Prinsip:

- utamakan `Remotion + FFmpeg`
- jangan mengunci flow creator pada provider generative
- generative footage tetap roadmap

Routing awal yang direkomendasikan:

- `talking-head`, `subtitled-clip`, `listicle`, `cta-card` -> `template`
- `cinematic_broll`, `avatar_presenter`, `synthetic_scene` -> roadmap generative

## Packaging Strategy

Packaging creator sebaiknya menjadi step eksplisit, bukan efek samping assembly.

Minimal output:

- `youtube.title`
- `youtube.caption`
- `youtube.coverText`
- `tiktok.caption`
- `tiktok.coverText`
- `instagram.caption`
- `instagram.coverText`

Optional:

- hashtags
- comment prompt
- pinned comment suggestion

## Analytics Recommendation

Tambahkan event baru untuk creator flows:

- `content.creator.use_case_selected`
- `content.creator.source_attached`
- `content.creator.hook_generated`
- `content.creator.clip_plan_generated`
- `content.creator.package_generated`
- `content.creator.first_exported`
- `content.creator.first_published`

Property yang disarankan:

- `studio_use_case`
- `source_type`
- `platform_targets`
- `duration_target_sec`
- `has_transcript_text`
- `has_source_asset`
- `workflow_mode`

## Recommended Implementation Sequence

### Phase 1

Tujuan:

- membuat Creator Studio usable tanpa menunggu pipeline clipping penuh

Scope:

- `studioUseCase`
- creator brief schema
- creator extraction
- creator hooks
- creator clip plan
- platform packaging
- creator review UI

Belum termasuk:

- auto transcript extraction
- auto highlight clipping
- creator-specific render packs lengkap

### Phase 2

Tujuan:

- membuat output creator lebih native secara visual

Scope:

- template family creator
- creator scene planner
- creator render specs
- platform-aware render variants

### Phase 3

Tujuan:

- membuat wedge `long_to_short` terasa kuat

Scope:

- transcript-aware clip candidate detection
- highlight scoring
- multi-variant generation dari satu source
- deeper publish and analytics loop

## File Impact Backlog

### Web UI

Area file:

- `apps/web-ui/components/content/content-studio-page.jsx`

Perubahan utama:

- tambahkan `studioUseCase`
- ganti brief form creator
- ganti validation logic review
- ganti packaging output dan publish selector
- hilangkan hardcode `tiktok` untuk creator flows

### API Gateway

Area file:

- `apps/api-gateway/src/modules/content/routes.ts`
- `apps/api-gateway/src/modules/content/template-planner.ts`
- `apps/api-gateway/src/modules/publishing/routes.ts`

Perubahan utama:

- route logic bercabang menurut `studioUseCase`
- extraction dan director script creator-specific
- planner creator-specific
- packaging output per platform

### Database

Fase awal:

- tidak wajib migration baru
- simpan schema creator di `raw_brief` dan `draft_state`

Fase berikutnya bila perlu:

- tambah kolom atau tabel turunan untuk indexing `studioUseCase`, `platformTargets`, atau `sourceAssetId`

## Important Known Gap

Implementasi saat ini belum melakukan assembly final yang benar-benar menggabungkan semua scene clip menjadi satu output akhir.

Artinya:

- flow creator render yang serius sebaiknya tidak mengandalkan behaviour assembly saat ini sebagai final state
- backlog assembly concat dan audio mix perlu diprioritaskan sebelum Creator Studio masuk ke phase render yang lebih matang

## Non-Goals

Untuk Creator Studio V1, hal berikut sengaja tidak menjadi target:

- editor timeline penuh
- real-time collaborative editing
- advanced approval workflow lintas tim
- custom animation builder
- full analytics suite creator
- cross-platform publish parity sempurna

## Definition Of Done

Creator Studio V1 dianggap cukup berhasil bila:

- user bisa memilih use case creator yang jelas
- user bisa memasukkan source content atau ide singkat
- sistem menghasilkan hook, clip plan, dan packaging per platform
- review flow terasa creator-native, bukan affiliate-native
- output pertama bisa di-export atau diteruskan ke publish flow
- existing affiliate studio tidak rusak

## Related Docs

- `creatorflow-product-foundation.md`
- `creatorflow-next-development-brief.md`
- `creatorflow-microservice-blueprint.md`
- `creatorflow-template-video-blueprint.md`
- `creatorflow-activation-event-taxonomy.md`
