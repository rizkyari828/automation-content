# Native UI Blueprint

## Purpose

Dokumen ini menjabarkan rencana implementasi `apps/native-ui` sebagai aplikasi Flutter untuk:

- `iOS`
- `Android`
- `desktop`

Scope dokumen ini:

- struktur folder `apps/native-ui`
- mapping halaman `web-ui` ke screen Flutter
- aturan adaptasi design dari web ke native
- perubahan backend minimum agar client native bisa jalan rapi
- rollout plan bertahap agar tidak mengganggu `web-ui`

## Position In Current Architecture

Dengan arsitektur repo saat ini, posisi deployable menjadi:

```text
apps/
  web-ui/
  api-gateway/
  native-ui/
services/
  media-processing-service/
  publishing-service/
```

Tanggung jawab masing-masing:

- `web-ui`: frontend web utama berbasis `Next.js`
- `api-gateway`: backend bersama untuk web dan native
- `native-ui`: client Flutter untuk mobile dan desktop

Keputusan ini mempertahankan boundary yang sudah ada:

- web tetap memakai stack yang paling kuat untuk browser
- Flutter dipakai untuk pengalaman native dan distribusi app
- domain logic tetap berada di backend, bukan di UI

## Naming

Nama app yang dipakai:

```text
apps/native-ui
```

Alasan:

- konsisten dengan `apps/web-ui`
- tidak mengikat ke teknologi tertentu
- tetap relevan walaupun target platform bertambah

## Flutter Baseline

Gunakan Flutter `stable` terbaru pada saat implementasi dimulai.

Prinsipnya:

- jangan pin ke `beta` atau `main`
- gunakan line stable terbaru yang tersedia saat scaffold dibuat
- catat versi final yang dipakai di `README` atau `pubspec.yaml`

Saat blueprint ini ditulis, target yang masuk akal adalah line `3.41.x stable`.

## Recommended App Structure

Struktur awal yang disarankan:

```text
apps/native-ui/
  android/
  ios/
  linux/
  macos/
  windows/
  web/
  lib/
    app/
      app.dart
      bootstrap.dart
      router.dart
    core/
      auth/
      config/
      networking/
      storage/
      theme/
      widgets/
    features/
      auth/
        data/
        domain/
        presentation/
      dashboard/
        data/
        domain/
        presentation/
      content/
        data/
        domain/
        presentation/
      trend/
        data/
        domain/
        presentation/
      assets/
        data/
        domain/
        presentation/
      billing/
        data/
        domain/
        presentation/
      profile/
        data/
        domain/
        presentation/
    main.dart
  assets/
    fonts/
    icons/
    images/
  test/
  integration_test/
  pubspec.yaml
  README.md
```

Catatan:

- folder `web/` tetap boleh ada sebagai output default Flutter, tetapi bukan target utama produk
- source of truth UI native ada di `lib/`
- gunakan struktur per-feature agar lebih mudah tumbuh

## Architecture Inside `native-ui`

Prinsip implementasi:

- `core/` berisi concern lintas fitur
- `features/` berisi modul produk yang dipisah per domain layar
- setiap feature minimal punya lapisan `data`, `domain`, dan `presentation`
- network client hanya hidup di satu tempat
- penyimpanan token native hanya lewat secure storage

Rekomendasi concern per folder:

- `core/config`: base URL API, flavor, environment
- `core/networking`: HTTP client, interceptors, retry, auth header
- `core/auth`: session manager, token refresh coordinator
- `core/storage`: secure storage dan local preferences
- `core/theme`: color tokens, typography, spacing, elevation, component themes
- `core/widgets`: reusable native cards, buttons, stat tiles, empty state, app shell

## Screen Mapping From Existing Web UI

Halaman `web-ui` yang saat ini paling layak dijadikan basis:

### 1. Auth

Sumber web:

- `apps/web-ui/components/auth/sign-in-page.jsx`
- `apps/web-ui/components/auth/sign-up-page.jsx`

Port ke Flutter:

- `features/auth/presentation/sign_in_screen.dart`
- `features/auth/presentation/sign_up_screen.dart`

Yang diambil:

- struktur form
- hero panel / visual branding
- copy text
- primary CTA placement

Yang diadaptasi:

- mobile tidak perlu dua kolom penuh seperti web
- panel ilustrasi dibuat menjadi header, background card, atau onboarding side sheet
- error state dan loading state dibuat native

