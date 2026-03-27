# CreatorFlow Microservice Blueprint

## Purpose

Dokumen ini memetakan arsitektur awal CreatorFlow sebagai sistem berbasis microservice untuk produk AI Content Commerce:

- content creation
- affiliate content generation
- media processing
- publishing and scheduling
- analytics and monetization

Dokumen ini dimaksudkan sebagai blueprint implementasi awal, bukan final contract. Tujuannya adalah memberi batas domain yang jelas sejak awal sambil tetap menjaga MVP tetap realistis.

Dokumen ini harus dibaca bersama:

- `creatorflow-product-foundation.md`
- `creatorflow-next-development-brief.md`

Kedua dokumen tersebut memegang source of truth untuk ICP, positioning launch, proof model, dan prioritas development. Blueprint teknis di dokumen ini harus mengikuti guardrail produk tersebut.

Penyesuaian terbaru:

- fitur `trend-intelligence` resmi masuk ke scope produk
- arsitektur hybrid yang sudah dipilih repo tetap dipertahankan
- `trend-intelligence` diperlakukan sebagai logical domain baru, bukan alasan untuk menambah physical deployable pada fase sekarang

## Architecture Principles

1. Pisahkan domain berdasarkan business capability, bukan berdasarkan tabel atau halaman UI.
2. Gunakan komunikasi sinkron hanya untuk kebutuhan request user yang cepat.
3. Gunakan event dan queue untuk proses berat atau lama.
4. Setiap service memiliki ownership data sendiri.
5. Mulai dari logical microservices terlebih dahulu, lalu pecah deployment saat bottleneck nyata muncul.
6. Batasi jumlah bahasa utama agar beban operasional tidak meledak.

## System Context

CreatorFlow melayani alur utama berikut:

1. Product URL atau data produk menjadi script, CTA, caption, dan short video.
2. Video panjang menjadi clips, subtitle, dan post-ready assets.
3. Draft content dijadwalkan dan dipublikasikan ke beberapa platform.
4. Performa content dan affiliate dipantau untuk rekomendasi berikutnya.
5. Public signals yang legal dan stabil diolah menjadi watchlist topik, produk, dan angle yang layak diproduksi.

## Language Strategy

Strategi bahasa untuk CreatorFlow:

- gunakan `TypeScript` sebagai default language
- gunakan `Go` untuk service yang concurrency-heavy dan worker-heavy
- hindari memakai lebih dari dua bahasa utama pada fase awal
- `.NET` tetap valid, tetapi bukan pilihan default kecuali tim sangat kuat di C#

Alasan:

- `TypeScript` paling cepat untuk product iteration, frontend integration, auth flow, dan business API
- `Go` paling menarik untuk service yang fokus pada queue consumer, scheduler, retry, dan processing concurrency
- terlalu banyak bahasa akan memperberat hiring, debugging, observability, CI, dan kontrak antar service

## Recommended Language Per Service

### Primary recommendation

- `web-ui` -> `TypeScript`
- `api-gateway` -> `TypeScript`
- `identity-service` -> `TypeScript`
- `billing-service` -> `TypeScript`
- `content-service` -> `TypeScript`
- `affiliate-service` -> `TypeScript`
- `asset-service` -> `TypeScript`
- `trend-intelligence-service` -> `TypeScript`
- `media-processing-service` -> `Go`
- `publishing-service` -> `Go`
- `analytics-service` -> `Go`
- `notification-service` -> `TypeScript`
- `workflow-service` -> `Go`

### Why this split works

`TypeScript` cocok untuk:

- auth and workspace logic
- AI orchestration
- prompt management
- trend scoring ringan dan digest generation
- dashboard-facing API
- billing and notification flows

`Go` cocok untuk:

- background workers
- delayed jobs
- scheduler loops
- retry orchestration
- high-concurrency ingestion and publishing

### Note on `.NET`

`.NET` cocok bila:

- tim backend memang dominan C#
- ingin enterprise-style backend sejak awal
- ada kebutuhan kuat di area workflow, policy-heavy business logic, atau integrasi enterprise

