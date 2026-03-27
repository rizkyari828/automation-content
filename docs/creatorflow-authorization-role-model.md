# CreatorFlow Authorization Role Model

## Purpose

Dokumen ini menjadi acuan bersama untuk:

- role level platform dan level workspace
- permission matrix default
- feature toggle per workspace
- guard backend yang sudah aktif di repo
- arah implementasi UI web dan native

Target dokumen ini adalah supaya backend, web, native, dan product memakai model akses yang sama.

## Core Principles

Prinsip yang dipakai:

- `superadmin` adalah role level platform, bukan role membership workspace
- `owner`, `admin`, `editor`, dan `viewer` adalah role level workspace
- permission ditentukan oleh role default yang konsisten di backend
- feature toggle menentukan modul mana yang aktif untuk satu workspace
- backend adalah sumber kebenaran utama; UI hanya mengikuti hasil evaluasi backend

## Role Layers

### 1. Platform Role

Saat ini platform role yang dipakai:

- `superadmin`

Fungsi utama:

- mem-bypass permission matrix workspace untuk monitoring dan operasional internal
- melihat konteks authorization workspace aktif
- menjadi fondasi untuk dashboard internal lintas workspace di fase berikutnya

Catatan:

- implementasi saat ini belum membuka dashboard lintas workspace khusus superadmin
- token user masih tetap membawa `workspaceId` aktif
- superadmin saat ini berfungsi sebagai override permission pada workspace aktif

### 2. Workspace Roles

Role workspace yang dipakai:

- `owner`
- `admin`
- `editor`
- `viewer`

Definisi ringkas:

- `owner`: pengambil keputusan utama untuk workspace, billing, konfigurasi, dan anggota
- `admin`: operator workspace yang bisa mengelola tim dan operasional utama
- `editor`: pembuat dan operator konten
- `viewer`: akses baca untuk data yang memang diizinkan

## Feature Toggles

Feature toggle disimpan per workspace.

Daftar feature code default:

- `assets`
- `billing`
- `content`
- `media`
- `publishing`
- `sso`
- `team`
- `trend`
- `workspace_settings`

Aturan default saat ini:

- semua feature aktif untuk workspace baru
- migration juga melakukan seed feature default untuk workspace yang sudah ada
- jika feature dimatikan, backend akan menolak endpoint terkait walaupun role user cukup

## Permission Codes

Permission code default yang dipakai saat ini:

- `assets.read`
- `assets.upload`
- `billing.read`
- `billing.manage`
- `content.generate`
- `content.read`
- `features.manage`
- `media.read`
- `media.render`
- `members.manage`
- `platform.admin`
- `profile.manage`
- `publishing.read`
- `publishing.write`
- `sso.manage`
- `trend.collect`
- `trend.read`
- `workspace.manage`
- `workspace.view`

## Default Permission Matrix

### `owner`

- semua permission workspace
- termasuk `billing.manage`, `features.manage`, `members.manage`, `sso.manage`

### `admin`

- operasional workspace penuh tanpa hak billing manage
- termasuk `workspace.manage`, `members.manage`, `publishing.write`, `trend.collect`
- tidak termasuk `billing.manage` dan `features.manage`

### `editor`

- fokus produksi konten
- termasuk `content.generate`, `assets.upload`, `media.render`, `publishing.write`, `trend.collect`
- tidak termasuk `members.manage`, `workspace.manage`, `billing.*`

### `viewer`

- fokus baca
- termasuk `trend.read`, `publishing.read`, `media.read`, `content.read`, `assets.read`
- tidak termasuk semua aksi tulis operasional

### `superadmin`

- semua permission di atas
- diperlakukan sebagai override permission pada workspace aktif

## Permission vs Feature Toggle

Kedua konsep ini harus dibedakan:

- permission menjawab: siapa boleh melakukan aksi?
- feature toggle menjawab: modul ini aktif untuk workspace atau tidak?

Contoh:

- `editor` bisa punya `publishing.write`
- tapi jika feature `publishing` dimatikan di workspace, publish tetap ditolak backend

## Current Backend Enforcement

Guard backend saat ini aktif untuk endpoint berikut:

### Content

- `POST /v1/content/scripts:generate`
- butuh feature `content`
- butuh permission `content.generate`

### Assets

- `POST /v1/assets/upload-url`
- butuh feature `assets`
- butuh permission `assets.upload`

### Media

- `POST /v1/media/render-jobs`
- butuh feature `media`
- butuh permission `media.render`

- `GET /v1/media/render-jobs/:jobId`
- butuh feature `media`
- butuh permission `media.read`

### Trend

- `POST /v1/trend/collect`
- butuh feature `trend`
- butuh permission `trend.collect`