### 2. Dashboard

Sumber web:

- `apps/web-ui/components/dashboard/dashboard-page.jsx`

Port ke Flutter:

- `features/dashboard/presentation/dashboard_screen.dart`

Yang diambil:

- stat cards
- chart section
- sales by country
- categories list
- carousel / highlight panel

Yang diadaptasi:

- mobile memakai scroll vertikal dengan section card
- desktop bisa memakai grid yang lebih dekat ke web
- carousel web tidak wajib dipertahankan 1:1, cukup jadi highlight pager atau hero card

### 3. Profile

Sumber web:

- `apps/web-ui/components/profile/profile-page.jsx`

Port ke Flutter:

- `features/profile/presentation/profile_screen.dart`
- `features/profile/presentation/edit_profile_screen.dart`

Yang diambil:

- profile summary card
- edit profile form
- visual header image

Yang diadaptasi:

- tab `App / Messages / Settings` lebih cocok jadi segmented control atau section tabs
- edit form pada mobile dibuat per-section, bukan panel lebar dua kolom

### 4. Billing

Sumber web:

- `apps/web-ui/components/billing/billing-page.jsx`

Port ke Flutter:

- `features/billing/presentation/billing_screen.dart`

Yang diambil:

- payment method cards
- invoices list
- billing information
- transactions section

Yang diadaptasi:

- kartu pembayaran dijadikan native card stack
- daftar invoice menjadi list tile
- action `Add New Card` dibuat floating action atau top-right action sesuai platform

### 5. Tables

Sumber web:

- `apps/web-ui/components/tables/tables-page.jsx`

Port ke Flutter:

- `features/content/presentation/content_list_screen.dart`
- `features/assets/presentation/assets_list_screen.dart`

Yang diambil:

- struktur data table
- avatar + metadata row pattern
- progress row pattern

Yang diadaptasi:

- mobile jangan memaksa data table horizontal besar
- gunakan card list, slidable row, atau responsive data table
- desktop boleh pakai `DataTable` atau grid yang lebih padat

### 6. Virtual Reality

Sumber web:

- `apps/web-ui/components/virtual-reality/virtual-reality-page.jsx`

Status:

- jangan dijadikan prioritas MVP

Alasan:

- ini lebih cocok sebagai inspirasi visual daripada layar produk inti
- terlalu dekoratif untuk dijadikan baseline app native fase awal

Yang masih bisa dipakai:

- treatment visual
- quick action chips
- stacked card composition

## Native Design Translation Rules

Design web saat ini bisa dijadikan basis, tetapi tidak boleh dipindah mentah.

Aturan adaptasi:

- ambil `visual language`, bukan HTML/CSS
- ambil token warna, radius, shadow, dan rhythm spacing
- pertahankan identitas brand dan komposisi card
- ubah navigasi sesuai platform native
- hindari memindahkan layout dashboard desktop ke mobile secara literal

Prinsip layout:

- mobile: single column first
- tablet: two-pane bila berguna
- desktop: sidebar + content grid

Prinsip interaksi:

- gunakan bottom navigation atau rail untuk mobile
- gunakan navigation rail atau sidebar untuk tablet dan desktop
- modal web diganti menjadi dialog, bottom sheet, atau full-screen route sesuai konteks

## Design System Extraction

Sebelum banyak screen dibangun, lakukan ekstraksi design token dari `web-ui`.

Token minimum:

- primary color
- secondary color
- success, warning, error, info
- neutral scale
- border radius
- spacing scale
- elevation / shadow style
- icon size scale
- typography hierarchy

Output awal di Flutter:

- `AppColors`
- `AppSpacing`
- `AppRadius`
- `AppTextStyles`
- `AppTheme`

## Navigation Recommendation

Rekomendasi awal:

- mobile: `BottomNavigationBar` atau `NavigationBar`
- tablet/desktop: `NavigationRail` atau sidebar shell

Menu awal:

- Dashboard
- Content
- Trend
- Assets
- Billing
- Profile

Auth flow:

- unauthenticated shell untuk `sign-in` dan `sign-up`
- authenticated shell untuk area internal app

## State And Data Flow

Prinsip data flow:

- UI memanggil feature controller / notifier
- controller memanggil repository
- repository memakai API client
- API client mengurus bearer token dan refresh

