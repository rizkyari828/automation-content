# Event Schemas

Schema event di folder ini adalah source of truth untuk event lintas service.

Prinsip umum:

- payload event harus menyertakan `eventName`
- tambahkan `eventVersion` untuk evolusi schema
- gunakan `occurredAt` dalam format `date-time`
- `workspaceId` harus ada pada event yang relevan untuk isolasi tenant
