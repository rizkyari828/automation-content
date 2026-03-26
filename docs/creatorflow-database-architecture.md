# CreatorFlow Database Architecture

## Purpose

Dokumen ini mendefinisikan arsitektur database awal untuk CreatorFlow dengan fokus pada:

- biaya serendah mungkin pada fase MVP
- performance yang sehat untuk growth awal
- durability yang cukup kuat untuk data auth, billing, scheduling, dan job state

## Final Recommendation

Untuk fase awal, gunakan:

- `1 PostgreSQL server atau managed instance`
- `1 physical database`
- `multiple schemas per domain atau service`

Stack resmi yang direkomendasikan:

- database engine: `PostgreSQL`
- target major version: `17.x`
- migration style: `SQL-first`
- TypeScript access layer: `pg` + `Kysely`
- Go access layer: `pgx` + `sqlc`
- cache and event transport: `Redis`
- media storage: `S3-compatible object storage`

Rekomendasi nama:

- server atau instance: sesuai provider
- database utama: `creatorflow`

Schema awal:

- `identity`
- `content`
- `asset`
- `billing`
- `notification`
- `analytics`
- `trend`
- `publishing`
- `media`

## Why This Shape

Alasan utama:

- paling murah untuk mulai
- operasional lebih sederhana
- backup dan restore lebih mudah
- boundary domain tetap terjaga lewat schema
- cocok dengan arsitektur hybrid saat ini

Jangan mulai dari:

- banyak physical database per service
- database engine berbeda-beda

Itu biasanya menambah kompleksitas terlalu dini.

## Official Data Stack

### 1. Primary database

Gunakan:

- `PostgreSQL` sebagai database utama
- `PostgreSQL 17.x` sebagai baseline runtime

Alasan:

- relational model cocok untuk auth, billing, workspace, scheduling, dan job state
- konsisten untuk durability tinggi
- cukup kuat untuk MVP sampai early growth

### 2. Migration strategy

Gunakan:

- `SQL-first migrations`

Prinsip:

- source of truth schema berada di file SQL migration
- jangan jadikan ORM schema TypeScript sebagai sumber utama
- setiap domain tetap punya folder migration sendiri secara logical

Rekomendasi struktur:

```text
packages/database/
  migrations/
    identity/
    content/
    asset/
    billing/
    notification/
    analytics/
    trend/
    publishing/
    media/
```

### 3. TypeScript database layer

Gunakan:

- `pg` untuk PostgreSQL driver
- `Kysely` untuk query builder typed

Alasan:

- tetap dekat ke SQL
- lebih netral untuk arsitektur multi-language
- tidak memaksa schema-as-code sebagai source of truth utama
- cocok untuk `api-gateway` dan modul TypeScript lainnya

### 4. Go database layer

Gunakan:

- `pgx` untuk PostgreSQL driver dan pooling
- `sqlc` untuk generate typed query code dari SQL

Alasan:

- performa dan stabilitas bagus
- cocok untuk service Go yang worker-heavy
- menjaga source of truth query tetap dekat ke SQL

### 5. Cache and coordination

Gunakan:

- `Redis 7.x`

Dipakai untuk:

- cache
- distributed lock
- rate limiting
- `Redis Streams`

### 6. Media storage

Gunakan:

- `S3-compatible object storage`

Pilihan:

- local: `MinIO`
- production hemat: `Cloudflare R2`
- production umum: `Amazon S3`

### 7. Optional later

Yang boleh masuk nanti jika benar-benar dibutuhkan:

- `pgvector` untuk semantic search atau embeddings
- `ClickHouse` untuk analytics skala besar
- `PgBouncer` untuk connection pooling tingkat lanjut

## Why Not Prisma as Default

`Prisma` bagus untuk kasus tertentu, tetapi bukan pilihan default untuk CreatorFlow.

Alasan:

- arsitektur kita multi-language, bukan hanya TypeScript
- `Prisma` cenderung menjadikan TypeScript schema sebagai pusat gravitasi
- kurang ideal jika service Go juga harus mengikuti kontrak database yang sama
- pendekatan `SQL-first` lebih netral, lebih transparan, dan lebih sehat untuk hybrid architecture ini

## Why Not Multiple SQL Engines

Jangan campur `PostgreSQL`, `MySQL`, atau `MongoDB` dari awal.

Alasan:

- cost operasional naik
- observability lebih rumit
- migration dan backup lebih ribet
- manfaat nyatanya belum terasa pada fase MVP

## Physical Topology

### MVP

Gunakan:

- `1 primary PostgreSQL instance`
- storage SSD
- automated backups
- point-in-time recovery jika provider mendukung

Belum perlu:

- read replica
- sharding
- dedicated analytics database

### Later

Tambahkan berikut ini hanya jika dibutuhkan:

- read replica untuk query read-heavy
- database terpisah untuk analytics
- database terpisah untuk media jobs jika volume sangat tinggi

## Database Model

### Database level

Gunakan satu database:

- `creatorflow`