- `GET /v1/trend/watchlist`
- butuh feature `trend`
- butuh permission `trend.read`

- `GET /v1/trend/digests/latest`
- butuh feature `trend`
- butuh permission `trend.read`

- `POST /v1/trend/recommendations/:recommendationId/content-request`
- butuh feature `trend`
- butuh permission `trend.read`
- butuh feature `content`
- butuh permission `content.generate`

### Publishing

- `POST /v1/publishing/publish-jobs`
- butuh feature `publishing`
- butuh permission `publishing.write`

- `GET /v1/publishing/publish-jobs/:jobId`
- butuh feature `publishing`
- butuh permission `publishing.read`

### Profile and Workspace Access

- `PATCH /v1/profile`
- selalu butuh permission `profile.manage`
- jika mengubah `workspaceName`, juga butuh permission `workspace.manage`

- `GET /v1/workspace/members`
- butuh feature `team`
- butuh permission `members.manage`

- `PATCH /v1/workspace/members/:membershipId`
- butuh feature `team`
- butuh permission `members.manage`
- transfer `owner` belum didukung, jadi owner utama workspace tidak bisa didemote dari flow ini

- `GET /v1/workspace/features`
- butuh permission `workspace.view`

- `PATCH /v1/workspace/features/:featureCode`
- butuh permission `features.manage`
- endpoint ini sengaja tidak diblok oleh feature `workspace_settings`, supaya owner tetap bisa menghidupkan ulang feature yang sempat dimatikan

## Session and Profile Contract

`/v1/me` dan `/v1/profile` sekarang mengembalikan blok `authorization` dengan isi:

- `platformRoleCode`
- `workspaceRoleCode`
- `permissions`
- `features`
- `enabledFeatureCodes`

Tujuannya:

- web dan native bisa render menu sesuai access context
- frontend tidak perlu menebak permission dari string role saja
- perubahan matrix di backend bisa dipakai ulang oleh semua client

## Data Model

Schema utama:

- `identity.memberships`
  menyimpan role workspace
- `identity.platform_role_assignments`
  menyimpan role level platform seperti `superadmin`
- `identity.workspace_features`
  menyimpan toggle per workspace

Catatan penting:

- `identity.workspaces.owner_user_id` tetap ada sebagai penanda owner utama workspace
- `identity.memberships.role_code='owner'` tetap menjadi role operasional owner
- saat ada fitur transfer owner di masa depan, keduanya harus di-update dalam transaksi yang sama

## UI Guidance

### Web dan Native

UI sebaiknya:

- membaca `authorization.permissions` untuk kontrol aksi
- membaca `authorization.enabledFeatureCodes` untuk kontrol visibilitas modul
- tetap menampilkan fallback yang aman bila field authorization belum tersedia

UI sebaiknya tidak:

- hardcode semua keputusan akses hanya dari `roleCode`
- mengandalkan hide menu tanpa guard backend

## Current UI Surface

Implementasi UI yang sudah aktif saat ini:

- web profile page sudah memuat:
  - ringkasan authorization
  - list member workspace + ganti role
  - toggle feature workspace
  - disable field `workspaceName` bila user tidak punya `workspace.manage`
- native profile screen sudah memuat:
  - ringkasan authorization
  - list member workspace + ganti role
  - toggle feature workspace
  - disable field `workspaceName` bila user tidak punya `workspace.manage`
- native shell sudah memfilter menu `content`, `trend`, `assets`, dan `billing` berdasarkan feature + permission efektif
- web sidebar saat ini baru memfilter menu `billing` karena route produk lain di web belum selesai dimigrasikan dari template

## Recommended Next Steps

Urutan implementasi setelah fondasi ini:

1. halaman superadmin untuk melihat workspace, user, status feature, dan health auth
2. page-level guard di web untuk semua route produk, bukan baru sidebar/menu
3. flow transfer owner yang meng-update `workspaces.owner_user_id` dan membership `owner` dalam satu transaksi
3. audit log untuk:
   - perubahan role
   - perubahan feature toggle
   - suspend/unsuspend workspace
   - aksi sensitif auth
4. workspace switcher dan platform-wide access flow untuk superadmin
5. custom permission override jika suatu saat benar-benar dibutuhkan

## Current Limitations

Yang belum ada saat dokumen ini ditulis:

- UI admin untuk mengubah feature toggle
- UI manajemen member/role
- audit log authorization
- custom permission per user
- platform dashboard lintas workspace khusus superadmin

## Related Files

Implementasi utama ada di:

- `apps/api-gateway/src/lib/authorization.ts`
- `apps/api-gateway/src/lib/auth.ts`
- `apps/api-gateway/src/modules/identity/routes.ts`
- `packages/database/migrations/identity/0005_identity_authorization.sql`
