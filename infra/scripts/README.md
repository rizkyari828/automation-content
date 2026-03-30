# Infra Scripts

Folder ini dipakai untuk bootstrap local development, seed, dan helper scripts operasional.

Saat ini bootstrap lokal cukup memakai script root:

- `npm run infra:up`
- `npm run infra:down`
- `npm run db:status`
- `npm run db:migrate`
- `npm run bootstrap:superadmin`

Bootstrap `superadmin` local dev akan membuat atau memperbarui akun berikut secara idempotent:

- email default: `superadmin@creatorflow.local`
- password default: `creatorflow-dev-superadmin`

Nilai default ini bisa dioverride lewat `.env` dengan prefix `BOOTSTRAP_SUPERADMIN_*`.