### Schema level

Pisahkan domain pada level schema:

- `identity.*`
- `content.*`
- `asset.*`
- `billing.*`
- `notification.*`
- `analytics.*`
- `trend.*`
- `publishing.*`
- `media.*`

### Table ownership rule

Setiap schema memiliki tabel dan migration miliknya sendiri.

Aturan:

- schema owner tidak boleh ditulis bebas oleh domain lain
- hindari join silang schema sebagai kebiasaan default
- untuk integrasi antar domain, lebih aman gunakan service boundary atau read model yang disengaja

## Suggested Schema and Tables

### `identity`

Tabel awal:

- `users`
- `workspaces`
- `memberships`
- `sessions`
- `email_verification_tokens`
- `password_reset_tokens`

Catatan:

- token sebaiknya disimpan dalam bentuk hash bila memungkinkan

### `content`

Tabel awal:

- `ideas`
- `scripts`
- `captions`
- `ctas`
- `prompt_runs`
- `content_templates`

### `asset`

Tabel awal:

- `assets`
- `uploads`
- `media_metadata`
- `thumbnails`

Catatan:

- file binary tidak disimpan di database
- simpan pointer object storage, checksum, mime type, size, duration, dan metadata penting

### `billing`

Tabel awal:

- `plans`
- `subscriptions`
- `payments`
- `payment_webhook_events`
- `usage_ledger`
- `credit_balances`

Catatan:

- `payment_webhook_events` penting untuk idempotency dan audit

### `notification`

Tabel awal:

- `email_messages`
- `email_deliveries`
- `notification_preferences`

### `analytics`

Tabel awal:

- `event_log`
- `metric_aggregates`

Catatan:

- `event_log` akan cepat membesar
- desain retention harus dipikirkan sejak awal

### `trend`

Tabel awal:

- `trend_sources`
- `trend_collection_runs`
- `trend_signal_snapshots`
- `trend_scores`
- `trend_recommendations`
- `trend_digests`

Catatan:

- mulai dari public signals yang legal dan stabil
- raw signal dan score harus tetap bisa diaudit ulang jika recommendation terlihat aneh
- forecast agresif `30/90 hari` tidak perlu menjadi fondasi schema MVP

### `publishing`

Tabel awal:

- `connected_accounts`
- `scheduled_posts`
- `publish_jobs`
- `published_posts`
- `publish_failures`

### `media`

Tabel awal:

- `render_jobs`
- `clip_jobs`
- `subtitle_jobs`
- `job_artifacts`

## Performance Strategy

### 1. Connection management

Gunakan connection pool.

Aturan awal:

- batasi pool per service
- jangan biarkan setiap worker membuka terlalu banyak koneksi
- pastikan total koneksi aman untuk satu instance PostgreSQL

Jika nanti concurrency naik:

- pertimbangkan `PgBouncer`

Rekomendasi awal:

- `api-gateway` pool kecil hingga sedang
- worker Go memakai pool yang ketat dan terukur
- hindari default pool besar di semua process

### 2. Indexing discipline

Jangan index berlebihan.

Index yang hampir pasti dibutuhkan:

- primary key
- foreign key yang sering dipakai untuk lookup
- `workspace_id`
- `user_id`
- `status`
- `created_at`
- `scheduled_at`
- `updated_at` bila sering dipakai sorting atau polling

Contoh penting:

- `publishing.scheduled_posts(workspace_id, scheduled_at)`
- `publishing.publish_jobs(status, scheduled_at)`
- `media.render_jobs(status, created_at)`
- `billing.payments(workspace_id, created_at)`
- `identity.sessions(user_id, expires_at)`

### 3. Hot-path table design

Untuk job polling dan scheduler:

- gunakan query yang sempit
- filter berdasarkan `status`
- filter berdasarkan due time
- index kolom lease dan schedule dengan benar

Contoh pola:

- `status = 'queued'`
- `scheduled_at <= now()`
- `lease_expires_at IS NULL OR lease_expires_at < now()`

### 4. Large table strategy

Tabel yang paling cepat tumbuh:

- `analytics.event_log`
- `billing.payment_webhook_events`
- `media.job_artifacts`
- `notification.email_deliveries`
- `trend.trend_signal_snapshots`

Strategi:

- retention policy
- archive atau cleanup periodik
- partitioning jika ukuran mulai besar

### 5. Partitioning

Jangan partisi semua tabel dari awal.

Pertimbangkan partitioning untuk:

- `analytics.event_log`
- `billing.payment_webhook_events`
- `trend.trend_signal_snapshots`
- job log atau delivery log yang append-only

Pola yang cocok:

- partition by month berdasarkan `created_at`

## Durability Strategy

### 1. Data classes

Data CreatorFlow tidak semuanya sama kritis.

#### Critical

- user
- workspace membership
- subscription
- payment record
- payment webhook event
- scheduled publish
- connected account metadata

#### Important

- scripts
- captions
- media job state
- asset metadata
- active trend recommendations yang sedang ditampilkan ke user

