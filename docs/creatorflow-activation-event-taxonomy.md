# CreatorFlow Activation Event Taxonomy

## Purpose

Dokumen ini mendefinisikan event taxonomy untuk activation dan conversion CreatorFlow pada fase launch awal.

Tujuannya:

- memberi naming convention yang konsisten untuk web, backend, dan analytics
- memastikan funnel activation bisa diukur end-to-end
- menyelaraskan product metric dengan source of truth observability
- mencegah event liar yang sulit dipakai untuk decision making

Dokumen ini fokus pada product analytics dan operational product events, bukan raw application logging.

Untuk logging dan projection yang lebih luas, lihat `creatorflow-observability-logging.md`.

## Scope

Taxonomy ini mencakup:

- public landing
- signup
- onboarding
- first draft activation
- publish intent
- trial and conversion
- assisted onboarding

Taxonomy ini belum bertujuan menjadi daftar semua event platform jangka panjang.

## Success Metrics This Taxonomy Must Support

Metric utama yang harus bisa dijawab:

- landing CTA mana yang paling efektif
- berapa banyak signup masuk ke onboarding
- berapa banyak user sampai ke product input
- berapa banyak user menghasilkan first draft
- berapa lama time to first video
- berapa banyak draft yang dilanjutkan ke export atau publish
- berapa banyak trial berubah menjadi paid
- jalur assisted mana yang paling membantu conversion

## Naming Convention

Format yang dipakai:

- `<domain>.<object>.<action>`

Contoh:

- `marketing.cta.clicked`
- `auth.signup.completed`
- `onboarding.started`
- `content.draft.first_created`
- `trial.converted`

Aturan:

- gunakan lowercase
- gunakan kata kerja yang jelas
- hindari nama event berbasis UI komponen lokal
- gunakan nama yang stabil walau layout berubah

## Event Layers

### 1. Marketing Events

Event dari landing, CTA, dan traffic source.

Tujuan:

- mengukur intent sebelum signup

### 2. Account And Trial Events

Event yang menunjukkan akun dibuat dan trial aktif.

Tujuan:

- menghubungkan acquisition ke activation

### 3. Onboarding Events

Event yang menunjukkan progress user menuju first value.

Tujuan:

- mengukur friction terbesar dalam onboarding

### 4. Content Activation Events

Event yang menunjukkan user benar-benar mulai memakai produk.

Tujuan:

- mengukur output pertama dan nilai awal

### 5. Publish And Outcome Events

Event yang menunjukkan draft mulai bergerak ke hasil nyata.

Tujuan:

- mengukur apakah draft dipakai, bukan hanya dibuat

### 6. Assisted Conversion Events

Event yang menunjukkan peran manusia dalam conversion flow.

Tujuan:

- mengukur sales-assisted onboarding sebagai mesin GTM awal

## Required Shared Properties

Semua event product analytics minimal membawa field berikut jika tersedia:

- `event_name`
- `occurred_at`
- `user_id`
- `workspace_id`
- `session_id`
- `request_id`
- `surface`
- `locale`

`surface` contoh:

- `landing`
- `sign_up`
- `web_app`
- `dashboard`

## Shared Commercial Properties

Tambahkan bila relevan:

- `persona_type`
- `plan_name`
- `trial_status`
- `source_channel`
- `campaign_id`
- `cta_id`
- `assisted_intent`

## Shared Product Properties

Tambahkan bila relevan:

- `product_source_type`
- `product_platform`
- `angle_count`
- `draft_count`
- `publish_target_count`
- `time_to_first_video_ms`

## Identity Rules

Aturan identity:

- sebelum signup, event boleh memakai anonymous session id
- setelah signup, event harus dihubungkan ke `user_id`
- jika workspace belum ada, `workspace_id` boleh kosong
- jika user berganti workspace, event harus selalu memakai workspace aktif pada saat kejadian

## PII Rules

Jangan kirim field mentah berikut ke event analytics umum:

- password
- full payment details
- raw product brief panjang yang berisi data sensitif
- token provider
- raw email body

Jika perlu analisis, kirim versi terstruktur atau ringkasannya.

## Canonical Events

### Marketing

#### `marketing.page_viewed`

Kapan:

- landing page atau page penting dibuka

Property penting:

- `page_name`
- `source_channel`
- `campaign_id`

#### `marketing.cta.clicked`

Kapan:

- CTA publik diklik

Property penting:

- `cta_id`
- `cta_label`
- `page_name`
- `destination`

CTA id yang disarankan:

- `hero_start_trial`
- `hero_watch_demo`
- `pricing_affiliate_start`
- `pricing_seller_start`
- `pricing_agency_contact`
- `assist_start`

### Account And Trial

#### `auth.signup.started`

Kapan:

- user mulai mengisi signup form

#### `auth.signup.completed`

Kapan:

- account berhasil dibuat

Property penting:

- `signup_method`
- `source_channel`
- `campaign_id`

#### `trial.started`

Kapan:

- trial workspace aktif

Property penting:

