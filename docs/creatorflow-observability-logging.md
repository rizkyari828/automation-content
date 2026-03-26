# CreatorFlow Observability and Logging Blueprint

## Purpose

Dokumen ini menjabarkan strategi observability dan logging untuk CreatorFlow dengan fokus pada:

- production monitoring yang realistis untuk fase MVP
- pemisahan yang jelas antara raw application logs, audit logs, dan activity feed
- standar field log lintas `TypeScript` dan `Go`
- jalur implementasi yang cocok dengan arsitektur repo saat ini

## Final Recommendation

Keputusan utama:

- setiap service tetap membuat log sendiri
- semua service memakai structured log yang konsisten
- raw application log dikumpulkan terpusat oleh infra observability, bukan oleh service aplikasi lain
- UI internal tidak menampilkan raw log penuh sebagai tampilan utama
- UI internal menampilkan activity feed, audit history, job state, dan ringkasan health

Artinya, CreatorFlow tidak perlu membuat "logging-service" khusus yang menjadi dependency sinkron bagi semua service.

Pola yang disarankan:

1. service menulis log JSON ke `stdout`
2. collector infra mengambil log dari container atau process
3. log masuk ke centralized log store
4. event domain penting diproyeksikan ke database untuk kebutuhan UI internal
5. aksi sensitif dicatat ke audit table yang terpisah dari raw log

## Why This Fits The Current Repo

Kondisi repo saat ini sudah mendukung arah ini:

- `apps/api-gateway` sudah memakai Fastify logger
- `packages/logger` sudah disiapkan sebagai shared package untuk structured logger dan correlation helper
- `services/media-processing-service` dan `services/publishing-service` sudah punya tabel job state
- `services/media-processing-service` dan `services/publishing-service` sudah punya `outbox_events`
- dokumen database sudah merencanakan `analytics.event_log`

Implikasinya:

- raw app log tidak perlu dimasukkan ke PostgreSQL
- status dan hasil job tetap menjadi source of truth di tabel domain
- UI internal bisa membaca event yang sudah diproyeksikan ke `analytics.event_log`
- audit aksi sensitif bisa disimpan terpisah agar query dan retention lebih sehat

## Observability Layers

### 1. Application logs

Tujuan:

- debugging
- incident investigation
- mencari error detail per request, per job, atau per worker

Sifat:

- append-only
- noisy
- cocok untuk centralized log store
- tidak cocok menjadi data utama UI dashboard

Contoh:

- HTTP request masuk
- worker lease acquired
- publish retry scheduled
- provider API timeout
- unexpected panic atau unhandled exception

### 2. Metrics

Tujuan:

- pantau health secara cepat
- alerting
- capacity planning

Contoh metric yang paling penting:

- request rate
- error rate
- response latency
- queue length
- job processing duration
- publish success rate per platform
- render failure rate
- scheduler lag

### 3. Error tracking

Tujuan:

- menangkap exception yang perlu ditindak
- mengelompokkan error serupa
- membantu triage incident

Contoh:

- uncaught exception di `api-gateway`
- panic di worker Go
- provider integration error yang melonjak tiba-tiba

### 4. Audit logs

Tujuan:

- mencatat aksi sensitif dan dapat dipertanggungjawabkan
- menjawab "siapa melakukan apa, kapan, dari mana"

Contoh aksi sensitif:

- connect atau revoke social account
- publish post secara manual
- change workspace member role
- change billing plan
- rotate internal secret

### 5. Activity feed and operational events

Tujuan:

- memberi timeline operasional yang berguna di UI internal
- menjembatani domain state dengan dashboard ops

Contoh event:

- render job queued
- render job completed
- publish job failed
- publish job retried
- webhook delivery failed
- social account expired

## What Must Not Happen

Jangan lakukan hal berikut:

- semua service menulis raw log ke satu service internal secara sinkron
- semua raw log dimasukkan ke PostgreSQL utama
- UI utama membaca raw log langsung dari centralized log store tanpa filter domain
- raw stack trace ditampilkan ke end user atau admin non-technical sebagai tampilan default

Risiko utama dari pendekatan itu:

- coupling antar service naik
- bottleneck baru muncul di jalur logging
- biaya database membesar untuk data yang jarang dibaca
- UI cepat menjadi noisy dan tidak actionable

## Proposed Data Flow

### HTTP and worker flow

1. request masuk ke `api-gateway`
2. gateway membuat atau meneruskan `requestId` dan `correlationId`
3. field tersebut dipropagasikan ke service internal
4. setiap service menulis raw log ke `stdout`
5. jika terjadi perubahan state domain, service menulis domain record dan `outbox_events` dalam transaksi yang sama bila relevan
6. projector atau consumer internal memproses outbox menjadi activity event dan audit log
7. UI internal membaca read model dari database, bukan raw container logs