#### Rebuildable

- metric aggregate tertentu
- cache-like derived records
- temporary processing artifacts
- public trend snapshots yang bisa dikoleksi ulang selama source masih tersedia
- digest trend yang sepenuhnya derived dari signal dan score

Prioritas backup dan restore harus mengikuti kelas data ini.

### 2. Backup policy

Minimal untuk production:

- automated daily snapshot
- point-in-time recovery
- simpan beberapa hari hingga beberapa minggu sesuai budget

Minimal untuk staging:

- snapshot reguler
- tidak harus selama production

### 3. Restore readiness

Backup tidak cukup jika restore belum pernah diuji.

Aturan:

- lakukan uji restore berkala
- dokumentasikan langkah restore
- pahami target `RPO` dan `RTO`

Target praktis awal:

- `RPO`: sekecil mungkin, idealnya hitungan menit jika PITR aktif
- `RTO`: puluhan menit hingga beberapa jam pada fase awal masih realistis

### 4. Idempotency and audit

Untuk durability bisnis, bukan hanya storage:

- simpan event webhook payment mentah yang sudah diverifikasi
- simpan idempotency key untuk publish sensitif
- simpan transition state penting

Ini penting agar sistem bisa pulih tanpa menggandakan aksi bisnis.

## Job Table Design

Karena job backbone berada di PostgreSQL, desain job table harus rapi.

Kolom yang direkomendasikan:

- `id`
- `workspace_id`
- `status`
- `attempt_count`
- `max_attempts`
- `scheduled_at`
- `lease_owner`
- `lease_expires_at`
- `created_at`
- `updated_at`
- `last_error`

Status minimum:

- `queued`
- `processing`
- `completed`
- `failed`
- `cancelled`

Aturan:

- worker mengambil job dengan lease
- worker yang crash harus kehilangan lease setelah timeout
- worker baru boleh klaim job yang lease-nya expired

## Security and Data Protection

Aturan dasar:

- encrypt disk atau gunakan managed database encryption
- batasi role database per service
- jangan pakai superuser untuk aplikasi
- audit table sensitif seperti billing dan publish
- jangan simpan refresh token platform sosial dalam plain text tanpa proteksi aplikasi

## Migration Strategy

Setiap schema punya migration sendiri secara logical.

Prinsip:

- migration harus repeatable dan versioned
- perubahan destructive dihindari tanpa rollout plan
- data migration besar dilakukan bertahap

Urutan sehat:

1. create new column or table
2. dual write atau backfill
3. switch read path
4. cleanup lama setelah aman

### Migration tooling recommendation

Untuk fase awal:

- migration runner boleh sederhana
- SQL files tetap menjadi sumber utama

Yang penting:

- migration bisa dijalankan repeatable di local, staging, dan production
- ada urutan yang deterministik
- rollback tidak diasumsikan selalu mudah, jadi rollout harus hati-hati

## Observability for Database

Yang wajib dipantau:

- CPU dan memory database
- storage growth
- active connections
- slow query
- lock wait
- deadlock
- replication lag jika nanti ada replica

Query yang perlu diawasi khusus:

- scheduler polling
- publish job leasing
- render job leasing
- event ingestion analytics
- payment webhook idempotency lookup
- trend collector freshness lookup
- trend recommendation retrieval per workspace

## Growth Path

### Phase 0

- `1 instance`
- `1 database`
- `multiple schemas`

### Phase 1

- tambah connection pooling
- tambah retention dan archive job untuk table besar
- mulai partisi `analytics.event_log` jika perlu
- mulai retention policy untuk `trend.trend_signal_snapshots`

### Phase 2

- tambah read replica jika read-heavy
- pecah `analytics` ke store terpisah jika benar-benar berat
- pecah `media` ke database terpisah jika job tables dan artifact metadata mulai mengganggu OLTP
- pecah `trend` ke service atau store terpisah jika volume signal ingestion mulai mengganggu workload transactional utama

## What Not to Do

- jangan buat banyak physical database sejak awal hanya demi “microservice purity”
- jangan campur binary file ke PostgreSQL
- jangan jadikan analytics log tanpa batas retention
- jangan biarkan worker pool membuka koneksi terlalu banyak
- jangan skip backup test

## Final Recommendation

Untuk CreatorFlow saat ini:

- `1 PostgreSQL instance`
- `1 physical database`
- `schema per domain`
- `SQL-first migrations`
- `pg + Kysely` untuk TypeScript
- `pgx + sqlc` untuk Go
- `Redis 7.x` untuk cache, lock, dan event transport
- `S3-compatible object storage` untuk media
- job state tetap di PostgreSQL
- schema `trend` dipakai untuk trend signal, score, recommendation, dan digest pada fase awal
- backup otomatis + PITR
- indexing disiplin
- partitioning hanya untuk tabel yang benar-benar tumbuh besar

Ini adalah titik paling sehat antara biaya, performance, dan durability untuk MVP sampai early growth.
