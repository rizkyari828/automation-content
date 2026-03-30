# Contracts

Folder ini adalah source of truth untuk kontrak lintas deployable.

Isi utamanya:

- `contracts/http` untuk `OpenAPI`
- `contracts/events` untuk event schema `JSON Schema`
- `contracts/media` untuk schema pipeline media lintas service yang belum tepat menjadi `OpenAPI` atau event

Prinsip:

- jangan menjadikan type file hasil generate sebagai source of truth
- perubahan contract harus backward-compatible atau diversioning secara eksplisit
- service TypeScript dan Go membaca kontrak yang sama dari sini
