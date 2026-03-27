# API Gateway

Public API entrypoint untuk CreatorFlow MVP.

Pada fase awal, deployable ini juga menampung logical modules:

- `identity`
- `content`
- `asset`
- `affiliate-lite`
- `billing-lite`
- `notification-lite`
- `analytics-lite`

Dokumen role, permission, dan feature toggle untuk tim ada di [docs/creatorflow-authorization-role-model.md](/Users/tovantest/Developer/Web-Front-End/automation-content/docs/creatorflow-authorization-role-model.md).

Workspace access management yang saat ini tersedia lewat gateway:

- `GET /v1/workspace/members`
- `PATCH /v1/workspace/members/:membershipId`
- `GET /v1/workspace/features`
- `PATCH /v1/workspace/features/:featureCode`