Kebutuhan dasar:

- session bootstrap saat app launch
- silent refresh ketika access token expired
- logout yang membersihkan secure storage
- empty state, loading state, dan retry state di semua screen utama

## Backend Changes Required

`api-gateway` saat ini sudah cukup dekat untuk dipakai native, tetapi masih butuh penyesuaian.

### 1. Native-friendly auth flow

Kondisi saat ini:

- login dan register mengembalikan access token
- refresh session bergantung pada cookie refresh token

Masalah:

- flow cookie lebih cocok untuk browser
- app native butuh refresh token yang bisa dikelola secure storage

Perubahan minimum:

- pertahankan flow cookie untuk `web-ui`
- tambah flow native untuk `native-ui`
- `POST /v1/auth/login` dan `POST /v1/auth/register` bisa mengembalikan refresh token khusus native
- `POST /v1/auth/refresh` menerima refresh token dari body atau header untuk native
- `POST /v1/auth/logout` bisa revoke session native berbasis refresh token yang dikirim eksplisit

Pendekatan aman:

- bedakan client type `web` dan `native`
- tetap simpan refresh token server-side sebagai opaque token
- token native disimpan di secure storage, bukan shared preferences biasa

### 2. API contract hardening

Tambahan yang disarankan:

- definisikan kontrak HTTP resmi di `contracts/http/api-gateway`
- generate client untuk TypeScript dan Dart dari source yang sama
- standarkan response error
- standarkan pagination, sorting, filter, dan envelope response

### 3. CORS and client boundary

Walaupun native app tidak bergantung pada browser CORS seperti web, boundary client tetap perlu jelas.

Yang perlu ditambahkan:

- daftar origin web yang diizinkan
- pemisahan config web dan native bila perilaku auth berbeda
- observability per client type

### 4. Device/session management

Disarankan menambah:

- metadata client type
- device name
- platform
- app version

Manfaat:

- session management lebih jelas
- revoke per-device lebih mudah
- debug auth issue lebih gampang

## Recommended Packages For Flutter

Pilih seminimal mungkin di awal.

Kategori package yang kemungkinan diperlukan:

- routing
- HTTP client
- JSON serialization
- secure storage
- local persistence ringan
- state management
- charts
- responsive layout helpers

Prinsip:

- hindari terlalu banyak package UI template
- bangun komponen inti sendiri agar visual web bisa diterjemahkan konsisten

## Rollout Plan

### Phase 0

Foundation:

- scaffold `apps/native-ui`
- set Flutter stable terbaru
- siapkan `README`
- siapkan app theme
- siapkan app shell
- siapkan API client
- siapkan secure token storage

### Phase 1

Auth:

- sign in
- sign up
- session restore
- logout

Definition of done:

- user bisa login dari native
- session survive app restart
- token refresh berjalan otomatis

### Phase 2

Core MVP screens:

- dashboard
- profile
- content list / generator shell
- trend list

Definition of done:

- data utama bisa dibaca dari `api-gateway`
- layout mobile dan desktop sama-sama usable

### Phase 3

Operational screens:

- assets
- billing
- settings

### Phase 4

Quality:

- integration tests
- platform QA
- crash reporting
- analytics
- release pipeline

## First Build Scope

Agar cepat menghasilkan sesuatu yang bisa dinilai, build pertama cukup:

- theme system
- sign in
- sign up
- authenticated shell
- dashboard
- profile summary

Ini sudah cukup untuk:

- validasi arah UI native
- validasi auth flow baru
- validasi reuse design dari web

## Risks

Risiko utama:

- design web terlalu literal dibawa ke mobile
- auth native tidak dirancang terpisah dari web
- terlalu cepat mengadopsi package UI yang membuat visual tidak konsisten
- lisensi template atau asset dari basis `Argon` tidak dicek untuk penggunaan lintas platform
- menambah Dart sebagai bahasa ketiga tanpa guardrail CI dan ownership yang jelas

## Recommended Next Actions

Urutan kerja yang paling aman:

1. buat scaffolding `apps/native-ui`
2. tentukan auth contract khusus native di `api-gateway`
3. ekstrak design token dari `web-ui`
4. bangun `sign-in` dan `dashboard` sebagai vertical slice pertama
5. review hasil visual mobile dan desktop sebelum memperbanyak screen
