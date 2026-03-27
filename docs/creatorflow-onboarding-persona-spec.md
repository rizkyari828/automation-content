# CreatorFlow Onboarding Persona Spec

## Purpose

Dokumen ini menjadi acuan onboarding CreatorFlow untuk fase launch awal.

Target utamanya:

- mempercepat time to first video
- membedakan jalur onboarding berdasarkan persona nyata
- menyelaraskan landing, signup, app onboarding, dan assisted follow-up
- memberi acceptance criteria yang bisa dipakai product, design, web, backend, dan growth

Dokumen ini mengikuti guardrail dari `creatorflow-product-foundation.md` dan `creatorflow-next-development-brief.md`.

## Primary Onboarding Goal

User harus bisa sampai ke draft video promo pertama yang terasa relevan terhadap produk nyata mereka dalam satu sesi pertama.

Definisi berhasil:

- user memasukkan link produk atau brief produk nyata
- user memilih angle jualan yang masuk akal
- sistem menghasilkan hook, script, caption, CTA, dan draft video awal
- user paham langkah berikutnya: revise, publish, export, atau lanjut assisted onboarding

## Persona Priority

### 1. Seller Solo Or Small Team

Persona utama launch.

Karakter:

- punya 1 sampai 3 orang dalam operasional
- fokus ke jualan harian
- butuh banyak variasi video promo
- sering bingung ide konten dan tidak konsisten posting

Nilai yang paling cepat terasa:

- satu produk menjadi beberapa angle jualan
- draft video promo cepat tanpa syuting ulang
- ritme konten lebih stabil

### 2. Affiliate Operator

Persona utama kedua.

Karakter:

- memegang beberapa link aktif
- butuh variasi konten tinggi
- sensitif pada speed dan output volume
- lebih menghitung hasil per produk atau per link

Nilai yang paling cepat terasa:

- banyak draft dari satu link produk
- hook dan angle lebih cepat untuk testing
- effort operasional lebih ringan

### 3. Agency Or Multi-Account Operator

Persona sekunder.

Karakter:

- mengelola banyak akun atau klien
- butuh workflow repeatable
- butuh tim collaboration dan approval

Nilai yang paling cepat terasa:

- workflow bisa dipakai ulang
- output lebih mudah direview
- banyak produk atau akun bisa dikelola lebih rapi

## Non-Goal

Onboarding awal tidak dioptimalkan untuk creator umum, personal brand, atau use case ekspresi diri.

Jika wording, question flow, atau empty state terasa terlalu creator-generic, maka onboarding harus diperbaiki.

## Shared Onboarding Principles

Semua persona harus mengikuti prinsip berikut:

1. mulai dari produk nyata, bukan demo abstrak
2. hindari terlalu banyak pilihan di awal
3. tanyakan hanya field yang membantu output pertama
4. jangan paksa user memahami semua capability dulu
5. assisted option harus selalu terlihat untuk user yang ragu
6. semua langkah harus terasa seller-first, bukan AI-first

## Recommended Funnel Shape

Urutan funnel:

1. landing page
2. signup
3. persona capture ringan
4. workspace setup minimum
5. first product input
6. angle selection
7. first draft generation
8. draft review
9. next-step prompt

## Step Spec

### Step 0. Pre-Signup Context

Source:

- landing CTA
- demo CTA
- assisted CTA
- referral

Data yang ideal dibawa ke signup:

- source
- campaign
- CTA variant
- persona hint jika ada
- assisted intent

Tujuan:

- mengurangi friction pada langkah berikutnya
- membantu growth tahu intent user

### Step 1. Signup

Tujuan:

- membuat akun dengan friction serendah mungkin

Minimum data:

- name
- email atau identifier utama
- password atau SSO

Jangan minta terlalu banyak data bisnis di sini.

### Step 2. Persona Capture

Tujuan:

- memilih jalur onboarding yang paling relevan

Question minimum:

- kamu lebih dekat ke seller, affiliate, atau agency/operator?
- berapa banyak produk atau link aktif yang biasanya kamu kelola?
- apa tujuan utamamu hari ini?

Jawaban tidak boleh terlalu panjang atau administratif.

Output:

- `persona_type`
- `volume_band`
- `primary_goal`

### Step 3. Workspace Setup Minimum

Tujuan:

- membuat konteks kerja cukup jelas tanpa menghambat aktivasi

Field minimum:

- workspace name
- optional category atau niche
- optional team size

Jangan memaksa pengaturan lanjutan sebelum first draft selesai.

### Step 4. First Product Input

Tujuan:

- membawa user ke konteks yang nyata

Input yang didukung:

- product URL
- short brief
- manual product context jika URL belum siap

Field minimum yang berguna:

- nama produk
- platform atau source
- benefit utama
- target buyer singkat

Acceptance:

- user bisa masuk hanya dengan field minimum
- sistem tetap bisa membuat output pertama