### Infra flow

1. container atau process menghasilkan structured log
2. log collector mengambil log dari runtime
3. log disimpan di centralized log store
4. query raw log dilakukan berdasarkan `service`, `requestId`, `correlationId`, `jobId`, atau `workspaceId`

## Shared Log Contract

Semua service harus memakai field dasar yang sama, walau library logging-nya berbeda.

### Required fields

- `timestamp`
- `level`
- `service`
- `environment`
- `message`

### Correlation fields

- `requestId`
- `correlationId`
- `traceId`
- `spanId`

Catatan:

- `requestId` mewakili satu request HTTP atau satu task boundary yang jelas
- `correlationId` dipakai lintas service untuk menyatukan satu alur kerja
- jika tracing penuh belum aktif, `traceId` boleh dikosongkan tetapi nama field tetap dipertahankan

### Actor and workspace fields

- `workspaceId`
- `userId`
- `actorType`
- `actorId`

Contoh:

- user dashboard action
- internal scheduler action
- background worker retry

### HTTP fields

- `httpMethod`
- `httpRoute`
- `httpStatusCode`
- `durationMs`
- `remoteIp`
- `userAgent`

### Job and integration fields

- `jobId`
- `jobType`
- `platformCode`
- `providerName`
- `providerJobId`
- `idempotencyKey`
- `attempt`
- `maxAttempts`

### Error fields

- `errorCode`
- `errorMessage`
- `errorClass`
- `stack`
- `retryable`

Aturan:

- jangan log token, password, secret, atau payload sensitif tanpa redaction
- `errorMessage` boleh tampil ringkas untuk operasional
- detail sensitif harus dipotong atau di-mask

## Header and Context Propagation

Header yang direkomendasikan untuk internal HTTP:

- `X-Request-Id`
- `X-Correlation-Id`
- `X-Actor-Type`
- `X-Actor-Id`
- `X-Workspace-Id`

Aturan:

- `api-gateway` membuat nilai default jika header belum ada
- service internal harus meneruskan header itu saat memanggil service lain
- worker yang dipicu dari queue harus membawa `correlationId` di payload job atau metadata message

## Raw Logs vs Database Read Models

### Raw logs

Tempat:

- centralized log store

Gunanya:

- debugging teknis
- incident response
- mencari stack trace, timeout, retry path, dan failure chain

### Activity feed

Tempat:

- database utama pada schema `analytics`

Gunanya:

- UI operasional
- timeline lintas domain
- ringkasan status job dan integration event

### Audit log

Tempat:

- database utama pada schema `identity`

Gunanya:

- compliance ringan
- security review
- historis aksi sensitif

## Proposed Database Read Models

### 1. `analytics.event_log`

Tabel ini sudah direncanakan dalam arsitektur database. Untuk MVP, tabel ini sebaiknya menjadi activity feed lintas domain, bukan tempat raw app logs.

Kolom yang direkomendasikan:

- `id UUID PRIMARY KEY`
- `workspace_id UUID NULL REFERENCES identity.workspaces(id)`
- `source_service TEXT NOT NULL`
- `event_name TEXT NOT NULL`
- `event_category TEXT NOT NULL`
- `subject_type TEXT NOT NULL`
- `subject_id UUID NULL`
- `actor_type TEXT`
- `actor_user_id UUID NULL REFERENCES identity.users(id)`
- `request_id TEXT`
- `correlation_id TEXT`
- `status TEXT`
- `severity TEXT`
- `error_code TEXT`
- `error_message TEXT`
- `payload JSONB NOT NULL DEFAULT '{}'::JSONB`
- `occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

Index minimum:

- `(workspace_id, occurred_at DESC)`
- `(source_service, occurred_at DESC)`
- `(correlation_id)`
- `(subject_type, subject_id, occurred_at DESC)`

Nilai `event_category` yang cukup untuk MVP:

- `job`
- `integration`
- `content`
- `system`

Contoh `event_name`:

- `media.render.queued`
- `media.render.completed`
- `publishing.publish.failed`
- `publishing.publish.retried`
- `publishing.account.expired`

### 2. `identity.audit_logs`

Tabel ini belum ada sekarang, tetapi disarankan untuk menampung aksi sensitif yang perlu jejak yang lebih stabil dan mudah dibaca auditor internal.

Kolom yang direkomendasikan:

- `id UUID PRIMARY KEY`
- `workspace_id UUID NULL REFERENCES identity.workspaces(id)`
- `actor_user_id UUID NULL REFERENCES identity.users(id)`
- `actor_service TEXT`
- `action_name TEXT NOT NULL`
- `resource_type TEXT NOT NULL`
- `resource_id UUID NULL`
- `request_id TEXT`
- `correlation_id TEXT`
- `remote_ip INET`
- `user_agent TEXT`
- `result TEXT NOT NULL`
- `metadata JSONB NOT NULL DEFAULT '{}'::JSONB`
- `occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

