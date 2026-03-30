# Media Contracts

Folder ini menyimpan kontrak lintas deployable untuk pipeline media yang belum tepat masuk ke `OpenAPI` atau event schema.

Isi awal:

- `template-render-spec.schema.json`
- `template-scene-plan.schema.json`

Rule:

- `template-render-spec` adalah input netral dari scene planner ke template renderer
- `template-scene-plan` adalah output terstruktur yang siap dipetakan ke composition Remotion
- perubahan schema harus backward-compatible atau diversioning secara eksplisit
