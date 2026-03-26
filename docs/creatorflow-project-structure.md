# CreatorFlow Project Structure

## Purpose

Dokumen ini menjabarkan struktur project yang disarankan untuk implementasi awal CreatorFlow berdasarkan blueprint microservice.

Fokusnya adalah:

- mudah dimulai
- tetap siap tumbuh ke microservice
- tidak over-engineered untuk MVP

## Recommended Repository Style

Gunakan monorepo.

Alasan:

- kontrak antar service lebih mudah dijaga
- shared package seperti auth, config, dan event contract dapat dipakai ulang
- developer experience lebih sederhana pada fase awal
- cocok untuk pendekatan hybrid: logical microservice sekarang, physical split bertahap
- gunakan satu package manager resmi agar lockfile, CI, dan onboarding tetap konsisten

Gunakan maksimal dua bahasa utama:

- `TypeScript` untuk product-facing services
- `Go` untuk worker-heavy dan concurrency-heavy services

Framework yang direkomendasikan:

- `web-ui` -> `Next.js`
- `TypeScript` backend -> `Fastify`
- `Go` backend -> `Chi`

Runtime baseline:

- `npm 10.x`
- `Node.js 22.x`
- `Go 1.25.x`
- `PostgreSQL 17.x`

## Top-Level Layout

```text
automation-content/
  contracts/
  apps/
  services/
  packages/
  infra/
  docs/
  package.json
  package-lock.json
  turbo.json
  docker-compose.yml
  SUPPORT_MATRIX.md
  SECURITY.md
```

## Language Allocation

Mapping bahasa yang direkomendasikan:

- `apps/web-ui` -> `TypeScript`
- `apps/api-gateway` -> `TypeScript`
- `services/identity-service` -> `TypeScript`
- `services/content-service` -> `TypeScript`
- `services/asset-service` -> `TypeScript`
- `services/billing-service` -> `TypeScript`
- `services/affiliate-service` -> `TypeScript`
- `services/trend-intelligence-service` -> `TypeScript`
- `services/notification-service` -> `TypeScript`
- `services/media-processing-service` -> `Go`
- `services/publishing-service` -> `Go`
- `services/analytics-service` -> `Go`
- `services/workflow-service` -> `Go`

Prinsip pemilihan:

- `TypeScript` untuk domain yang cepat berubah dan dekat ke kebutuhan produk
- `Go` untuk domain yang banyak worker, retry, scheduling, dan concurrency

Catatan implementasi MVP:

- `identity-service`, `content-service`, `asset-service`, dan `trend-intelligence-service` adalah logical service boundary
- pada fase MVP, keempatnya diimplementasikan sebagai modul internal di `apps/api-gateway`
- `media-processing-service` dan `publishing-service` menjadi physical service terpisah sejak awal

## Directory Responsibilities

### `apps/`

Berisi entrypoint yang langsung dikonsumsi user atau external edge layer.

Isi awal:

```text
apps/
  web-ui/
  api-gateway/
```

Keterangan:

- `web-ui`: Next.js frontend
- `api-gateway`: public API deployable yang berisi BFF, auth context, request aggregation, dan modul domain internal MVP

### `services/`

Berisi business service utama.

Isi awal yang direkomendasikan:

```text
services/
  media-processing-service/
  publishing-service/
```

Isi fase berikutnya:

```text
services/
  identity-service/
  content-service/
  asset-service/
  billing-service/
  affiliate-service/
  trend-intelligence-service/
  analytics-service/
  notification-service/
  workflow-service/
```

### `packages/`

Berisi shared package lintas app dan service tanpa menyimpan domain logic yang seharusnya dimiliki service tertentu.

Rekomendasi awal:

```text
packages/
  auth/
  config/
  database/
  event-contracts/
  logger/
```

Keterangan:

- `auth`: JWT utilities, auth middleware, internal token helpers
- `config`: environment parsing dan shared config loader
- `database`: SQL migrations, db client bootstrap, query helpers, dan schema utilities
- `event-contracts`: generated event bindings, helpers, atau shared runtime validator
- `logger`: structured logger dan correlation id helpers