Namun untuk CreatorFlow saat ini, kombinasi `TypeScript + Go` lebih ringan dan lebih seimbang antara kecepatan build dan performa.

## Framework Strategy

Framework yang direkomendasikan:

- `web-ui` -> `Next.js`
- `TypeScript` services -> `Fastify`
- `Go` services -> `Chi`

Catatan:

- `Node.js` adalah runtime untuk service TypeScript, bukan framework
- `Fastify` dipilih karena ringan, cepat, dan cocok untuk service API product-facing
- `Chi` dipilih karena tipis, mudah dirawat, dan cukup kuat untuk service Go yang fokus pada worker dan API internal
- `NestJS` dan `.NET` tetap valid, tetapi bukan default stack untuk fase awal CreatorFlow

## Runtime Baseline

Baseline runtime dan package resmi:

- package manager: `npm 10.x`
- `Node.js 22.x` untuk semua service TypeScript
- `Next.js 15.5.14` untuk fase aktif sekarang, dengan target upgrade ke `16.x` sebelum launch publik
- `Go 1.25.x` untuk service Go
- `PostgreSQL 17.x` sebagai database utama
- `Redis 7.x` sebagai cache, lock, dan event transport

Guardrail:

- gunakan hanya stack yang masih berada pada support window upstream
- standar detail disimpan di `SUPPORT_MATRIX.md`
- kebijakan dependency dan security disimpan di `SECURITY.md`

## Proposed Services

### 1. API Gateway / BFF

Peran:

- single entry point untuk frontend
- auth context propagation
- request aggregation
- rate limiting
- response shaping untuk dashboard

Contoh endpoint:

- `GET /me`
- `GET /dashboard/overview`
- `POST /content/generate`
- `POST /publish/schedule`

Catatan:

- Untuk web app, BFF cocok dipakai agar frontend tidak perlu tahu banyak endpoint internal.

### 2. Identity Service

Peran:

- user account
- workspace
- team membership
- role and permission
- API token internal jika diperlukan

Data ownership:

- `users`
- `workspaces`
- `memberships`
- `roles`
- `permissions`

Contoh endpoint:

- `POST /auth/register`
- `POST /auth/login`
- `GET /workspaces/:id`
- `POST /workspaces/:id/members`

### 3. Billing Service

Peran:

- subscription
- plan
- quota
- credit usage ledger
- add-on billing
- payment webhook handling

Data ownership:

- `plans`
- `subscriptions`
- `usage_ledger`
- `credit_balances`
- `billing_events`

Contoh endpoint:

- `GET /billing/entitlements`
- `POST /billing/checkout`
- `POST /billing/webhooks/provider`

### 4. Content Service

Peran:

- content idea generation
- hook generation
- script generation
- caption and CTA generation
- template and prompt orchestration

Data ownership:

- `content_ideas`
- `scripts`
- `captions`
- `ctas`
- `prompt_runs`
- `content_templates`

Contoh endpoint:

- `POST /ideas/generate`
- `POST /scripts/generate`
- `POST /captions/generate`
- `POST /content-briefs`

Catatan:

- Pada MVP, affiliate copy generation masih bisa ditangani di service ini.

### 5. Affiliate Service

Peran:

- import product metadata
- normalize product data
- manage affiliate source and campaign
- generate selling angle per product

Data ownership:

- `products`
- `affiliate_links`
- `campaigns`
- `product_snapshots`

Contoh endpoint:

- `POST /products/import`
- `GET /products/:id`
- `POST /campaigns`

Catatan:

- Jika ingin lebih ramping, service ini dapat digabung sementara ke Content Service pada fase awal.

### 6. Asset Service

Peran:

- file upload handling
- metadata extraction ringan
- object storage reference
- lifecycle asset

Data ownership:

- `assets`
- `uploads`
- `thumbnails`
- `media_metadata`

Contoh endpoint:

- `POST /assets/upload-url`
- `POST /assets/complete`
- `GET /assets/:id`

