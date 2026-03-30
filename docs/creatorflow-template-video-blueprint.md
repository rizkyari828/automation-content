# CreatorFlow Template Video Blueprint

## Purpose

Dokumen ini menerjemahkan arah `Phase 1A` menjadi blueprint implementasi konkret untuk video template berbasis `Remotion + FFmpeg`.

Target fase ini:

- menghasilkan video promo `9:16` siap posting
- menjaga biaya development tetap sangat rendah
- membuat output cukup konsisten untuk affiliate test
- membangun fondasi yang bisa ditingkatkan ke generative layer setelah PMF

Dokumen ini melengkapi:

- `creatorflow-product-foundation.md`
- `creatorflow-next-development-brief.md`
- `creatorflow-microservice-blueprint.md`

## Phase Framing

### Phase 1A

Deterministic commerce video engine.

Stack:

- scene planner
- template system
- `Remotion`
- `FFmpeg`

Output:

- MP4 `9:16`
- subtitle baked-in
- CTA jelas
- thumbnail dan metadata render

### Phase 2

Generative enhancement layer.

Contoh:

- avatar presenter
- generative b-roll
- voiceover realistis

Provider bisa lewat `fal.ai`, tetapi produk tidak boleh terkunci pada satu gateway.

## Architecture

Alur utama:

1. user mengisi brief produk di `Content Studio`
2. `content` flow menghasilkan script, CTA, dan subtitle lines
3. scene planner menyusun `template-render-spec`
4. planner menghasilkan `template-scene-plan`
5. `media-processing-service` meneruskan plan ke provider `template`
6. provider `template` merender composition Remotion
7. `FFmpeg` melakukan final mux, subtitle burn, audio leveling, dan output packaging
8. hasil akhir disimpan sebagai asset internal

## Contracts

Contract lintas deployable untuk fase ini:

- [template-render-spec.schema.json](/Users/tovantest/Developer/Web-Front-End/automation-content/contracts/media/template-render-spec.schema.json)
- [template-scene-plan.schema.json](/Users/tovantest/Developer/Web-Front-End/automation-content/contracts/media/template-scene-plan.schema.json)

Rule:

- `template-render-spec` adalah input planner ke renderer
- `template-scene-plan` adalah bentuk scene yang sudah siap dipetakan ke composition

## Template System

Template tidak hanya dibagi per niche.

Template key harus menggabungkan:

- niche
- objective
- optional variant

Contoh:

- `beauty/promo_offer`
- `beauty/problem_solution`
- `gadget/comparison`
- `fashion/testimonial_style`

Kenapa:

- niche menentukan visual language
- objective menentukan struktur narasi

## Initial Niches

- beauty
- gadget
- fashion

## Initial Objectives

- promo_offer
- problem_solution
- testimonial_style
- comparison

## Scene Planner Responsibility

Scene planner bertugas untuk:

- memecah script menjadi urutan scene
- memilih layout dasar per scene
- menentukan subtitle cue
- menentukan text role: headline, price, offer, CTA
- memilih template key final

Scene planner belum bertugas untuk render akhir.

## Template Provider Responsibility

Provider `template` bertugas untuk:

- memuat composition Remotion sesuai `templateKey`
- memetakan scene plan ke props composition
- merender frame sequence
- menjalankan finishing melalui `FFmpeg`
- mengembalikan pointer asset internal

## Definition Of Done For Phase 1A

Fase ini dianggap selesai minimal bila:

- user bisa membuat 1 video `9:16` dari brief produk
- 3 niche awal berjalan
- 4 objective awal berjalan
- output sudah memuat hook, benefit, offer, dan CTA
- subtitle sudah tampil konsisten
- render job tercatat dengan `templateKey`, `renderMode`, dan provider yang dipakai

## Non-Goals

Untuk fase ini, yang belum menjadi tujuan:

- avatar presenter realistis
- voice cloning production-grade
- cinematic generative b-roll
- provider-specific UI

## Next Implementation Slice

Urutan implementasi yang direkomendasikan:

1. scene planner stub yang menghasilkan `template-render-spec`
2. template provider stub untuk `Remotion`
3. composition `9:16` generik
4. template pack `beauty/promo_offer`
5. template pack `gadget/comparison`
6. template pack `fashion/problem_solution`
