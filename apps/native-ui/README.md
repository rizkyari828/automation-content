# Native UI

Flutter shell untuk `apps/native-ui` di monorepo CreatorFlow.

Target aktif saat ini:

- Android
- macOS
- Linux
- Windows

Target yang masih pending setup lokal:

- iOS

Catatan iOS:

- scaffold iOS belum ditambahkan karena mesin lokal meminta pemilihan Apple Development certificate
- setelah certificate dipilih, jalankan `flutter create --platforms=ios .` dari folder ini

## Flutter Baseline

Project ini disiapkan dengan Flutter `3.41.5 stable`.

## Local Commands

Install dependency:

```bash
flutter pub get
```

Run di macOS:

```bash
flutter run -d macos
```

Run di Android:

```bash
flutter run -d android
```

Analyze:

```bash
flutter analyze
```

Test:

```bash
flutter test
```

## Structure

Struktur utama yang dipakai:

```text
lib/
  app/
  core/
  features/
assets/
test/
integration_test/
```

## Current Scope

Shell awal ini sudah memuat:

- theme dasar yang mengikuti arah visual `web-ui`
- Riverpod foundation untuk app scope, auth state, dashboard state, dan shell navigation
- auth entry screens
- adaptive app shell untuk mobile dan desktop
- placeholder screens untuk dashboard, content, trend, assets, billing, dan profile
- config dasar untuk `API_BASE_URL` dan `clientType=native`

## Native SSO

Native auth sekarang mendukung email/password dan tombol SSO yang berbagi backend OAuth dengan web.

Flow-nya:

1. app minta `authorizationUrl` ke `api-gateway`
2. app membuka browser auth session
3. provider callback ke bridge endpoint backend
4. backend me-redirect hasil callback ke custom scheme `creatorflownative://oauth/callback`
5. app menukar `code/state` ke `api-gateway` lalu menyimpan token native

Runtime config yang dipakai Flutter:

- `API_BASE_URL`
- `NATIVE_SSO_BRIDGE_BASE_URL`

Contoh run:

```bash
flutter run -d macos \
  --dart-define=API_BASE_URL=https://api.example.com \
  --dart-define=NATIVE_SSO_BRIDGE_BASE_URL=https://api.example.com
```

Catatan penting:

- Android dan macOS sudah siap untuk callback custom scheme.
- iOS layout Flutter-nya ikut siap, tapi scaffold platform iOS masih perlu dibuat di mesin yang punya setup Xcode/certificate.
- Windows dan Linux masih dibatasi di runtime untuk SSO karena `flutter_web_auth_2` butuh setup webview tambahan. Layout tetap adaptive, tapi login SSO belum saya buka di platform itu.
- Apple Sign In butuh `NATIVE_SSO_BRIDGE_BASE_URL` berbasis `https://`.

## Responsive Notes

Layar auth dan app shell dibuat adaptive untuk:

- mobile phone
- tablet
- laptop
- desktop monitor

Pola layout yang dipakai:

- auth form tetap satu kolom di layar kecil
- tombol social auth berubah jadi grid 2 kolom saat ruang cukup
- shell memakai `NavigationBar` di layar kecil dan `NavigationRail` di layar lebar
- header shell bisa pecah menjadi beberapa baris agar action tidak overflow di tablet portrait atau laptop kecil

Checklist QA gabungan web dan native ada di [docs/auth-responsive-qa-matrix.md](/Users/tovantest/Developer/Web-Front-End/automation-content/docs/auth-responsive-qa-matrix.md).

Dokumen role, permission, dan feature toggle untuk tim ada di [docs/creatorflow-authorization-role-model.md](/Users/tovantest/Developer/Web-Front-End/automation-content/docs/creatorflow-authorization-role-model.md).

Saat ini profile screen native juga sudah memuat:

- ringkasan authorization user aktif
- management role member workspace
- toggle feature workspace
- adaptive layout untuk mobile, tablet, laptop, dan desktop