Catatan:

- Binary file tidak disimpan di database. Simpan di object storage, database hanya menyimpan metadata dan pointer.

### 7. Media Processing Service

Peran:

- clip generation
- subtitle generation
- voiceover merge
- format normalization
- final short video rendering

Data ownership:

- `render_jobs`
- `clip_jobs`
- `subtitle_jobs`
- `voiceover_jobs`
- `job_artifacts`

Contoh endpoint:

- `POST /renders`
- `POST /clips`
- `POST /subtitles`
- `GET /jobs/:id`

Catatan:

- Service ini paling cocok memakai worker async karena durasi kerja panjang dan CPU-heavy.

### 8. Publishing Service

Peran:

- social account connection
- draft post creation
- content calendar
- scheduler
- publish execution
- retry and failure tracking

Data ownership:

- `connected_accounts`
- `publish_jobs`
- `scheduled_posts`
- `published_posts`
- `publish_failures`

Contoh endpoint:

- `POST /accounts/connect`
- `POST /posts/schedule`
- `POST /posts/publish-now`
- `GET /calendar`

### 9. Analytics Service

Peran:

- event ingestion
- content performance aggregation
- affiliate attribution tracking
- top hook and angle detection
- future recommendation engine

Data ownership:

- `event_log`
- `metric_aggregates`
- `content_metrics`
- `affiliate_metrics`
- `recommendation_snapshots`

Contoh endpoint:

- `POST /events/ingest`
- `GET /analytics/content/:id`
- `GET /analytics/workspaces/:id/overview`

### 10. Trend Intelligence Service

Peran:

- collect public signals yang legal dan stabil
- normalize trend signal
- scoring momentum, acceleration, saturation, dan seasonality ringan
- generate digest harian atau mingguan
- menerjemahkan insight menjadi rekomendasi konten, produk, dan angle

Data ownership:

- `trend_sources`
- `trend_signal_snapshots`
- `trend_scores`
- `trend_recommendations`
- `trend_digests`

Contoh endpoint:

- `POST /trend/collect`
- `GET /trend/watchlist`
- `GET /trend/digests/latest`
- `POST /trend/recommendations/:id/content-request`

Catatan:

- Pada MVP, domain ini hidup sebagai modul internal di `api-gateway` dengan worker terjadwal sederhana.
- Forecast agresif `30/90 hari` dan klaim kepastian viral bukan target MVP.

### 11. Notification Service

Peran:

- in-app notification
- email notification
- job completion alert
- publish failure alert

Data ownership:

- `notifications`
- `notification_preferences`
- `delivery_attempts`

Contoh endpoint:

- `POST /notifications/send`
- `GET /notifications`

### 12. Workflow Service

Peran:

- orchestration proses lintas service
- long-running business workflow
- retry policy dan compensation step

Contoh workflow:

- product-to-video pipeline
- long-video-to-clips pipeline
- generate-and-schedule batch pipeline

Catatan:

- Workflow service dapat diwujudkan sebagai dedicated service atau sebagai workflow engine seperti Temporal.

## Recommended MVP Service Cut

Jangan deploy semua service di hari pertama. Untuk MVP V1, service yang paling masuk akal:

1. `api-gateway`
2. `identity-service`
3. `content-service`
4. `asset-service`
5. `trend-intelligence-service`
6. `media-processing-service`
7. `publishing-service`

Disederhanakan sementara:

- `billing-service` boleh minimal dulu jika monetization belum live
- `affiliate-service` dapat ditanam dulu di `content-service`
- `analytics-service` mulai dari event sink dan aggregate sederhana
- `notification-service` bisa berupa modul internal dulu

Bahasa untuk MVP cut:

- `api-gateway` -> `TypeScript`
- `identity-service` -> `TypeScript`
- `content-service` -> `TypeScript`
- `asset-service` -> `TypeScript`
- `trend-intelligence-service` -> `TypeScript`
- `media-processing-service` -> `Go`
- `publishing-service` -> `Go`

## Logical Services vs Physical Deployables

