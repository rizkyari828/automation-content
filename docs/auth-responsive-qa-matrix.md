# Auth And Responsive QA Matrix

Dokumen ini dipakai untuk smoke test dan regression pass untuk auth, SSO, dan responsiveness di CreatorFlow web dan native.

## Scope

Area yang dicakup:

- web sign in
- web sign up
- web SSO
- native sign in
- native sign up
- native SSO
- responsive layout auth
- responsive shell layout setelah login

Di luar scope dokumen ini:

- load testing
- pentest
- visual snapshot automation
- billing, content, trend, assets, dan profile detail flow selain validasi layout dasar

## Preconditions

Sebelum test:

1. Jalankan migration identity OAuth terbaru.
2. Pastikan env OAuth provider sudah terisi di backend.
3. Untuk native SSO, set `NATIVE_SSO_BRIDGE_BASE_URL` ke endpoint publik `https`.
4. Redirect URI provider harus mengarah ke route CreatorFlow yang sesuai.
5. Siapkan minimal 1 akun email/password dan 1 akun untuk tiap provider sosial yang ingin diuji.

## Platform Matrix

| Surface | Platform | Layout Target | Auth Status |
| --- | --- | --- | --- |
| Web UI | iPhone / Android browser | Mobile | Ready |
| Web UI | iPad / Android tablet browser | Tablet | Ready |
| Web UI | macOS / Windows / Linux browser | Desktop | Ready |
| Native UI | Android phone | Mobile | Ready |
| Native UI | Android tablet | Tablet | Ready |
| Native UI | macOS | Desktop | Ready |
| Native UI | iOS | Mobile / Tablet | UI-ready, platform scaffold pending |
| Native UI | Windows | Desktop | Layout ready, SSO blocked pending webview setup |
| Native UI | Linux | Desktop | Layout ready, SSO blocked pending webview setup |

## Device And Breakpoint Suggestions

Gunakan kombinasi ini saat exploratory test:

### Web

| Class | Suggested Width |
| --- | --- |
| Small mobile | 360 x 800 |
| Large mobile | 430 x 932 |
| Tablet portrait | 768 x 1024 |
| Tablet landscape | 1024 x 768 |
| Laptop | 1366 x 768 |
| Desktop | 1440 x 900 |
| Wide desktop | 1920 x 1080 |

### Native

| Class | Suggested Device |
| --- | --- |
| Small phone | Android 6.1" class |
| Large phone | Android 6.7" class |
| Tablet portrait | 11" tablet |
| Tablet landscape | 11" tablet rotated |
| Laptop desktop | macOS window 1280 x 800 |
| Large desktop | macOS / Windows / Linux window 1440 x 900+ |

## Core Acceptance Criteria

### Shared Auth Criteria

- User bisa sign in dengan email/password.
- User bisa sign up dengan email/password.
- Error state tampil jelas dan tidak merusak layout.
- Loading state mencegah double submit.
- Setelah login berhasil, session tersimpan dan user masuk ke shell/dashboard.
- Logout menghapus session dan kembali ke layar auth.

### Shared SSO Criteria

- Google, X/Twitter, Facebook, dan Apple tampil sebagai pilihan jika surface mendukung.
- Flow SSO berhasil membuat session CreatorFlow.
- First-time SSO user mendapat workspace default otomatis.
- Existing SSO user bisa login ulang tanpa membuat workspace duplikat.
- Error provider atau cancel login kembali ke app/page dengan pesan error yang bisa dimengerti.

### Responsive Criteria

- Tidak ada horizontal overflow.
- Tidak ada tombol yang terpotong atau bertumpuk.
- Tidak ada teks penting yang keluar card/container.
- Form tetap bisa di-scroll penuh di viewport pendek.
- Header/action shell tidak overflow di tablet portrait atau laptop kecil.
- Navigation desktop dan mobile berubah sesuai lebar layar tanpa kehilangan fungsi.

## Web Auth Checklist

### Sign In

