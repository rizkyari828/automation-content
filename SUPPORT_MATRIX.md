# CreatorFlow Support Matrix

Dokumen ini menjadi baseline resmi runtime dan dependency untuk CreatorFlow.

## Current Baseline

Per 26 Maret 2026, baseline yang disetujui:

- package manager: `npm 10.x`
- Node.js runtime: `22.x`
- frontend framework: `Next.js 15.5.14`
- frontend target upgrade: `Next.js 16.x` sebelum launch publik
- React: `19.x`
- TypeScript backend framework: `Fastify 5.x`
- Go runtime: `1.25.x`
- Go router: `Chi`
- primary database: `PostgreSQL 17.x`
- cache and event transport: `Redis 7.x`
- object storage: `S3-compatible object storage`
- monorepo build tool: `Turborepo 2.x`

## Why This Matrix

- `Node.js 22.x` adalah baseline stabil untuk service TypeScript dan selaras dengan support resmi `Fastify 5.x`.
- `Next.js 15.5.14` aman untuk fase aktif sekarang, tetapi tidak menjadi target jangka menengah karena `16.x` adalah line yang lebih tepat untuk public launch.
- `Go 1.25.x` memberi baseline yang lebih sehat untuk project baru dibanding line yang lebih lama.
- `PostgreSQL 17.x` memberi keseimbangan bagus antara fitur baru, tooling maturity, dan ketersediaan di managed providers.
- `Redis 7.x` cukup matang untuk cache, lock, dan `Redis Streams`.

## Version Policy

- pegang hanya major release yang masih berada dalam support window upstream
- hindari pin ke canary, beta, atau release candidate untuk production
- minor dan patch security update harus diambil secara rutin
- evaluasi major upgrade minimal sekali per kuartal

## Approved Core Packages

Package yang disetujui sebagai default stack saat ini:

- `next`
- `react`
- `react-dom`
- `fastify`
- `pg`
- `kysely`
- `redis`
- `pgx`
- `sqlc`
- `chi`
- `turbo`

## Not Default By Policy

Stack berikut tidak menjadi default untuk fase MVP dan early growth:

- `Prisma` sebagai source of truth schema
- `RabbitMQ`
- `BullMQ` sebagai backbone lintas service
- `WebSocket gateway` sebagai default realtime layer
- database engine kedua

## Review Cadence

- runtime matrix ditinjau ulang setiap kuartal
- security patch ditinjau mingguan
- dependency major upgrade ditinjau sebelum public launch atau saat upstream masuk maintenance mode