Untuk menghindari over-engineering, bedakan logical boundary dan physical deployable.

### Logical services pada MVP

- `identity-service`
- `content-service`
- `asset-service`
- `trend-intelligence-service`
- `media-processing-service`
- `publishing-service`

### Physical deployables pada MVP

1. `web-ui`
2. `api-gateway`
3. `media-processing-service`
4. `publishing-service`

Implementasi yang direkomendasikan:

- `identity-service`, `content-service`, `asset-service`, dan `trend-intelligence-service` tetap diperlakukan sebagai logical service boundary
- pada fase MVP, keempat domain tersebut diimplementasikan sebagai modul internal di dalam `api-gateway`
- `media-processing-service` dan `publishing-service` dipisah sejak awal karena punya scaling pattern dan worker model yang berbeda

### Extraction triggers

Modul di dalam `api-gateway` layak dipisah menjadi deployable terpisah jika salah satu hal ini terjadi:

- kebutuhan scale sudah berbeda secara nyata
- release cadence antar domain mulai berbeda
- ownership tim mulai terpisah
- database contention atau latency antar modul mulai terasa
- kebutuhan security boundary makin ketat

## Async Execution Strategy

Keputusan final untuk MVP:

- cross-service command memakai HTTP REST
- long-running work dimiliki dan dieksekusi oleh service pemilik domain
- state job disimpan di database service yang bersangkutan
- worker mengambil job dengan mekanisme lease berbasis database
- event lintas service memakai transactional outbox

### Cross-service commands

Contoh:

- `api-gateway` memanggil `POST /renders` ke `media-processing-service`
- `api-gateway` memanggil `POST /posts/schedule` ke `publishing-service`

Aturan:

- command bersifat sinkron
- service tujuan hanya menerima permintaan pembuatan job atau perubahan state
- hasil akhir job tidak dikembalikan dalam request yang sama

### Service-owned jobs

Setiap service async harus:

- menyimpan job record ke tabel miliknya sendiri
- menyimpan status, attempt count, dan lease metadata
- menjalankan worker yang mengklaim job menggunakan lease atau `FOR UPDATE SKIP LOCKED`

Tujuan:

- source of truth job tetap ada di database
- recovery setelah crash lebih sederhana
- tidak bergantung pada queue library yang hanya nyaman di satu bahasa

### Event propagation

Untuk event lintas service:

- gunakan transactional outbox di database service penulis
- relay process mengirim event ke transport yang netral bahasa
- untuk MVP, transport yang direkomendasikan adalah `Redis Streams`

Redis Streams dipakai untuk:

- analytics ingestion
- notification fan-out
- trend digest fan-out
- SSE fan-out bila dibutuhkan

Catatan penting:

- `BullMQ` bukan backbone integrasi lintas service
- `BullMQ` hanya opsional untuk workload internal di service TypeScript
- kontrak event tetap netral terhadap bahasa dan tidak bergantung pada library queue tertentu

## Service Dependencies

### Hard dependencies

- `api-gateway` -> semua service user-facing
- `content-service` -> capability entitlement atau billing
- `media-processing-service` -> asset contract dan storage access
- `publishing-service` -> asset contract, social account policy, dan storage access
- `analytics-service` -> event dari semua service penting
- `trend-intelligence-service` -> analytics signal feed dan content metadata

### Soft dependencies

- `content-service` -> `affiliate-service`
- `publishing-service` -> `notification-service`
- `trend-intelligence-service` -> `analytics-service`, `content-service`, dan `affiliate-service`
- `workflow-service` -> semua service lintas domain

### MVP physical simplification

Pada fase MVP:

- dependency logical ke `identity-service`, `content-service`, `asset-service`, `trend-intelligence-service`, dan billing capability dipenuhi oleh modul di `api-gateway`
- `media-processing-service` dan `publishing-service` sebaiknya menerima input yang sudah resolved, seperti storage pointer, metadata penting, dan policy yang relevan
- hindari runtime chatty call yang tidak perlu dari Go services ke modul internal `api-gateway`