Index minimum:

- `(workspace_id, occurred_at DESC)`
- `(actor_user_id, occurred_at DESC)`
- `(action_name, occurred_at DESC)`
- `(correlation_id)`

Contoh `action_name`:

- `workspace.member.role_changed`
- `publishing.account.connected`
- `publishing.account.revoked`
- `publishing.post.published`
- `billing.plan.changed`

## How To Populate These Tables

### Preferred pattern

Gunakan outbox dan projector, bukan dual-write acak dari banyak titik kode.

Alasan:

- repo ini sudah memiliki `outbox_events` di domain `publishing` dan `media`
- outbox lebih aman untuk menjaga konsistensi antara state domain dan event turunan
- read model UI bisa dibangun tanpa membuat jalur tulis baru yang rentan drift

### Projector responsibilities

Projector sederhana dapat:

- membaca `media.outbox_events`
- membaca `publishing.outbox_events`
- memetakan event ke `analytics.event_log`
- membuat `identity.audit_logs` hanya untuk event yang sensitif

Contoh mapping:

- `publish.post.scheduled` -> `analytics.event_log`
- `publish.post.failed` -> `analytics.event_log`
- `social.account.connected` -> `analytics.event_log` + `identity.audit_logs`
- `billing.plan.changed` -> `identity.audit_logs`

## UI Recommendation

### Principle

UI internal harus menampilkan data yang actionable.

Jangan mulai dari halaman "raw logs".

Mulai dari halaman "Operations" atau "Activity".

### Suggested MVP screens

#### 1. Operations overview

Isi:

- publish jobs queued
- render jobs processing
- failed jobs last 24h
- retry count last 24h
- platform failure rate
- service health summary

Data source:

- tabel job domain
- metric summary
- `analytics.event_log`

#### 2. Activity feed

Isi:

- timeline event terbaru
- filter by workspace
- filter by service
- filter by event type
- filter by status

Kolom yang cocok:

- time
- service
- event
- subject
- workspace
- outcome
- correlationId

#### 3. Audit history

Isi:

- aksi sensitif
- actor
- resource
- result
- IP
- timestamp

#### 4. Job detail drawer or page

Isi:

- current job state dari `publish_jobs` atau `render_jobs`
- timeline event dari `analytics.event_log`
- link atau copy action untuk `correlationId`
- raw log lookup dilakukan dari observability tool, bukan dari database aplikasi

### Realtime behavior

Untuk MVP:

- polling cukup untuk overview dan table
- SSE cocok untuk detail progress render atau publish result

Ini konsisten dengan blueprint realtime repo saat ini.

## Retention Strategy

### Raw application logs

Saran awal:

- hot retention `7-14 hari`
- archive `30-90 hari` bila biaya masuk akal

### `analytics.event_log`

Saran awal:

- retention `90 hari` untuk event operasional yang tampil di UI
- partisi bulanan saat ukuran mulai besar

### `identity.audit_logs`

Saran awal:

- simpan lebih lama dari activity feed
- minimal `1 tahun` jika data sensitif dan kebutuhan investigasi tinggi

## Rollout Plan

### Phase 1

- isi `packages/logger` dengan kontrak field dasar
- aktifkan structured JSON logs yang konsisten di semua service
- tambahkan request dan correlation propagation

### Phase 2

- ubah Go service dari placeholder `log.Printf` ke structured logging
- tambahkan middleware atau helper untuk context enrichment
- redaction rule untuk field sensitif

### Phase 3

- definisikan event schema operasional di `contracts/events`
- projector outbox ke `analytics.event_log`
- buat `identity.audit_logs`

### Phase 4

- bangun halaman internal `Operations`
- tampilkan activity feed dan audit history
- tambah SSE untuk job detail jika memang dibutuhkan

## Suggested Repo Touchpoints

Area implementasi yang paling relevan:

- `packages/logger/`
- `apps/api-gateway/src/app.ts`
- `apps/api-gateway/src/index.ts`
- `services/media-processing-service/cmd/api/main.go`
- `services/media-processing-service/cmd/worker/main.go`
- `services/publishing-service/cmd/api/main.go`
- `services/publishing-service/cmd/worker/main.go`
- `contracts/events/`
- `packages/database/migrations/analytics/`
- `packages/database/migrations/identity/`
- `apps/web-ui/`

## Short Decision Summary

Keputusan praktis untuk CreatorFlow:

- log tetap di masing-masing service
- agregasi log dilakukan terpusat oleh infra
- raw log tidak dijadikan UI utama
- UI internal memakai activity feed dan audit log
- domain job table tetap menjadi source of truth state
- outbox dipakai untuk memproyeksikan event operasional ke read model UI
