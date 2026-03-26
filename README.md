# CreatorFlow Monorepo

Monorepo awal untuk CreatorFlow, sebuah AI Content Commerce platform.

Struktur utama:

- `apps/web-ui` untuk Next.js frontend
- `apps/api-gateway` untuk public API dan modul domain MVP, termasuk `trend-intelligence` fase awal
- `apps/native-ui` untuk Flutter mobile dan desktop UI shell
- `services/media-processing-service` untuk worker-heavy media jobs
- `services/publishing-service` untuk scheduling dan publishing
- `packages/` untuk shared runtime helpers
- `contracts/` untuk source of truth API dan event schema
- `docs/` untuk blueprint dan keputusan arsitektur

Dokumen utama:

- `docs/creatorflow-microservice-blueprint.md`
- `docs/creatorflow-database-architecture.md`
- `docs/creatorflow-observability-logging.md`
- `docs/creatorflow-project-structure.md`
- `docs/creatorflow-email-architecture.md`
- `docs/native-ui-blueprint.md`
- `SUPPORT_MATRIX.md`
- `SECURITY.md`

Toolchain baseline:

- `npm 10.x`
- `Node.js 22.x`
- `Go 1.25.x`
- `PostgreSQL 17.x`
- `Flutter 3.41.5 stable` untuk `apps/native-ui`

## Local Bootstrap

1. copy `.env.example` ke `.env`
2. jalankan `npm install`
3. pastikan Docker daemon aktif
4. jalankan `npm run infra:up`
5. jalankan `npm run db:migrate`

Default local ports:

- PostgreSQL `5433`
- Redis `6380`

## Running With Docker Compose

Saat ini `docker compose` bisa dipakai dalam dua mode:

- infra-only: `postgres` + `redis`
- full stack: `db-migrate`, `api-gateway`, `web-ui`, `media-processing-service`, `media-processing-worker`, `publishing-service`, `publishing-worker`

Secara internal, full stack sekarang memakai `Compose profile: full`.

Mode infra-only:

```bash
npm run infra:up
```

Mode full stack sekali jalan:

```bash
npm run stack:up
```

Alternatif kalau lebih suka target singkat:

```bash
make infra-up
make stack-up
```

Atau raw compose:

```bash
docker compose up -d --build
```

Kalau mau raw command yang setara dengan profile:

```bash
COMPOSE_PROFILES=full docker compose up -d --build
```

Command yang paling umum:

```bash
docker compose up -d postgres redis
```

Atau lewat script root:

```bash
npm run infra:up
```

Untuk menghentikan infra:

```bash
docker compose stop postgres redis
```

Atau:

```bash
npm run infra:down
```

Untuk menghentikan full stack:

```bash
docker compose stop
```

Atau:

```bash
npm run stack:down
```

Kalau ingin melihat status container:

```bash
docker compose ps
```

Kalau ingin melihat log:

```bash
docker compose logs -f postgres redis
```

Shortcut yang sekarang tersedia:

```bash
npm run infra:ps
npm run infra:logs
npm run infra:restart
npm run stack:ps
npm run stack:logs
npm run stack:restart
npm run stack:rebuild
```

Atau versi `make`:

```bash
make infra-ps
make infra-logs
make stack-ps
make stack-logs
make stack-rebuild
```

Kalau ingin menjalankan frontend container dari compose:

```bash
docker compose up -d web-ui
```

Catatan:

- sekarang full stack memang bisa naik dari satu command `docker compose up -d --build`
- service `db-migrate` akan `Exited (0)` setelah migration selesai, itu normal karena dia adalah one-shot job
- `web-ui` sekarang punya healthcheck juga, jadi status `docker compose ps` lebih informatif
- kalau hanya butuh Postgres dan Redis untuk development cepat, tetap lebih ringan memakai `npm run infra:up`

## Database Migration

Setelah `postgres` hidup, jalankan migration:

```bash
npm run db:migrate
```

Kalau kamu menjalankan full stack lewat `npm run stack:up`, migration ini akan dijalankan otomatis oleh service `db-migrate` sebelum `api-gateway` start.

Untuk melihat status migration tanpa meng-apply:

```bash
npm run db:status
```

Migration runner akan membaca `DATABASE_URL` dari `.env`.

Default local value:

```bash
postgresql://creatorflow:creatorflow@localhost:5433/creatorflow
```

Urutan local setup yang paling aman:

```bash
cp .env.example .env
npm install
npm run infra:up
npm run db:migrate
npm run db:status
```

Kalau mau langsung full stack:

```bash
cp .env.example .env
npm install
npm run stack:up
npm run stack:ps
```

## Run Services Locally

Setelah infra dan database siap, service utama bisa dijalankan terpisah.

`api-gateway`:

```bash
npm run dev:gateway
```

Frontend `web-ui`:

```bash
npm run dev:web
```

Frontend `native-ui`:

```bash
cd apps/native-ui
flutter run -d macos
```

Kalau hanya butuh start server hasil build untuk `api-gateway`:

```bash
npm run build:gateway
npm run start --workspace @creatorflow/api-gateway
```

## Compose Ports

Port default saat full stack aktif:

- `web-ui` -> `3000`
- `api-gateway` -> `4000`
- `media-processing-service` -> `4100`
- `publishing-service` -> `4200`
- `postgres` -> `5433`
- `redis` -> `6380`

## Auth Notes

`web-ui` sekarang memakai pola BFF auth ringan:

- browser submit ke `/api/auth/sign-in` dan `/api/auth/sign-up`
- `web-ui` menyimpan `access token` dalam cookie `HttpOnly`
- `refresh token` tetap di-rotate lewat `api-gateway`
- `GET /api/auth/session` akan mencoba `access token` dulu, lalu fallback ke `refresh`

`native-ui` memakai kontrak auth native-friendly di `api-gateway`:

- kirim `clientType: "native"` saat `register` dan `login`
- native client menerima `accessToken` dan `refreshToken`
- native client memanggil `POST /v1/auth/refresh` dengan `refreshToken` di body
- web flow berbasis cookie tetap dipertahankan

Environment auth yang penting:

- `API_GATEWAY_SERVER_BASE_URL`
- `ACCESS_TOKEN_COOKIE_NAME`
- `ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS`
- `REFRESH_TOKEN_COOKIE_NAME`
- `AUTH_COOKIE_SECURE`

Untuk service-to-service auth, `api-gateway` bisa issue internal JWT lewat:

```bash
curl -X POST http://localhost:4000/internal/v1/auth/service-token \
  -H 'content-type: application/json' \
  -H 'x-internal-bootstrap-secret: creatorflow-internal-bootstrap-secret' \
  -d '{"serviceName":"api-gateway","audience":"creatorflow-media-processing-service","scope":["media:jobs:read"]}'
```

Receiver service sekarang memverifikasi:

- `INTERNAL_SERVICE_SECRET`
- `INTERNAL_SERVICE_ISSUER`
- `INTERNAL_SERVICE_AUDIENCE`

## Practical Notes

- migration bersifat `SQL-first`, jadi perubahan schema utama harus masuk ke `packages/database/migrations/`
- `trend-intelligence` baseline sekarang sudah ikut termigrasi lewat schema `trend`
- kalau `npm run db:migrate` gagal connect, hampir selalu penyebabnya adalah container `postgres` belum aktif atau `DATABASE_URL` tidak cocok dengan port lokal