## Communication Model

### Synchronous APIs

Gunakan sync call untuk:

- login dan workspace data
- fetch dashboard summary
- create draft content
- create publish schedule
- check quota and entitlements

Transport yang cocok:

- REST JSON untuk awal
- gRPC bisa dipertimbangkan nanti jika internal traffic tinggi

### Asynchronous Events

Gunakan async event untuk:

- asset uploaded
- script generated
- render requested
- render completed
- subtitle completed
- post scheduled
- post published
- publish failed
- trend signal collected
- trend digest generated
- trend recommendation created
- usage recorded

Contoh event names:

- `product.imported`
- `content.script.generated`
- `asset.upload.completed`
- `media.render.requested`
- `media.render.completed`
- `media.subtitle.completed`
- `publish.post.scheduled`
- `publish.post.published`
- `publish.post.failed`
- `trend.signal.collected`
- `trend.digest.generated`
- `trend.recommendation.created`
- `analytics.event.recorded`

Catatan implementasi:

- command lintas service tetap melalui REST
- event digunakan untuk notifikasi downstream, bukan sebagai pengganti command utama
- event publishing mengikuti outbox pattern agar tidak hilang saat crash

## Core User Flows

### Flow A: Product URL to Affiliate Video

1. User submit product URL via frontend.
2. `api-gateway` memvalidasi identity dan entitlement.
3. `affiliate-service` atau `content-service` mengekstrak metadata produk.
4. `content-service` membuat angle, hook, script, caption, dan CTA.
5. `asset-service` menyimpan asset produk yang diperlukan.
6. `media-processing-service` menerima `media.render.requested`.
7. Hasil render disimpan ke `asset-service`.
8. `publishing-service` membuat draft atau schedule.
9. `analytics-service` menerima event untuk tracking funnel.

### Flow B: Long Video to Clips

1. User upload video panjang.
2. `asset-service` membuat upload session dan metadata asset.
3. `media-processing-service` memotong clip, membuat subtitle, dan thumbnail.
4. `content-service` menghasilkan hook dan caption untuk tiap clip.
5. `publishing-service` menyusun calendar draft atau auto schedule.
6. `analytics-service` menyimpan performa clip saat publish berjalan.

### Flow C: Generate and Schedule at Scale

1. User pilih campaign, channel, dan jadwal.
2. `workflow-service` memicu batch content generation.
3. `content-service` dan `media-processing-service` memproses item per item.
4. `publishing-service` membuat scheduled posts.
5. `notification-service` memberi tahu item yang gagal atau selesai.

### Flow D: Trend to Content Recommendation

1. Collector `trend-intelligence-service` membaca public signals yang legal dan stabil sesuai source policy.
2. Signal dinormalisasi dan diberi score sederhana berbasis momentum, acceleration, saturation, dan seasonality ringan.
3. `trend-intelligence-service` menghubungkan signal dengan niche workspace, kategori produk, dan campaign aktif.
4. Digest harian atau mingguan ditampilkan di dashboard sebagai watchlist.
5. User dapat mengubah recommendation menjadi content request baru lewat `api-gateway`.

## Data Storage Strategy

### Primary store

- PostgreSQL sebagai database utama
- gunakan `1 physical database` pada fase awal

### Separation model

- satu cluster atau instance Postgres pada awal
- satu physical database pada awal
- satu schema per service agar boundary tetap jelas
- hindari query silang langsung antar schema sebagai kebiasaan aplikasi

Contoh:

- `identity.users`
- `content.scripts`
- `trend.trend_recommendations`
- `media.render_jobs`
- `publishing.scheduled_posts`
- `analytics.event_log`

### Secondary stores

- Redis untuk cache, distributed lock, dan event transport
- S3-compatible object storage untuk video, image, subtitle, dan artifact render

## MVP Infrastructure Decisions

### Redis

Keputusan:

- pakai dari awal

Alasan:

