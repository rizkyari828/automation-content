# Logger Package

Tempat untuk kontrak structured logger, request ID, dan correlation ID helpers lintas service.

## Purpose

Package ini tidak harus memaksa satu implementation detail untuk semua bahasa.

Tujuannya adalah:

- menyamakan nama field log lintas `TypeScript` dan `Go`
- menyamakan aturan propagation untuk `requestId` dan `correlationId`
- mencegah tiap service punya format log yang berbeda-beda

## Scope

Package ini sebaiknya menjadi acuan untuk:

- nama field log
- helper request context
- helper correlation propagation
- redaction rule dasar

Package ini tidak perlu menjadi centralized logging service.

## Minimum shared fields

Field minimum yang disarankan:

- `timestamp`
- `level`
- `service`
- `environment`
- `message`
- `requestId`
- `correlationId`

Field tambahan yang sebaiknya didukung bila tersedia:

- `workspaceId`
- `userId`
- `jobId`
- `httpMethod`
- `httpRoute`
- `httpStatusCode`
- `durationMs`
- `errorCode`
- `errorMessage`

## Header propagation

Header internal yang direkomendasikan:

- `X-Request-Id`
- `X-Correlation-Id`
- `X-Actor-Type`
- `X-Actor-Id`
- `X-Workspace-Id`

## Storage rule

Aturan penting:

- raw application logs tetap keluar ke `stdout`
- collector infra yang mengagregasi log ke centralized log store
- UI internal membaca activity feed dan audit log dari database, bukan raw logs langsung

Dokumen blueprint lengkap ada di:

- `docs/creatorflow-observability-logging.md`
