# Security And Dependency Policy

Dokumen ini menjelaskan guardrail keamanan untuk dependency dan runtime CreatorFlow.

## Scope

Policy ini berlaku untuk:

- `apps/`
- `services/`
- `packages/`
- Docker runtime image

## Dependency Rules

- gunakan package dan runtime yang masih aktif dipelihara upstream
- utamakan dependency dengan surface area kecil dan komunitas yang stabil
- hindari menambah package baru jika fitur bisa diselesaikan dengan stack inti yang sudah dipilih
- jangan tambahkan dependency eksperimen ke jalur production tanpa alasan kuat

## Update Policy

- patch dan security update: secepat mungkin setelah diverifikasi
- minor update: rutin, minimal bulanan
- major update: dijadwalkan, diuji, dan dicatat impact-nya

## Runtime Baseline

Baseline resmi ada di [SUPPORT_MATRIX.md](/Users/tovantest/Developer/Web-Front-End/automation-content/SUPPORT_MATRIX.md).

Fokus utamanya:

- `Node.js 22.x`
- `npm 10.x`
- `Go 1.25.x`
- `PostgreSQL 17.x`
- `Redis 7.x`

## Security Hygiene

- commit lockfile dan gunakan satu package manager resmi saja
- aktifkan automated dependency monitoring seperti Dependabot atau Renovate saat repo masuk remote
- jalankan `npm audit` untuk workspace Node.js
- jalankan `govulncheck` untuk service Go
- scan base image Docker secara berkala
- gunakan secret manager atau environment injection, jangan commit credential

## Release Guardrails

- jangan deploy dari branch dengan dependency drift yang belum diverifikasi
- jangan pakai release candidate atau canary sebagai default production
- setiap dependency baru harus punya owner yang jelas dan alasan pemakaian yang bisa dipertanggungjawabkan
