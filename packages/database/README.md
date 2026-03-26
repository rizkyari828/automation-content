# Database Package

Package ini menjadi rumah untuk fondasi database CreatorFlow.

Fokus utamanya:

- SQL-first migrations
- struktur schema per domain
- query dan bootstrap yang netral untuk TypeScript maupun Go

## Structure

```text
packages/database/
  migrations/
    0000_bootstrap.sql
    identity/
    content/
    asset/
    billing/
    notification/
    analytics/
    trend/
    publishing/
    media/
  scripts/
    migrate.mjs
  README.md
  package.json
```

## Rules

- source of truth schema ada di file SQL
- setiap domain punya folder migration sendiri
- migration harus idempotent jika memang dimaksudkan untuk bootstrap lokal
- jangan menyimpan binary asset di PostgreSQL

## Current Scope

Baseline MVP saat ini mencakup:

- `identity.users`
- `identity.workspaces`
- `identity.memberships`
- `identity.refresh_sessions`
- `content.scripts`
- `content.captions`
- `asset.assets`
- `asset.uploads`
- `billing.plans`
- `billing.subscriptions`
- `publishing.connected_accounts`
- `publishing.publish_jobs`
- `media.render_jobs`
- `media.clip_jobs`
- `media.subtitle_jobs`
- `trend.trend_sources`
- `trend.trend_collection_runs`
- `trend.trend_signal_snapshots`
- `trend.trend_scores`
- `trend.trend_recommendations`
- `trend.trend_digests`
- `publishing.outbox_events`
- `media.outbox_events`

## Usage Notes

- `api-gateway` akan memakai migration ini sebagai source of truth untuk domain internal MVP
- service Go akan membaca schema yang sama, tetapi query tetap dihasilkan dari SQL terpisah milik masing-masing service
- tabel job dan outbox sengaja disiapkan dari awal agar backbone async tidak berubah drastis nanti

## Commands

- `npm run migrate:status --workspace @creatorflow/database`
- `npm run migrate:up --workspace @creatorflow/database`

Default `DATABASE_URL` runner:

- `postgresql://creatorflow:creatorflow@localhost:5433/creatorflow`

## Local Migration Flow

1. pastikan container `postgres` sudah hidup
2. cek `DATABASE_URL` di root `.env`
3. jalankan migration
4. cek status migration

Command contoh:

```bash
docker compose up -d postgres
npm run db:migrate
npm run db:status
```

Atau jika ingin langsung dari workspace package:

```bash
npm run migrate:up --workspace @creatorflow/database
npm run migrate:status --workspace @creatorflow/database
```

## Notes

- `migrate.mjs` memakai advisory lock agar apply migration tidak balapan
- migration yang sudah applied tidak boleh diedit; buat file migration baru untuk perubahan schema berikutnya
- folder domain tanpa file `.sql` masih valid sebagai placeholder roadmap
