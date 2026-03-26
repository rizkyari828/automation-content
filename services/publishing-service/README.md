# Publishing Service

Service Go untuk scheduling, publish execution, retry, dan social connector workflows.

Endpoint internal yang sekarang tersedia:

- `GET /health`
- `GET /internal/v1/whoami`

`/internal/v1/whoami` membutuhkan internal JWT dengan:

- issuer: `INTERNAL_SERVICE_ISSUER`
- audience: `INTERNAL_SERVICE_AUDIENCE`
- secret signer: `INTERNAL_SERVICE_SECRET`
