# Media Processing Service

Service Go untuk render, clipping, subtitle, dan media jobs lain yang worker-heavy.

Endpoint internal yang sekarang tersedia:

- `GET /health`
- `GET /internal/v1/whoami`
- `POST /internal/v1/render-jobs`
- `GET /internal/v1/render-jobs/{jobId}`

`/internal/v1/whoami` membutuhkan internal JWT dengan:

- issuer: `INTERNAL_SERVICE_ISSUER`
- audience: `INTERNAL_SERVICE_AUDIENCE`
- secret signer: `INTERNAL_SERVICE_SECRET`

## Render Provider Architecture

Render jobs sekarang dirancang provider-agnostic.

- request render memakai kontrak internal yang netral provider
- worker memilih provider lewat registry dan routing layer
- provider aktual dicatat di `provider_name`
- external job ID dicatat di `provider_job_id`
- spec netral disimpan di `metadata.renderRequest`

Provider yang sudah dipasang sebagai adapter foundation:

- `dev_noop`
- `template`
- `fal_veo31_fast`
- `fal_sora2`
- `veo3`
- `sora`
- `runway`
- `luma`

Catatan provider generative saat ini:

- profile `fal_veo31_fast` dan `fal_sora2` membaca aktivasi dari `FAL_API_KEY`
- jalur ini sudah siap dipilih sebagai provider profile, tapi dispatch API real ke fal belum dihidupkan
- untuk development harian, tetap pakai `template` sebagai jalur default yang stabil

Saat ini adapter selain `dev_noop` dan `template` masih berupa skeleton dispatch layer, jadi aman untuk bangun routing tanpa mengunci produk ke satu vendor.