- `plan_name`
- `trial_length_days`

### Onboarding

#### `onboarding.started`

Kapan:

- user masuk ke flow onboarding pertama kali

Property penting:

- `persona_hint`
- `entry_surface`

#### `onboarding.persona_selected`

Kapan:

- user memilih seller, affiliate, atau agency/operator

Property penting:

- `persona_type`
- `volume_band`
- `primary_goal`

#### `onboarding.workspace_minimum_completed`

Kapan:

- setup workspace minimum selesai

#### `onboarding.product_input_started`

Kapan:

- user mulai mengisi produk atau brief pertama

#### `onboarding.product_input_completed`

Kapan:

- product context pertama berhasil tersimpan

Property penting:

- `product_source_type`
- `product_platform`

#### `onboarding.angle_selected`

Kapan:

- user memilih angle awal

Property penting:

- `angle_type`
- `angle_count`

### Content Activation

#### `content.generation.started`

Kapan:

- job generation pertama dimulai

Property penting:

- `generation_type`
- `persona_type`

#### `content.draft.first_created`

Kapan:

- first draft yang lengkap berhasil dibuat untuk workspace itu

Property penting:

- `draft_count`
- `angle_count`
- `time_to_first_video_ms`

Ini adalah event aktivasi utama.

#### `content.draft.viewed`

Kapan:

- user membuka hasil draft

#### `content.draft.regenerated`

Kapan:

- user meminta variasi ulang

Property penting:

- `reason`
- `draft_count_before`

### Publish And Outcome

#### `content.export.started`

Kapan:

- user mulai export output

#### `publishing.intent_recorded`

Kapan:

- user menunjukkan intent untuk menjadwalkan atau publish

Property penting:

- `publish_target_count`
- `target_platform`

#### `publishing.first_job_created`

Kapan:

- publish job pertama berhasil dibuat

Ini adalah activation-plus signal, bukan primary activation signal.

### Assisted Conversion

#### `assist.requested`

Kapan:

- user menekan CTA assisted onboarding atau meminta bantuan

Property penting:

- `assist_entry_point`
- `persona_type`
- `current_step`

#### `assist.contact_scheduled`

Kapan:

- tim berhasil menjadwalkan follow-up

#### `assist.session_completed`

Kapan:

- sesi assisted onboarding selesai

Property penting:

- `assist_outcome`
- `blocking_issue`

### Billing And Conversion

#### `trial.checkpoint_reached`

Kapan:

- user mencapai checkpoint evaluasi trial

Checkpoint yang disarankan:

- `first_draft`
- `first_publish_intent`
- `day_3_active`
- `day_5_inactive`

#### `billing.checkout_started`

Kapan:

- user memulai checkout

Property penting:

- `plan_name`
- `payment_method_hint`

#### `trial.converted`

Kapan:

- trial berubah menjadi paid

Property penting:

- `plan_name`
- `payment_method`
- `conversion_path`

`conversion_path` contoh:

- `self_serve`
- `assisted`
- `pilot_followup`

## Funnel Definition

Funnel minimum yang harus bisa dihitung:

1. `marketing.cta.clicked`
2. `auth.signup.completed`
3. `trial.started`
4. `onboarding.started`
5. `onboarding.product_input_completed`
6. `content.draft.first_created`
7. `publishing.intent_recorded`
8. `trial.converted`

Jika salah satu event inti ini tidak stabil, funnel reporting belum layak dipakai untuk decision penting.

## Activation Definition

Activation utama CreatorFlow untuk fase launch:

- workspace menghasilkan `content.draft.first_created`
- dari produk atau brief nyata milik user
- dalam sesi onboarding awal atau sesi awal trial

Publish bukan syarat activation utama.

## Mapping To Read Models

Taxonomy ini sebaiknya diproyeksikan ke read model seperti:

- `analytics.event_log`
- activation funnel aggregate
- assisted conversion dashboard

Raw app log tetap berada di jalur observability, bukan menggantikan event product.

## Implementation Notes

### Web

Web sebaiknya emit:

- event CTA
- event onboarding step
- event draft viewed
- event assisted request

### Backend

Backend sebaiknya menjadi source of truth untuk:

- signup completed
- trial started
- first draft created
- publish job created
- billing and conversion events

Jika event kritis hanya dicatat dari frontend, data bisnis akan rapuh.

## Event Quality Rules

Sebelum event dianggap production-ready:

1. ada owner yang jelas
2. ada definisi kapan event dipicu
3. field wajib diketahui
4. tidak ada duplikasi nama untuk makna berbeda
5. ada test atau verification path yang masuk akal

## Suggested Next Step

Setelah taxonomy ini disetujui:

1. buat event contract di `contracts/events/analytics/`
2. mapping event penting ke `analytics.event_log`
3. buat dashboard activation funnel pertama
4. sinkronkan naming event lintas web dan backend

## Related Docs

- `creatorflow-next-development-brief.md`
- `creatorflow-product-foundation.md`
- `creatorflow-observability-logging.md`
- `creatorflow-database-architecture.md`