- dipakai untuk cache dan rate limiting ringan
- dipakai untuk distributed lock dan ephemeral coordination
- dipakai sebagai transport event netral bahasa melalui `Redis Streams`
- berguna untuk mencegah double execution pada alur publish yang sensitif

Rekomendasi:

- gunakan `Redis Streams` untuk event propagation lintas service
- gunakan `BullMQ` hanya jika ada workload internal Node.js yang memang membutuhkan queue helper
- collector dan digest `trend-intelligence` boleh memakai worker internal yang dijadwalkan, selama source of truth state tetap di PostgreSQL

### RabbitMQ

Keputusan:

- tunda dulu untuk MVP

Alasan:

- kebutuhan awal lebih dominan job processing daripada complex event routing
- `PostgreSQL job tables + Redis Streams` sudah cukup untuk delayed jobs, retry, dan event propagation awal
- menambah RabbitMQ sejak awal hanya menambah kompleksitas operasional

Gunakan RabbitMQ nanti jika:

- banyak consumer independen mulai membutuhkan fan-out event yang kompleks
- routing event antar domain makin kaya dan tidak lagi nyaman dikelola di queue sederhana
- kebutuhan integrasi lintas service dan lintas bahasa meningkat

### Scheduler

Keputusan:

- wajib ada sejak MVP

Alasan:

- scheduling adalah core value dari publishing flow
- user butuh publish di waktu tertentu, bukan hanya publish manual

Desain awal:

- schedule disimpan di database dengan waktu UTC
- worker periodik mencari job yang sudah due
- worker mengklaim job dengan lease agar tidak double process
- publish menggunakan idempotency key per target post
- retry dan failure state dikelola di `publishing-service`

Catatan:

- pada fase awal belum perlu scheduler service yang kompleks
- scheduler cukup menjadi modul atau worker khusus di `publishing-service`
- setelah crash, worker baru harus bisa melanjutkan job lease yang sudah expired

### WebSocket

Keputusan:

- belum wajib untuk MVP

Alasan:

- kebutuhan realtime awal masih dominan satu arah dari server ke client
- progress render, status publish, dan refresh dashboard masih bisa ditangani dengan polling atau SSE
- WebSocket menambah kompleksitas pada auth, reconnect, scaling, dan connection lifecycle

Strategi bertahap:

- fase awal: REST + polling untuk dashboard umum
- fase awal-plus: SSE untuk progress render, clipping, subtitle, dan publish status
- fase lanjut: WebSocket gateway jika ada collaborative editing, live control room, atau dashboard realtime dua arah

## Queue and Workflow Recommendations

### Primary job backbone

Untuk MVP, backbone utama job processing adalah:

- tabel job di PostgreSQL per service
- worker leasing berbasis database
- `Redis Streams` untuk event propagation lintas service

Alasan:

- lebih konsisten untuk arsitektur campuran `TypeScript + Go`
- source of truth lebih mudah diaudit
- recovery state job dan retry lebih mudah dikendalikan
- tidak mengunci integrasi lintas service ke library Node.js

### Optional queue helper

Gunakan queue untuk:

- render
- clipping
- subtitle
- publish retries
- analytics ingestion
- trend collection dan digest generation

Pilihan tambahan yang pragmatis untuk Node.js:

- BullMQ + Redis

Catatan:

- gunakan hanya untuk workload internal service TypeScript
- jangan jadikan BullMQ sebagai kontrak lintas service

### Workflow

Gunakan workflow engine jika:

- proses lintas service mulai panjang
- retry harus deterministik
- butuh compensation step yang rapi

Pilihan matang:

- Temporal

Jika ingin ringan pada tahap awal:

- orchestrator internal sederhana di `workflow-service`

## Realtime Delivery Strategy

### Polling

Cocok untuk:

- dashboard ringkas
- daftar content
- daftar schedule
- analytics summary yang tidak butuh update detik-ke-detik

### SSE

Cocok untuk:

- render progress
- clip generation progress
- subtitle completion
- publish success atau failure event

Catatan:

- SSE lebih ringan daripada WebSocket untuk pola update satu arah
- sangat cocok untuk MVP CreatorFlow