Catatan multi-language:

- kontrak lintas bahasa lebih aman didefinisikan lewat schema seperti OpenAPI, JSON Schema, atau AsyncAPI
- TypeScript types dan Go bindings sebaiknya dianggap generated artifact, bukan source of truth utama
- database schema sebaiknya tetap bersumber dari SQL migration, bukan ORM schema tunggal

### `contracts/`

Berisi source of truth untuk kontrak lintas deployable.

Rekomendasi:

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

Keterangan:

- `http/` berisi spesifikasi `OpenAPI`
- `events/` berisi schema event berbasis `JSON Schema` dan dokumentasi `AsyncAPI` bila diperlukan
- code generation untuk TypeScript dan Go harus mengambil sumber dari sini

### `infra/`

Berisi kebutuhan operasional.

Rekomendasi:

```text
infra/
  docker/
  scripts/
  terraform/
```

Keterangan:

- `docker`: Dockerfile dan compose overrides
- `scripts`: local bootstrap dan helper scripts
- `terraform`: provisioning cloud saat sudah masuk fase deploy serius

### `docs/`

Berisi source of truth untuk keputusan produk dan arsitektur.

Isi saat ini:

```text
docs/
  creatorflow-microservice-blueprint.md
  creatorflow-database-architecture.md
  creatorflow-email-architecture.md
  creatorflow-project-structure.md
```

## MVP Physical Deployables

Deployable yang benar-benar direkomendasikan pada fase awal:

```text
apps/
  web-ui/
  api-gateway/
services/
  media-processing-service/
  publishing-service/
```

Boundary logical yang masih hidup sebagai modul internal di `api-gateway`:

- `identity-service`
- `content-service`
- `asset-service`
- `trend-intelligence-lite`
- `affiliate-lite`
- `billing-lite`
- `notification-lite`
- `analytics-lite`

## Recommended Service Internal Layout

Setiap service sebaiknya punya bentuk konsisten.

```text
services/content-service/
  src/
    modules/
    routes/
    application/
    domain/
    infrastructure/
    workers/
    events/
  tests/
  package.json
  tsconfig.json
  Dockerfile
  README.md
```

Arti tiap folder:

- `modules/`: grouping fitur internal
- `routes/`: HTTP route handlers
- `application/`: use cases dan orchestration layer
- `domain/`: entity, value object, policy, domain rule
- `infrastructure/`: repository, provider client, persistence adapter
- `workers/`: consumer queue dan background jobs
- `events/`: publisher dan event handler

Contoh ini paling cocok untuk service TypeScript. Untuk service Go, struktur internal dapat disederhanakan per package domain selama ownership dan boundary tetap jelas.

Contoh layout Go service:

```text
services/publishing-service/
  cmd/
    api/
    worker/
  internal/
    domain/
    application/
    infrastructure/
    transport/
    jobs/
  migrations/
  tests/
  go.mod
  Dockerfile
  README.md
```

## Recommended API Gateway Layout

```text
apps/api-gateway/
  src/
    modules/
    routes/
    middleware/
    clients/
    presenters/
    auth/
  tests/
  package.json
  tsconfig.json
  Dockerfile
```

Keterangan:

- `modules/` berisi logical service boundary seperti `identity`, `content`, `asset`, dan `trend-intelligence`
- `clients/` dipakai untuk internal service client
- `presenters/` dipakai untuk response shaping agar frontend dapat payload yang stabil

## Recommended Web UI Layout

Frontend sekarang hidup di `apps/web-ui`:

```text
apps/web-ui/
  app/
  components/
  lib/
  features/
  hooks/
  public/
```

Keterangan:

- `features/` memisahkan domain UI seperti content studio, publishing, analytics, dan trend radar
- `lib/` untuk API client, auth client, formatter, utility frontend

## Recommended Package Rules

Aturan penting:

- `packages/` hanya berisi utilitas bersama dan kontrak
- jangan memindahkan business logic inti service ke `packages/`
- event payload harus didefinisikan di `contracts/events`
- untuk service lintas bahasa, gunakan contract-first approach
- jangan menjadikan TypeScript type manual sebagai sumber kebenaran lintas service

