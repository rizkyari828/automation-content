# Trend Event Schemas

Event di domain `trend` dipakai untuk propagasi signal, digest, dan recommendation ringan.

Prinsip awal:

- gunakan hanya untuk insight yang berasal dari public signals legal dan stabil
- jangan encode klaim kepastian viral ke dalam payload event
- payload harus tetap cocok untuk consumer `api-gateway`, analytics, dan notification
