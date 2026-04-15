# CreatorFlow Docs Index

Dokumen di folder ini dibagi menjadi dua kelompok:

- product and GTM source of truth
- technical architecture and delivery source of truth

Dokumen product dipakai untuk menjaga supaya roadmap, copy, pricing, onboarding, dan sequencing feature tetap konsisten dengan thesis bisnis CreatorFlow.

Dokumen technical dipakai untuk implementasi service, database, auth, observability, UI, dan QA.

## Product And GTM

- `creatorflow-product-foundation.md`
  Ringkasan inti bisnis CreatorFlow: ICP, positioning, promise, messaging guardrails, proof model, dan aturan sequencing produk.
- `creatorflow-next-development-brief.md`
  Brief kerja lintas fungsi untuk 90 hari berikutnya: workstream development, acceptance criteria launch, dan hal-hal yang harus sinkron antara product, engineering, design, dan growth.
- `creatorflow-onboarding-persona-spec.md`
  Spesifikasi onboarding per persona untuk seller, affiliate, dan agency/operator agar activation tetap seller-first.
- `creatorflow-activation-event-taxonomy.md`
  Taxonomy event untuk activation dan conversion funnel dari landing sampai trial ke paid.

## Architecture And Delivery

- `creatorflow-microservice-blueprint.md`
  Blueprint service boundary, async execution, contracts, infra decision, dan rollout backend.
- `creatorflow-database-architecture.md`
  Arsitektur database, schema ownership, migration, storage, durability, dan growth path.
- `creator-studio-v1.md`
  Blueprint awal Creator Studio: scope creator use case, schema raw brief, UX flow, backend split, dan backlog implementasi.
- `creatorflow-email-architecture.md`
  Arsitektur email transactional dan operational.
- `creatorflow-project-structure.md`
  Struktur repo, pembagian app, service, package, contract, dan urutan build.
- `creatorflow-authorization-role-model.md`
  Role model, permission matrix, feature toggle, dan enforcement saat ini.
- `creatorflow-observability-logging.md`
  Logging, event projection, audit, metrics, dan screen observability.
- `native-ui-blueprint.md`
  Blueprint native UI dan requirement backend untuk surface mobile.
- `auth-responsive-qa-matrix.md`
  QA matrix untuk auth, SSO, shell, dan responsiveness.

## Reading Order

Untuk orang baru di project:

1. `creatorflow-product-foundation.md`
2. `creatorflow-next-development-brief.md`
3. `creatorflow-onboarding-persona-spec.md`
4. `creatorflow-activation-event-taxonomy.md`
5. `creatorflow-project-structure.md`
6. `creatorflow-microservice-blueprint.md`
7. `creatorflow-database-architecture.md`

## Working Rule

Jika ada konflik antara keputusan teknis dan thesis produk:

- cek dulu `creatorflow-product-foundation.md`
- lalu cek `creatorflow-next-development-brief.md`
- baru turunkan ke dokumen teknis yang relevan

Tujuannya supaya CreatorFlow tidak drift menjadi product yang technically neat tetapi kehilangan wedge komersialnya.
