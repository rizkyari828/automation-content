# Docker Infra

Folder ini dipakai untuk override, compose tambahan, atau Dockerfile pendukung infra lokal.

Untuk baseline saat ini, dependency lokal utama dijalankan dari root `docker-compose.yml`:

- `postgres`
- `redis`
- `db-migrate`
- `api-gateway`
- `web-ui`
- `media-processing-service`
- `media-processing-worker`
- `publishing-service`
- `publishing-worker`

Mode full stack memakai `Compose profile: full`.

Catatan:

- pastikan Docker daemon sudah aktif sebelum menjalankan `docker compose`
- start infra utama:

```bash
docker compose up -d postgres redis
```

- stop infra utama:

```bash
docker compose stop postgres redis
```

- start full stack:

```bash
docker compose up -d --build
```

atau:

```bash
COMPOSE_PROFILES=full docker compose up -d --build
```

- service `db-migrate` akan selesai lalu `Exited (0)` secara normal karena tugasnya hanya apply migration
- `web-ui` juga punya healthcheck, jadi status `docker compose ps` akan lebih jelas

- cek status:

```bash
docker compose ps
```

Shortcut root yang tersedia:

```bash
npm run infra:up
npm run infra:ps
npm run infra:logs
npm run stack:up
npm run stack:ps
npm run stack:logs
npm run stack:rebuild
```

Kalau lebih suka `make`:

```bash
make infra-up
make infra-ps
make stack-up
make stack-ps
make stack-logs
```