### WebSocket

Cocok untuk:

- live selling control room
- realtime collaboration
- multi-user workspace editing
- live stream status orchestration

Keputusan saat ini:

- simpan sebagai roadmap, bukan dependency awal

## Contract System

Untuk arsitektur multi-language, source of truth kontrak harus eksplisit.

Keputusan final:

- HTTP contract memakai `OpenAPI`
- event contract memakai `JSON Schema` dan dapat dibungkus dokumentasi `AsyncAPI`
- kontrak disimpan terpisah dari implementasi
- type dan client code di-generate dari contract, bukan ditulis manual sebagai sumber utama

### Contract locations

Struktur yang direkomendasikan:

```text
contracts/
  http/
    api-gateway/
    media-processing-service/
    publishing-service/
  events/
    content/
    media/
    publishing/
    trend/
```

### Change policy

Aturan yang wajib:

- setiap endpoint publik atau internal yang lintas deployable harus punya spesifikasi `OpenAPI`
- setiap event lintas service harus punya schema dan versi
- breaking change harus menaikkan versi major contract
- CI harus gagal jika spec dan generated artifact tidak sinkron

### Code generation

Gunakan generated artifact untuk:

- TypeScript types dan API clients
- Go structs atau validation bindings
- event payload validation

Tujuan:

- mencegah drift antar bahasa
- membuat review perubahan kontrak lebih jelas
- menurunkan biaya integrasi lintas service

Generated artifact dapat ditempatkan di:

- `packages/event-contracts`
- package client internal
- service-local generated folder

Namun source of truth tetap berada di `contracts/`

## Security and Access Control

Minimal requirement:

- JWT atau session token untuk user auth
- service-to-service auth untuk internal API
- RBAC per workspace
- signed upload URL untuk asset upload
- audit log untuk aksi sensitif

Contoh aksi sensitif:

- connect social account
- publish post
- manage team member
- change plan or quota

## Observability

Minimal observability sejak awal:

- structured logs
- request id dan correlation id
- metrics untuk queue length, render duration, publish success rate
- error tracking

Yang perlu dipantau khusus:

- render latency
- publish failure rate per platform
- quota overrun
- asset upload completion rate
- workflow failure hotspot
- collector freshness dan source health untuk `trend-intelligence`
- digest generation success rate

## Failure and Reliability Design

### Wajib diperhatikan

- idempotency untuk publish
- retry policy untuk API pihak ketiga
- dead-letter queue untuk job yang gagal berulang
- timeout dan circuit breaker untuk provider eksternal
- status machine yang jelas pada job media dan publish

### Contoh job state

- `queued`
- `processing`
- `completed`
- `failed`
- `cancelled`

## Suggested Monorepo Layout

```text
contracts/
  http/
  events/
apps/
  web-ui/
  api-gateway/
services/
  identity-service/
  billing-service/
  content-service/
  affiliate-service/
  asset-service/
  trend-intelligence-service/
  media-processing-service/
  publishing-service/
  analytics-service/
  notification-service/
  workflow-service/
packages/
  event-contracts/
  config/
  logger/
  auth/
  database/
infra/
  docker/
  terraform/
  scripts/
docs/
  creatorflow-microservice-blueprint.md
  creatorflow-database-architecture.md
  creatorflow-email-architecture.md
  creatorflow-project-structure.md
```

## Initial Build Layout

Struktur yang lebih realistis untuk fase implementasi pertama:

```text
contracts/
  http/
  events/
apps/
  web-ui/
  api-gateway/
services/
  media-processing-service/
  publishing-service/
packages/
  event-contracts/
  config/
  logger/
  auth/
  database/
infra/
  docker/
  scripts/
docs/
  creatorflow-microservice-blueprint.md
  creatorflow-database-architecture.md
  creatorflow-email-architecture.md
  creatorflow-project-structure.md
```

Catatan:

- `identity-service`, `content-service`, `asset-service`, dan `trend-intelligence-service` hidup sebagai modul internal di `api-gateway` pada fase MVP
- `billing-service`, `affiliate-service`, `analytics-service`, `notification-service`, dan `workflow-service` dapat menyusul setelah MVP flow stabil
- `database` package dipakai untuk shared database tooling, bukan untuk mencampur domain logic antar service

## Suggested Rollout Plan

### Phase 0: Foundation

- siapkan monorepo
- buat `api-gateway`
- buat modul `identity`, `content`, `asset`, dan `trend-intelligence` di `api-gateway`
- buat shared contracts di `contracts/`
- siapkan Postgres, Redis, dan object storage

### Phase 1: MVP Core

- bangun `media-processing-service`
- bangun `publishing-service`
- buat flow product-to-video, long-video-to-clips, dan trend digest basic

### Phase 2: Commercial Readiness

- tambah `billing-service`
- tambah event ingestion analytics
- tambah notification dan retry visibility
- matangkan scoring dan recommendation quality `trend-intelligence`

### Phase 3: Separation and Scale

- pecah `affiliate-service` jika domain mulai berat
- tambah workflow engine
- tambah multi-account approval flow
- tambah recommendation layer

## Recommendation

Rekomendasi implementasi:

1. Desain seperti microservice dari awal.
2. Deploy hanya service yang benar-benar punya scaling pattern berbeda.
3. Jangan pecah terlalu dini pada domain yang belum terbukti padat.

Pilihan paling sehat untuk CreatorFlow saat ini adalah hybrid:

- microservice untuk `media-processing-service` dan `publishing-service`
- modul internal di `api-gateway` untuk `identity-service`, `content-service`, `asset-service`, dan `trend-intelligence-service`
- `affiliate-service` dan `analytics-service` bertumbuh bertahap

## First Build Candidates

Jika eksekusi dimulai sekarang, urutan build yang paling masuk akal:

1. `api-gateway`
2. modul `identity`
3. modul `content`
4. modul `asset`
5. modul `trend-intelligence`
6. `media-processing-service`
7. `publishing-service`

Dengan urutan ini, CreatorFlow sudah bisa mendukung:

- generate script and caption
- trend watchlist dan digest recommendation ringan
- upload source asset
- render short video
- schedule publish
- menyisakan analytics dan billing untuk fase berikutnya

## MVP Stack Recommendation

Stack awal yang paling sehat untuk CreatorFlow:

- `TypeScript` untuk product-facing services
- `Go` untuk worker-heavy services
- `Next.js` untuk `web-ui`
- `Fastify` untuk `api-gateway`
- `Chi` untuk service Go
- PostgreSQL untuk primary data
- PostgreSQL job tables untuk source of truth async work
- `pg + Kysely` untuk TypeScript data access
- `pgx + sqlc` untuk Go data access
- Redis untuk cache, lock, rate limit, dan `Redis Streams`
- `OpenAPI + JSON Schema` untuk contract system
- S3-compatible object storage untuk media asset
- REST API untuk komunikasi utama
- SSE untuk realtime progress yang ringan

Yang belum perlu dijadikan dependency awal:

- RabbitMQ
- WebSocket gateway
- BullMQ sebagai backbone lintas service
- workflow engine berat seperti Temporal

## Final Recommendation

Kombinasi yang direkomendasikan untuk CreatorFlow:

- `TypeScript` sebagai bahasa default
- `Go` untuk service yang paling sensitif terhadap concurrency dan throughput
- `PostgreSQL` sebagai single primary database engine
- `Node.js 22.x`, `Go 1.25.x`, dan `PostgreSQL 17.x` sebagai runtime baseline resmi
- `npm` sebagai single package manager untuk monorepo
- `SQL-first` sebagai migration strategy
- tidak memakai `.NET` pada fase awal kecuali ada alasan tim yang kuat

Keuntungan keputusan ini:

- cepat untuk meluncurkan MVP
- tetap punya jalur performa yang bagus untuk media dan publishing workloads
- beban operasional masih terkendali karena hanya dua bahasa utama