- Halaman `/sign-in` terbuka normal di mobile, tablet, dan desktop.
- Card auth tetap center dan nyaman dibaca.
- Tombol social auth 1 kolom di mobile dan 2 kolom saat lebar cukup.
- Form email/password masih mudah dijangkau setelah social auth section muncul.
- `next` query masih mengarahkan user ke halaman tujuan setelah login sukses.

### Sign Up

- Halaman `/sign-up` tidak overflow di mobile.
- Form manual dan social auth tetap terbaca tanpa tabrakan spacing.
- Background hero tidak mengganggu readability di layar kecil.
- Setelah register sukses, user masuk ke dashboard.

### SSO Provider Pass

Ulangi untuk Google, X/Twitter, Facebook, Apple:

1. Klik tombol provider.
2. Pastikan redirect ke provider benar.
3. Selesaikan login.
4. Pastikan kembali ke CreatorFlow.
5. Pastikan cookie session terbentuk.
6. Refresh halaman dan pastikan session tetap aktif.
7. Logout dan pastikan session hilang.

### Web Failure Cases

- credential email/password salah
- email sudah terdaftar saat sign up
- provider cancel login
- state OAuth invalid / expired
- provider callback tanpa code
- backend provider secret belum terpasang

## Native Auth Checklist

### Sign In And Sign Up Layout

- Di phone portrait, semua field dan tombol masih terlihat dengan scroll wajar.
- Di tablet portrait, card tidak terlalu sempit dan action tidak mepet.
- Di desktop window kecil, shell header wrap dengan rapi.
- Di desktop window besar, rail tetap nyaman dan konten tidak terlihat kosong berlebihan.

### Native SSO Pass

Ulangi untuk Google, X/Twitter, Facebook, Apple:

1. Buka native sign in atau sign up.
2. Tap provider.
3. Browser auth session terbuka.
4. Login di provider.
5. Callback kembali ke app.
6. App menukar code/state ke backend.
7. Token tersimpan dan user masuk ke app shell.

### Native Failure Cases

- provider cancel login
- callback code/state hilang
- bridge URL tidak valid
- Apple dicoba tanpa bridge `https`
- platform Windows/Linux mencoba SSO dan menampilkan pesan guard

## Shell Layout Checklist

### Native Shell

- `< 900px`: gunakan bottom navigation.
- `>= 900px`: gunakan navigation rail.
- `>= 1200px`: rail extended.
- Header action tidak overflow pada lebar sekitar `680px` sampai `900px`.
- Sign out tetap bisa diakses di semua lebar.

### Web Shell Touchpoints

- Session panel tidak overflow saat nama workspace panjang.
- Logout button tetap terlihat di mobile.
- Auth navbar collapse tetap berfungsi saat layar sempit.

## Regression Smoke Order

Urutan cepat yang disarankan:

1. Web sign in email/password.
2. Web Google SSO.
3. Web logout.
4. Native Android sign in email/password.
5. Native Android Google SSO.
6. Native logout.
7. Resize pass untuk web auth pages.
8. Resize pass untuk native shell window.

## Known Gaps

- iOS native platform scaffold belum ada di repo saat ini.
- Windows/Linux native SSO masih sengaja diblok sampai webview setup desktop disiapkan.
- Belum ada automated UI test untuk provider SSO.
- Belum ada connected-accounts management screen untuk link/unlink provider.

## Sign-Off Template

| Area | Result | Notes |
| --- | --- | --- |
| Web email/password auth | Pass / Fail | |
| Web Google SSO | Pass / Fail | |
| Web Twitter SSO | Pass / Fail | |
| Web Facebook SSO | Pass / Fail | |
| Web Apple SSO | Pass / Fail | |
| Native email/password auth | Pass / Fail | |
| Native Google SSO | Pass / Fail | |
| Native Twitter SSO | Pass / Fail | |
| Native Facebook SSO | Pass / Fail | |
| Native Apple SSO | Pass / Fail | |
| Responsive auth layouts | Pass / Fail | |
| Responsive shell layouts | Pass / Fail | |
