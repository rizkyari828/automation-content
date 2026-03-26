# CreatorFlow Email Architecture

## Purpose

Dokumen ini mendefinisikan arsitektur email awal untuk CreatorFlow dengan tujuan:

- biaya serendah mungkin pada fase awal
- tetap aman untuk registrasi, reset password, dan notifikasi pembayaran
- tetap mudah di-upgrade saat volume email naik

## Email Categories

### 1. Human inbox email

Digunakan untuk komunikasi manual:

- `hello@domain`
- `support@domain`
- `billing@domain`

### 2. Transactional email

Digunakan oleh sistem aplikasi:

- verifikasi email
- reset password
- welcome email
- payment success
- payment failed
- invoice ready
- publish failed

### 3. Internal or operational alerts

Digunakan untuk notifikasi internal tim:

- webhook failure
- repeated payment failure
- publish outage
- queue backlog warning

## Recommended Low-Cost Setup

### Inbox

Untuk fase awal, gunakan:

- domain sendiri
- `Cloudflare Email Routing` untuk forwarding inbox
- Gmail pribadi sebagai inbox tujuan sementara

Alasan:

- biaya sangat rendah
- cukup untuk komunikasi awal
- tidak perlu langsung berlangganan email suite

Catatan:

- solusi ini cocok untuk human inbox
- bukan solusi utama untuk mengirim email sistem aplikasi

### Transactional email

Untuk fase awal, gunakan:

- `Resend` sebagai transactional email provider

Alasan:

- setup cepat
- DX ramah untuk startup
- cocok untuk volume MVP

Untuk fase berikutnya saat volume naik dan cost per email menjadi sensitif:

- pindah atau tambahkan `Amazon SES`

### Separation principle

Gunakan pemisahan ini sejak awal:

- human inbox memakai domain utama
- email sistem memakai subdomain khusus

Contoh:

- inbox: `hello@creatorflow.id`
- transactional sender: `noreply@notify.creatorflow.id`

## Recommended Email Addresses

Minimal set:

- `hello@domain`
- `support@domain`
- `billing@domain`
- `noreply@notify.domain`
- `auth@notify.domain`

Catatan:

- `noreply@notify.domain` untuk email sistem umum
- `auth@notify.domain` bisa dipakai khusus auth flow jika ingin dipisah

## Sending Domain Strategy

Gunakan subdomain khusus untuk email sistem:

- `notify.domain`

Alasan:

- reputasi domain transaksi terpisah dari inbox manusia
- lebih aman jika nanti ada issue deliverability
- memudahkan migrasi provider

## DNS Records to Prepare

Minimal record yang perlu dipasang:

- `MX` untuk inbox routing
- `SPF`
- `DKIM`
- `DMARC`

Prinsip:

- inbox forwarding mengikuti kebutuhan provider inbox
- transactional provider harus punya `SPF` dan `DKIM`
- `DMARC` tetap disiapkan sejak awal

Catatan:

- jangan kirim email produksi dari domain yang belum punya SPF dan DKIM
- simpan pengaturan DNS sejelas mungkin agar migrasi provider tidak membingungkan

## Service Ownership

### `api-gateway`

Menangani:

- registration flow
- login and auth flow
- email verification request
- forgot password request

Modul yang relevan:

- `identity`
- `notification-lite`

### `billing-lite`

Menangani:

- payment checkout creation
- payment webhook handling
- subscription state changes
- trigger event untuk email receipt atau failed payment

### `publishing-service`

Menangani:

- publish failure event
- optional success notification event

### `notification-lite`

Menangani:

- rendering template email
- memanggil provider transactional email
- menyimpan delivery log dasar

Pada MVP, `notification-lite` cukup sebagai modul internal di `api-gateway`.

## Event and Flow Design

### Flow 1: Email Verification

1. User register.
2. `identity` membuat user dan verification token.
3. `notification-lite` mengirim email verification.
4. User klik verification link.
5. `identity` memverifikasi token dan mengaktifkan email status.

### Flow 2: Reset Password

1. User minta reset password.
2. `identity` membuat reset token dengan expiry.
3. `notification-lite` mengirim reset email.
4. User reset password lewat secure link.

### Flow 3: Payment Success

1. User checkout.
2. Payment provider mengirim webhook.
3. `billing-lite` memverifikasi signature dan update status payment.
4. `billing-lite` emit event `billing.payment.succeeded`.
5. `notification-lite` mengirim receipt atau success email.

### Flow 4: Payment Failed

1. Payment provider mengirim webhook gagal.
2. `billing-lite` update payment state.
3. `billing-lite` emit event `billing.payment.failed`.
4. `notification-lite` kirim email gagal bayar.

### Flow 5: Publish Failure

1. `publishing-service` gagal publish setelah retry policy.
2. Service emit event `publish.post.failed`.
3. `notification-lite` kirim email atau in-app notification sesuai plan.

## Recommended Email Templates

Template minimal untuk MVP:

- `verify-email`
- `reset-password`
- `welcome`
- `payment-success`
- `payment-failed`
- `invoice-ready`
- `publish-failed`

## Security Rules

Aturan dasar:

- jangan simpan token raw dalam log
- verification token dan reset token harus punya expiry
- webhook payment harus diverifikasi signature-nya
- gunakan signed links untuk auth-related email action
- audit log untuk payment status change

## Cost Strategy

### Phase 0

- beli domain
- setup `Cloudflare Email Routing`
- gunakan Gmail pribadi untuk inbox manual

### Phase 1

- setup `Resend` untuk email transaksional
- kirim auth email dan payment email dari `notify.domain`

### Phase 2

- pindah atau tambah `Amazon SES` jika volume email naik
- pertahankan subdomain `notify.domain` agar migrasi lebih mudah

## What Not to Do

- jangan pakai Gmail pribadi untuk mengirim email aplikasi
- jangan campur inbox manusia dan domain reputasi email sistem
- jangan jadikan payment gateway sebagai satu-satunya sumber notifikasi customer
- jangan kirim email produksi tanpa SPF, DKIM, dan DMARC

## Extraction Trigger

`notification-lite` layak dipisah menjadi `notification-service` jika:

- volume email naik signifikan
- mulai ada multi-channel notification seperti email, WhatsApp, push
- template dan policy notifikasi makin kompleks
- tim ownership mulai berbeda

## Final Recommendation

Untuk CreatorFlow fase awal:

- human inbox: `Cloudflare Email Routing`
- transactional email: `Resend`
- future cost optimization: `Amazon SES`
- implementasi awal: `notification-lite` di dalam `api-gateway`

Ini adalah kombinasi paling hemat, paling cepat dipasang, dan masih aman untuk registration, password reset, dan payment notification.