Tujuannya agar service boundary tetap sehat.

## Initial Build Order

Urutan implementasi yang disarankan:

1. `apps/api-gateway`
2. modul `identity` di `apps/api-gateway`
3. modul `content` di `apps/api-gateway`
4. modul `asset` di `apps/api-gateway`
5. modul `trend-intelligence` di `apps/api-gateway`
6. `services/media-processing-service`
7. `services/publishing-service`
8. `contracts/http`
9. `contracts/events`
10. `packages/auth`
11. `packages/logger`
12. `packages/config`
13. `packages/database`

Bahasa untuk initial build:

1. `apps/api-gateway` -> `TypeScript`
2. modul `identity` -> `TypeScript`
3. modul `content` -> `TypeScript`
4. modul `asset` -> `TypeScript`
5. modul `trend-intelligence` -> `TypeScript`
6. `services/media-processing-service` -> `Go`
7. `services/publishing-service` -> `Go`

## Infrastructure Mapping

Untuk struktur awal, komponen infrastruktur yang paling berguna:

- `PostgreSQL` untuk data utama
- `PostgreSQL` job tables untuk scheduler dan async job source of truth
- `Redis` untuk cache, lock, rate limit, dan event transport
- `Object Storage` untuk file media
- `SSE endpoint` di gateway atau service untuk job progress
- scheduled worker internal untuk trend collection dan digest generation

Belum perlu dari awal:

- `RabbitMQ`
- `WebSocket gateway`
- `Temporal`
- `BullMQ` sebagai backbone lintas service

Catatan bahasa:

- worker utama lintas bahasa sebaiknya membaca job state dari database service masing-masing
- `BullMQ` hanya opsional untuk workload internal service Node.js
- kontrak event harus netral terhadap bahasa
- akses PostgreSQL di TypeScript cocok memakai `pg + Kysely`
- akses PostgreSQL di Go cocok memakai `pgx + sqlc`
- collector `trend-intelligence` sebaiknya mulai dari pull ringan ke public signals yang legal dan stabil, bukan scraping liar

## Suggested Ownership by Service

### `identity-service`

- auth
- user
- workspace
- membership
- language: `TypeScript`
- implementation pada MVP: modul di `apps/api-gateway`

### `content-service`

- idea
- script
- caption
- CTA
- prompt orchestration
- language: `TypeScript`
- implementation pada MVP: modul di `apps/api-gateway`

### `asset-service`

- upload session
- asset metadata
- storage pointer
- language: `TypeScript`
- implementation pada MVP: modul di `apps/api-gateway`

### `trend-intelligence-service`

- trend source policy
- trend signal collection
- scoring ringan
- digest dan watchlist recommendation
- language: `TypeScript`
- implementation pada MVP: modul di `apps/api-gateway` dengan worker terjadwal sederhana

### `media-processing-service`

- render jobs
- clipping jobs
- subtitle jobs
- processing workers
- language: `Go`

### `publishing-service`

- social account connection
- scheduled post
- publish worker
- publish retry
- language: `Go`

## Suggested Developer Workflow

Saat project masih awal, workflow lokal yang sehat:

1. jalankan `web-ui`, `api-gateway`, dan service inti yang sedang dikerjakan
2. gunakan `docker-compose` untuk dependency infra seperti Postgres dan Redis
3. jalankan worker terpisah untuk `media-processing-service` dan `publishing-service`
4. jalankan collector atau digest worker lokal untuk `trend-intelligence` bila sedang dikerjakan
5. simpan source of truth kontrak di `contracts/`
6. generate client atau binding ke package atau service yang membutuhkan

## Recommended Next Step

Setelah struktur ini disepakati, langkah paling pas adalah:

1. setup monorepo workspace
2. gunakan `apps/web-ui` sebagai lokasi frontend utama
3. scaffold `api-gateway` dengan modul `identity`, `content`, `asset`, dan `trend-intelligence`
4. scaffold `media-processing-service` dan `publishing-service`
5. siapkan `contracts/http` dan `contracts/events`
6. siapkan `Postgres`, `Redis`, dan object storage untuk local development