### Step 5. Angle Selection

Tujuan:

- membantu user merasa sistem memahami konteks jualannya

Preset angle awal:

- problem-solution
- benefit-led
- testimonial
- urgency
- lifestyle
- price shock

Rule:

- tampilkan angle sebagai opsi sederhana
- boleh beri rekomendasi default
- jangan tampilkan terlalu banyak jargon AI

### Step 6. First Draft Generation

Output minimum:

- hook
- script
- caption
- CTA
- draft video awal atau draft visual structure

Success state harus menegaskan:

- draft pertama sudah jadi
- apa yang bisa direview
- apa yang bisa diubah
- apa langkah berikutnya

### Step 7. Draft Review

User harus bisa:

- melihat output utama tanpa bingung
- memilih draft yang paling relevan
- paham apakah perlu revise atau lanjut

Jangan memaksa publish langsung jika user belum percaya diri.

### Step 8. Next-Step Prompt

Setelah first draft selesai, tampilkan jalur yang relevan:

- lanjut revise
- generate angle lain
- export
- schedule atau publish
- minta bantuan onboarding

Tujuannya:

- menjaga momentum
- mengurangi kebingungan setelah activation awal

## Persona-Specific Variations

### Seller Path

Fokus utama:

- satu produk menjadi beberapa angle
- konten promo harian
- publish consistency

Question tambahan yang layak:

- produk utama dijual di mana?
- kamu paling sering butuh konten untuk platform apa?

First success definition:

- 1 produk
- minimal 3 angle
- minimal 1 draft terasa layak dipakai

Recommended post-first-draft CTA:

- buat 3 draft lagi dari produk yang sama
- siapkan caption per platform
- jadwalkan assisted onboarding

### Affiliate Path

Fokus utama:

- link aktif banyak
- output cepat
- variasi hook tinggi

Question tambahan yang layak:

- biasanya kamu pegang berapa link aktif?
- niche produk apa yang paling sering kamu promosikan?

First success definition:

- 1 link
- beberapa angle testing
- 1 draft yang siap dipakai untuk eksperimen cepat

Recommended post-first-draft CTA:

- duplicate untuk angle lain
- simpan template untuk produk berikutnya
- lanjut ke paket output yang lebih tinggi

### Agency Or Multi-Account Path

Fokus utama:

- repeatability
- multi-account readiness
- review dan approval

Question tambahan yang layak:

- berapa akun atau klien aktif?
- apakah kamu butuh approval flow?

First success definition:

- draft pertama berhasil dibuat
- user paham bahwa workflow bisa direpeat untuk banyak account

Recommended post-first-draft CTA:

- invite teammate
- buat workspace structure
- schedule assisted setup

## Assisted Onboarding Layer

Assisted onboarding bukan fallback semata. Ia bagian dari conversion system.

Trigger yang sebaiknya memunculkan assisted offer:

- user berhenti sebelum input produk
- user gagal menghasilkan draft pertama
- user generate draft tapi tidak lanjut
- user datang dari campaign high-intent
- user memilih persona agency atau multi-account

Minimum assisted handoff data:

- persona
- product link atau brief
- status onboarding terakhir
- draft count
- activation blocker jika ada
- preferred contact channel

## SLA And Operational Notes

Untuk fase awal:

- high-intent lead sebaiknya di-follow-up cepat
- assisted CTA harus mengarah ke jalur yang benar-benar dijaga tim
- jika memakai WhatsApp, email, atau demo scheduling, ownership-nya harus jelas

## UI Guidance

Prinsip UI:

- jangan jadikan wizard terlalu panjang
- simpan progress agar user bisa kembali
- tampilkan progress step yang sederhana
- highlight hasil, bukan konfigurasi
- empty state harus selalu memberi contoh produk nyata

## Data Contract Needed

Field minimum yang perlu tersedia lintas flow:

- `persona_type`
- `volume_band`
- `primary_goal`
- `workspace_id`
- `activation_status`
- `first_product_source_type`
- `assisted_intent`

## Success Metrics

Metric onboarding yang wajib dipantau:

- signup to onboarding start
- onboarding start to product input
- product input to first draft
- time to first video
- first session completion rate
- assisted request rate
- assisted to paid conversion

## Acceptance Criteria

Onboarding dianggap siap untuk launch terkontrol jika:

- seller path bisa selesai di bawah 10 menit
- affiliate path bisa menghasilkan draft pertama dalam satu sesi
- agency path tidak memaksa setup berat sebelum first proof
- user paham langkah berikutnya setelah output pertama
- jalur assisted dan self-serve tidak saling bertabrakan

## Related Docs

- `creatorflow-product-foundation.md`
- `creatorflow-next-development-brief.md`
- `creatorflow-activation-event-taxonomy.md`
- `creatorflow-email-architecture.md`
