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
