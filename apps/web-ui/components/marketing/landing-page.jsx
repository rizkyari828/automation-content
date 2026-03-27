"use client";

import Link from "next/link";

import { useWebLocale } from "../i18n/web-locale.jsx";
import RevealOnScroll from "./reveal-on-scroll.jsx";
import SiteShell from "./site-shell.jsx";
import styles from "./landing-page.module.css";

const ICON_ALIASES = {
  "ni ni-collection": "collection",
  "ni ni-lamp-16": "spark",
  "ni ni-send": "arrow",
  "ni ni-time-alarm": "speed",
  "ni ni-layers-3": "layers",
  "ni ni-shop": "commerce",
  "ni ni-chat-round": "chat",
  "ni ni-camera-compact": "video",
  "ni ni-calendar-grid-58": "calendar",
  "ni ni-chart-bar-32": "chart",
  "ni ni-button-play": "play",
  "ni ni-tv-2": "web",
  "ni ni-mobile-button": "mobile",
  "ni ni-laptop": "desktop",
  "ni ni-spaceship": "rocket",
  "ni ni-shield-check": "shield",
  "ni ni-check-bold": "check",
  "ni ni-bold-right": "arrow",
  "ni ni-curved-next": "arrow"
};

const LANDING_COPY = {
  en: {
    nav: {
      workflow: "Workflow",
      useCases: "Use cases",
      pricing: "Pricing"
    },
    hero: {
      badges: [
        "Built for sellers and affiliates in Indonesia",
        "No camera required and no big content team needed",
        "Web, mobile, and desktop in one connected workflow"
      ],
      title: "Turn a product link into promo video drafts ready to post.",
      description:
        "Paste a product link or a short brief, choose the selling angle, and get hooks, scripts, captions, subtitles, and promo video drafts in minutes from one commerce-native system.",
      primaryCta: "Start Free 7 Days",
      secondaryCta: "See 90s Demo",
      note: "Built for teams that need more promo volume, faster testing, and more consistent posting without rebuilding the workflow every day.",
      stats: [
        { value: "515K+", label: "TikTok Shop stores in Indonesia" },
        { value: "87%", label: "Shoppers already comfortable with video shopping" },
        { value: "4x", label: "GMV growth after the TikTok-Tokopedia merger" }
      ],
      preview: {
        label: "3-step demo flow",
        columns: [
          {
            icon: "ni ni-collection",
            title: "Product brief",
            status: "input",
            items: [
              {
                title: "Product link",
                body: "Brightening serum for dull skin with a short campaign note focused on conversion."
              },
              {
                title: "Objective",
                body: "Prepare four promo angles for short-form channels and keep the team workflow clean."
              }
            ]
          },
          {
            icon: "ni ni-lamp-16",
            title: "Selling angle",
            status: "ready",
            accent: true,
            items: [
              {
                title: "Angle set",
                body: "Problem-solution, testimonial, urgency, and lifestyle angles are prepared together."
              },
              {
                title: "Commerce copy",
                body: "Hooks, scripts, captions, and CTA blocks are grouped for a faster review loop."
              }
            ]
          },
          {
            icon: "ni ni-send",
            title: "Ready to post",
            status: "publish",
            items: [
              {
                title: "Video draft",
                body: "Draft video, subtitle, and caption are ready for channel-specific publish flow."
              },
              {
                title: "Commerce workflow",
                body: "The same context stays connected for publishing, analytics, and live support."
              }
            ]
          }
        ],
        floating: [
          { label: "Demo span", value: "3 steps" },
          { label: "Platform reach", value: "Web · Mobile · Desktop" }
        ]
      }
    },
    proof: {
      eyebrow: "Proof layer",
      title: "What a buyer needs to believe in the first minute.",
      description:
        "Conversion gets stronger when the story is not only attractive, but also easy to verify through workflow, proof, and onboarding clarity.",
      items: [
        {
          title: "From one product to many angles",
          body: "Show how one product becomes multiple hooks, scripts, captions, and promo drafts without repeating manual work."
        },
        {
          title: "Drafts ready in one session",
          body: "The buyer should feel the first value immediately: paste the product, choose the angle, review the draft."
        },
        {
          title: "Trial feels low-risk",
          body: "Free trial for 7 days, no credit card, assisted onboarding, and local payment options lower the first buying barrier."
        },
        {
          title: "A workflow built for Indonesia",
          body: "Seller-first language, local payment familiarity, and commerce-native flow make the product easier to trust."
        }
      ]
    },
    why: {
      eyebrow: "Why it converts",
      title: "The real problem is not editing. It is idea, volume, and posting consistency.",
      description:
        "CreatorFlow is built for commerce operators who need to turn one product into many sellable drafts without rebuilding the process from zero every day.",
      checklist: [
        "Turn one product into more selling angles without restarting from a blank canvas.",
        "Test hooks, captions, and CTA blocks faster without reshooting every time.",
        "Keep posting more consistently without relying on a heavy manual workflow.",
        "Move from brief to draft to publish inside one commerce-ready operating system."
      ]
    },
    pillars: [
      {
        icon: "ni ni-time-alarm",
        title: "More output per product",
        body: "One product can become multiple promo angles, scripts, captions, and video drafts in far less time."
      },
      {
        icon: "ni ni-layers-3",
        title: "More consistent posting",
        body: "The team gets a steadier content rhythm instead of depending on manual bursts and last-minute production."
      },
      {
        icon: "ni ni-shop",
        title: "Commerce-native workflow",
        body: "It starts from the product, the angle, and the selling context instead of a generic empty editor."
      }
    ],
    useCases: {
      eyebrow: "Use cases",
      title: "Different roles, one commerce workflow.",
      description:
        "CreatorFlow stays seller-first, while still supporting affiliates, operators, and small teams that need more content output from the same system.",
      items: [
        {
          title: "Seller",
          body: "Turn one product into more promo angles, draft videos, captions, and CTA blocks that are easier to use for selling."
        },
        {
          title: "Affiliate",
          body: "Handle more active links and produce more content variations with lighter operational effort."
        },
        {
          title: "Agency",
          body: "Run multiple product campaigns and client workflows with a system that is easier to repeat and review."
        },
        {
          title: "Live operator",
          body: "Support live commerce sessions with connected angles, scripts, monitoring, and follow-up content workflow."
        }
      ]
    },
    workflow: {
      eyebrow: "Demo flow",
      title: "Paste the product, choose the angle, get ready-to-post drafts.",
      description:
        "The first value should feel immediate. CreatorFlow is designed so the buyer can understand the workflow in one short session.",
      steps: [
        {
          step: "01",
          title: "Paste product link or brief",
          body: "Start from a real product, not from a blank canvas. Add the link, context, or a short brief and let the workflow begin."
        },
        {
          step: "02",
          title: "Choose the selling angle",
          body: "Pick the angle that matches the campaign: price shock, benefit-led, testimonial, urgency, or lifestyle."
        },
        {
          step: "03",
          title: "Review drafts and publish",
          body: "Get draft video, subtitle, hook, caption, and CTA that are ready to review, adjust, and push into publishing."
        }
      ]
    },
    aiStack: {
      eyebrow: "AI layer",
      title: "AI stays behind the outcome, not in front of it.",
      description:
        "The platform still needs to feel modern and intelligent, but the visible promise stays outcome-first: faster production, more output, and cleaner execution.",
      items: [
        {
          icon: "ni ni-lamp-16",
          title: "AI Hook & Angle Engine",
          body: "Generate multiple selling hooks and core angles from one product brief so the team does not start from zero."
        },
        {
          icon: "ni ni-chat-round",
          title: "AI Script, Caption & CTA",
          body: "Create campaign-ready scripts, captions, CTA blocks, and supporting copy for multiple posting contexts."
        },
        {
          icon: "ni ni-camera-compact",
          title: "AI Product-to-Video & Clipper",
          body: "Turn product input into promo drafts and reuse old assets into short clips that are easier to push into distribution."
        },
        {
          icon: "ni ni-calendar-grid-58",
          title: "AI Publish, Trend & Live Assist",
          body: "Support publish workflow, trend awareness, analytics review, and live commerce follow-up from one connected context."
        }
      ]
    },
    capability: {
      eyebrow: "Platform stack",
      title: "One platform with the main work blocks already connected.",
      description:
        "Assuming the full product stack is ready, CreatorFlow should be presented as a complete commerce workflow, not a half-step tool.",
      items: [
        {
          icon: "ni ni-lamp-16",
          title: "Content Studio",
          badge: "Ready",
          body: "Generate hook, script, caption, CTA, and lightweight storyboard from a product link or short brief."
        },
        {
          icon: "ni ni-camera-compact",
          title: "Short Video Studio",
          badge: "Ready",
          body: "Produce 9:16 promo drafts with subtitle, voice layer, and visual structure ready for review."
        },
        {
          icon: "ni ni-shop",
          title: "Affiliate Studio",
          badge: "Ready",
          body: "Turn one product into many affiliate-ready promo angles with less manual effort."
        },
        {
          icon: "ni ni-collection",
          title: "Clipper Studio",
          badge: "Ready",
          body: "Break longer assets into reusable short clips for more output from the same material."
        },
        {
          icon: "ni ni-send",
          title: "Publish Studio",
          badge: "Ready",
          body: "Queue and manage publish flow more cleanly across the channels that matter to the team."
        },
        {
          icon: "ni ni-chart-bar-32",
          title: "Trend Radar",
          badge: "Ready",
          body: "Spot useful angle and topic signals so the next content request is easier to decide."
        },
        {
          icon: "ni ni-chart-bar-32",
          title: "Analytics Studio",
          badge: "Ready",
          body: "Review what gets published, what performs, and what deserves to be repeated in future drafts."
        },
        {
          icon: "ni ni-button-play",
          title: "Live AI Studio",
          badge: "Ready",
          body: "Support live commerce operators with connected talking points, context, and follow-up workflow."
        }
      ]
    },
    comparison: {
      eyebrow: "Different from generic tools",
      title: "Other tools help edit video. CreatorFlow helps make selling video.",
      description:
        "That difference matters because the buyer does not need another blank canvas. The buyer needs more output from the same product context.",
      genericTitle: "Typical editor",
      genericItems: [
        "Starts from a blank canvas",
        "The user still has to find the idea alone",
        "CTA and selling angle are not built into the workflow",
        "Mostly useful for editing, not for end-to-end commerce production"
      ],
      creatorflowTitle: "CreatorFlow",
      creatorflowItems: [
        "Starts from a product link or short brief",
        "Generates angle, hook, script, caption, and CTA together",
        "Keeps video draft, publish workflow, and commerce context connected",
        "Built for speed, testing, consistency, and seller execution"
      ]
    },
    platforms: {
      eyebrow: "Multi-platform",
      title: "Launch from web, stay connected on mobile, go deeper on desktop.",
      description:
        "The workflow can begin on the surface that fits the moment best while staying connected inside one content commerce platform.",
      items: [
        {
          icon: "ni ni-tv-2",
          title: "Web",
          body: "Best for onboarding, generation, review, dashboards, and the main day-to-day workflow."
        },
        {
          icon: "ni ni-mobile-button",
          title: "Mobile",
          body: "Best for quick approvals, monitoring, and lighter workflow actions while moving."
        },
        {
          icon: "ni ni-laptop",
          title: "Desktop",
          body: "Best for longer production sessions, deeper review, and heavy multi-step operations."
        }
      ]
    },
    pricing: {
      eyebrow: "Pricing",
      title: "Plans built around buyer type and output volume.",
      description:
        "The pricing should feel familiar to how sellers, affiliates, and small teams actually buy software in Indonesia.",
      note:
        "Free trial is available for 7 days without a credit card. Local payment support, add-on usage, and assisted onboarding make the first conversion easier for Indonesian buyers.",
      payments: ["QRIS", "GoPay", "OVO", "DANA", "VA Bank", "Kartu Kredit"],
      tiers: [
        {
          name: "Affiliate",
          price: "Rp249K",
          subtitle: "For affiliate marketers and solo operators who want to monetize more consistently.",
          features: [
            "Up to 10 promo videos per month",
            "Product-to-video basics with hook, script, and caption",
            "Export flow and basic publish assistance"
          ],
          cta: "Start Free"
        },
        {
          name: "Seller",
          price: "Rp799K",
          subtitle: "For active sellers and UMKM teams that need daily promo output.",
          highlight: true,
          badge: "Best seller",
          features: [
            "Up to 30 promo videos per month",
            "Multi-angle workflow from one product with clipper and batch support",
            "Trend recommendation, CTA per platform, and stronger publishing flow"
          ],
          cta: "Choose Seller"
        },
        {
          name: "Agency",
          price: "Rp2.5JT",
          subtitle: "For small agencies and multi-account operators running more complex commerce workflow.",
          features: [
            "Unlimited video generation and multi-account workspace",
            "Approval flow, bulk generation, and analytics layer",
            "Dedicated onboarding for faster team activation"
          ],
          cta: "Talk to the team"
        }
      ]
    },
    assist: {
      eyebrow: "Assisted onboarding",
      title: "Need help getting the first workflow running?",
      description:
        "For teams that want a faster start, assisted onboarding helps turn the first product into the first publish-ready draft without wasting the first session.",
      primaryCta: "Start Assisted Trial",
      secondaryCta: "See Workflow Demo",
      points: [
        "7-day free trial with full access",
        "Local payment options when the team is ready to continue",
        "Faster activation for sellers, affiliates, and small teams"
      ]
    },
    faq: {
      eyebrow: "FAQ",
      title: "Questions that usually come up before a team commits seriously.",
      items: [
        {
          question: "Does CreatorFlow guarantee viral videos or instant sales growth?",
          answer:
            "No. The product is designed to help teams create more promo content faster and more consistently. Results still depend on the product, the angle, the execution, and the distribution."
        },
        {
          question: "Do I have to appear on camera?",
          answer:
            "Not necessarily. CreatorFlow is built for sellers and affiliates who want more promo output without depending on constant manual shooting."
        },
        {
          question: "Can this be used across multiple platforms?",
          answer:
            "Yes. The workflow is built for web, mobile, and desktop, with publish and content operations kept in one connected system."
        },
        {
          question: "How is this different from CapCut or a normal editor?",
          answer:
            "CapCut helps edit video. CreatorFlow helps turn product context into selling angles, draft videos, captions, and a workflow that is closer to posting and testing."
        },
        {
          question: "Can I cancel when the workflow is not a fit?",
          answer:
            "Yes. The commercial model is designed to stay flexible so teams can try, evaluate, and decide clearly without being locked in early."
        }
      ]
    },
    closing: {
      title: "More promo output, more testing room, less manual drag.",
      body:
        "If the team needs a faster way to turn product context into promo content that is actually ready to move, CreatorFlow is built for that job.",
      primaryCta: "Start Free 7 Days",
      secondaryCta: "See Full Demo",
      highlights: [
        { icon: "ni ni-spaceship", label: "More output per product" },
        { icon: "ni ni-chart-bar-32", label: "More consistent posting" },
        { icon: "ni ni-shield-check", label: "More seller-ready workflow" }
      ]
    }
  },
  id: {
    nav: {
      workflow: "Alur Kerja",
      useCases: "Kasus Pakai",
      pricing: "Harga"
    },
    hero: {
      badges: [
        "Dibuat untuk seller dan affiliate Indonesia",
        "Tidak perlu tampil di kamera atau punya tim konten besar",
        "Web, mobile, dan desktop dalam satu alur kerja yang tersambung"
      ],
      title: "Dari link produk jadi draft video promo siap posting.",
      description:
        "Tempel link produk atau brief singkat, pilih angle jualan, lalu dapat hook, script, caption, subtitle, dan draft video promo dalam hitungan menit dari satu sistem yang memang dibuat untuk konten commerce.",
      primaryCta: "Mulai Gratis 7 Hari",
      secondaryCta: "Lihat Demo 90 Detik",
      note:
        "Cocok untuk tim yang butuh volume konten promo lebih besar, pengujian lebih cepat, dan posting lebih konsisten tanpa membangun ulang alur kerja setiap hari.",
      stats: [
        { value: "515K+", label: "Toko aktif di TikTok Shop Indonesia" },
        { value: "87%", label: "Pembeli sudah terbiasa belanja lewat video" },
        { value: "4x", label: "Pertumbuhan GMV setelah merger TikTok-Tokopedia" }
      ],
      preview: {
        label: "Demo alur 3 langkah",
        columns: [
          {
            icon: "ni ni-collection",
            title: "Brief produk",
            status: "masuk",
            items: [
              {
                title: "Link produk",
                body: "Serum brightening untuk kulit kusam dengan catatan kampanye yang fokus ke konversi."
              },
              {
                title: "Tujuan",
                body: "Siapkan empat angle promo untuk channel short-form dan jaga alur kerja tim tetap rapi."
              }
            ]
          },
          {
            icon: "ni ni-lamp-16",
            title: "Angle jualan",
            status: "siap",
            accent: true,
            items: [
              {
                title: "Set angle",
                body: "Angle problem-solution, testimonial, urgency, dan lifestyle disiapkan sekaligus."
              },
              {
                title: "Copy commerce",
                body: "Hook, script, caption, dan blok CTA dikumpulkan dalam satu siklus tinjau yang lebih cepat."
              }
            ]
          },
          {
            icon: "ni ni-send",
            title: "Siap tayang",
            status: "tayang",
            items: [
              {
                title: "Draft video",
                body: "Draft video, subtitle, dan caption siap masuk ke alur tayang per channel."
              },
              {
                title: "Alur commerce",
                body: "Konteks yang sama tetap tersambung untuk penayangan, analitik, dan dukungan live."
              }
            ]
          }
        ],
        floating: [
          { label: "Cakupan demo", value: "3 langkah" },
          { label: "Jangkauan platform", value: "Web · Mobile · Desktop" }
        ]
      }
    },
    proof: {
      eyebrow: "Bukti awal",
      title: "Hal yang perlu dipercaya pembeli dalam menit pertama.",
      description:
        "Konversi jadi lebih kuat kalau ceritanya bukan cuma menarik, tapi juga gampang diverifikasi lewat alur kerja, bukti, dan proses awal yang jelas.",
      items: [
        {
          title: "Satu produk jadi banyak angle",
          body: "Tunjukkan bagaimana satu produk dipecah menjadi banyak hook, script, caption, dan draft promo tanpa mengulang kerja manual."
        },
        {
          title: "Draft terasa cepat di sesi pertama",
          body: "Pembeli harus langsung merasakan nilainya: tempel produk, pilih angle, lalu tinjau draft dalam satu alur singkat."
        },
        {
          title: "Trial terasa rendah risiko",
          body: "Uji coba gratis 7 hari, tanpa kartu kredit, pendampingan awal, dan metode pembayaran lokal menurunkan hambatan beli pertama."
        },
        {
          title: "Alur dibuat untuk Indonesia",
          body: "Bahasa yang dekat dengan seller, metode pembayaran lokal yang familiar, dan alur yang native untuk commerce bikin produk lebih mudah dipercaya."
        }
      ]
    },
    why: {
      eyebrow: "Kenapa lebih menjual",
      title: "Masalah utamanya bukan editing. Masalah utamanya ide, volume, dan konsistensi posting.",
      description:
        "CreatorFlow dibangun untuk operator commerce yang perlu mengubah satu produk menjadi banyak draft jualan tanpa memulai ulang proses dari nol setiap hari.",
      checklist: [
        "Ubah satu produk menjadi lebih banyak angle jualan tanpa mulai dari kanvas kosong.",
        "Pengujian hook, caption, dan CTA bisa jalan lebih cepat tanpa syuting ulang terus-menerus.",
        "Posting lebih konsisten tanpa bergantung pada alur kerja manual yang berat.",
        "Bergerak dari brief ke draft ke tayang di dalam satu sistem kerja yang siap untuk commerce."
      ]
    },
    pillars: [
      {
        icon: "ni ni-time-alarm",
        title: "Output lebih besar per produk",
        body: "Satu produk bisa dipecah menjadi lebih banyak angle promo, script, caption, dan draft video dalam waktu yang jauh lebih singkat."
      },
      {
        icon: "ni ni-layers-3",
        title: "Posting lebih konsisten",
        body: "Tim punya ritme konten yang lebih stabil, bukan sekadar burst produksi di menit-menit terakhir."
      },
      {
        icon: "ni ni-shop",
        title: "Alur native untuk commerce",
        body: "Dimulai dari produk, angle jualan, dan konteks kampanye. Bukan dari editor generik yang kosong."
      }
    ],
    useCases: {
      eyebrow: "Kasus pakai",
      title: "Perannya bisa beda, tapi alur commerce-nya tetap satu.",
      description:
        "CreatorFlow tetap berangkat dari kebutuhan seller, sambil tetap relevan untuk affiliate, operator, dan tim kecil yang butuh output konten lebih besar dari sistem yang sama.",
      items: [
        {
          title: "Seller",
          body: "Ubah satu produk menjadi lebih banyak angle promo, draft video, caption, dan CTA yang lebih siap dipakai untuk jualan."
        },
        {
          title: "Affiliate",
          body: "Kelola lebih banyak link aktif dan hasilkan lebih banyak variasi konten dengan effort operasional yang lebih ringan."
        },
        {
          title: "Agency",
          body: "Jalankan banyak kampanye produk dan alur klien dengan sistem yang lebih mudah diulang dan ditinjau."
        },
        {
          title: "Operator live",
          body: "Dukung sesi live commerce dengan angle, script, monitoring, dan alur konten lanjutan yang tetap nyambung."
        }
      ]
    },
    workflow: {
      eyebrow: "Demo alur",
      title: "Tempel produk, pilih angle, dapat draft yang siap diposting.",
      description:
        "Nilai pertama harus terasa cepat. CreatorFlow dirancang supaya pembeli langsung paham alurnya dalam satu sesi singkat.",
      steps: [
        {
          step: "01",
          title: "Tempel link produk atau brief",
          body: "Mulai dari produk yang nyata, bukan dari kanvas kosong. Masukkan link, konteks, atau brief singkat lalu biarkan alur kerja berjalan."
        },
        {
          step: "02",
          title: "Pilih angle jualan",
          body: "Pilih angle yang paling cocok untuk kampanye: price shock, benefit-led, testimonial, urgency, atau lifestyle."
        },
        {
          step: "03",
          title: "Tinjau draft dan tayangkan",
          body: "Dapatkan draft video, subtitle, hook, caption, dan CTA yang siap ditinjau, disesuaikan, lalu didorong ke publikasi."
        }
      ]
    },
    aiStack: {
      eyebrow: "Lapisan AI",
      title: "AI tetap ada di balik hasil, bukan di depan pesan jualan.",
      description:
        "Platform tetap harus terasa modern dan cerdas, tapi janji yang terlihat tetap fokus ke hasil: produksi lebih cepat, output lebih banyak, dan eksekusi lebih rapi.",
      items: [
        {
          icon: "ni ni-lamp-16",
          title: "AI Hook & Angle Engine",
          body: "Menghasilkan banyak hook dan angle jualan dari satu brief produk supaya tim tidak selalu mulai dari nol."
        },
        {
          icon: "ni ni-chat-round",
          title: "AI Script, Caption & CTA",
          body: "Menyusun skrip, caption, blok CTA, dan copy pendukung yang lebih siap untuk kebutuhan kampanye."
        },
        {
          icon: "ni ni-camera-compact",
          title: "AI Product-to-Video & Clipper",
          body: "Mengubah input produk menjadi draft promo sekaligus mengolah aset lama menjadi klip yang lebih mudah didistribusikan."
        },
        {
          icon: "ni ni-calendar-grid-58",
          title: "AI Publish, Trend & Live Assist",
          body: "Mendukung alur publikasi, pembacaan tren, telaah analitik, dan kebutuhan live commerce dari konteks yang sama."
        }
      ]
    },
    capability: {
      eyebrow: "Lapisan platform",
      title: "Satu platform dengan blok kerja utama yang sudah saling tersambung.",
      description:
        "Dengan asumsi seluruh produk sudah siap, CreatorFlow perlu tampil sebagai alur commerce yang lengkap, bukan tool setengah jadi.",
      items: [
        {
          icon: "ni ni-lamp-16",
          title: "Content Studio",
          badge: "Siap",
          body: "Hasilkan hook, skrip, caption, CTA, dan storyboard ringan dari link produk atau brief singkat."
        },
        {
          icon: "ni ni-camera-compact",
          title: "Short Video Studio",
          badge: "Siap",
          body: "Bikin draft video 9:16 dengan subtitle, lapisan suara, dan struktur visual yang siap ditinjau."
        },
        {
          icon: "ni ni-shop",
          title: "Affiliate Studio",
          badge: "Siap",
          body: "Ubah satu produk menjadi banyak angle promo yang lebih siap dipakai untuk alur affiliate."
        },
        {
          icon: "ni ni-collection",
          title: "Clipper Studio",
          badge: "Siap",
          body: "Pecah aset panjang menjadi klip-klip pendek yang bisa dipakai ulang untuk output yang lebih besar."
        },
        {
          icon: "ni ni-send",
          title: "Publish Studio",
          badge: "Siap",
          body: "Atur alur publikasi dengan lebih rapi untuk channel yang dipakai tim sehari-hari."
        },
        {
          icon: "ni ni-chart-bar-32",
          title: "Trend Radar",
          badge: "Siap",
          body: "Lihat sinyal topik dan angle yang relevan supaya request konten berikutnya lebih mudah ditentukan."
        },
        {
          icon: "ni ni-chart-bar-32",
          title: "Analytics Studio",
          badge: "Siap",
          body: "Tinjau apa yang sudah tayang, apa yang perform, dan apa yang layak diulang di kampanye berikutnya."
        },
        {
          icon: "ni ni-button-play",
          title: "Live AI Studio",
          badge: "Siap",
          body: "Dukung operator live dengan talking point, konteks, dan alur tindak lanjut yang tetap nyambung."
        }
      ]
    },
    comparison: {
      eyebrow: "Beda dari tool generik",
      title: "Tool lain bantu edit video. CreatorFlow bantu bikin video jualan.",
      description:
        "Perbedaannya penting, karena pembeli tidak butuh kanvas kosong lagi. Pembeli butuh output yang lebih banyak dari konteks produk yang sama.",
      genericTitle: "Editor biasa",
      genericItems: [
        "Mulai dari kanvas kosong",
        "Pengguna masih harus mencari ide sendirian",
        "CTA dan angle jualan tidak menyatu di alur kerja",
        "Lebih cocok untuk editing, bukan produksi konten commerce end-to-end"
      ],
      creatorflowTitle: "CreatorFlow",
      creatorflowItems: [
        "Mulai dari link produk atau brief singkat",
        "Hasilkan angle, hook, script, caption, dan CTA sekaligus",
        "Konteks draft video, alur publikasi, dan kebutuhan commerce tetap tersambung",
        "Dibangun untuk kecepatan, pengujian, konsistensi, dan eksekusi seller"
      ]
    },
    platforms: {
      eyebrow: "Multi-perangkat",
      title: "Mulai dari web, tetap nyambung di mobile, dan lebih dalam di desktop.",
      description:
        "Alur kerja bisa dimulai dari perangkat yang paling cocok untuk momennya, sambil tetap tinggal di satu content commerce platform.",
      items: [
        {
          icon: "ni ni-tv-2",
          title: "Web",
          body: "Paling pas untuk onboarding, pembuatan, peninjauan, dashboard, dan alur harian utama."
        },
        {
          icon: "ni ni-mobile-button",
          title: "Mobile",
          body: "Paling pas untuk persetujuan cepat, monitoring, dan alur ringan saat sedang bergerak."
        },
        {
          icon: "ni ni-laptop",
          title: "Desktop",
          body: "Paling pas untuk sesi produksi yang lebih panjang, tinjauan yang lebih dalam, dan operasi yang lebih berat."
        }
      ]
    },
    pricing: {
      eyebrow: "Harga",
      title: "Paket dibuat mengikuti tipe pengguna dan volume output.",
      description:
        "Struktur harga harus terasa familiar dengan cara seller, affiliate, dan tim kecil membeli software di Indonesia.",
      note:
        "Uji coba gratis tersedia 7 hari tanpa kartu kredit. Pembayaran lokal, pemakaian add-on, dan pendampingan awal membantu konversi pertama terasa lebih ringan untuk pembeli Indonesia.",
      payments: ["QRIS", "GoPay", "OVO", "DANA", "VA Bank", "Kartu Kredit"],
      tiers: [
        {
          name: "Affiliate",
          price: "Rp249K",
          subtitle: "Untuk affiliate marketer dan operator solo yang ingin monetisasi lebih konsisten.",
          features: [
            "Maksimal 10 video promo per bulan",
            "Dasar produk-ke-video dengan hook, skrip, dan caption",
            "Alur ekspor dan bantuan publikasi dasar"
          ],
          cta: "Mulai Gratis"
        },
        {
          name: "Seller",
          price: "Rp799K",
          subtitle: "Untuk seller aktif dan tim UMKM yang butuh output promo harian.",
          highlight: true,
          badge: "Paling laris",
          features: [
            "Maksimal 30 video promo per bulan",
            "Alur multi-angle dari satu produk dengan clipper dan batch support",
            "Rekomendasi tren, CTA per platform, dan alur publikasi yang lebih kuat"
          ],
          cta: "Pilih Seller"
        },
        {
          name: "Agency",
          price: "Rp2.5JT",
          subtitle: "Untuk agency kecil dan operator multi-account dengan alur commerce yang lebih kompleks.",
          features: [
            "Pembuatan video tanpa batas dan workspace multi-account",
            "Alur persetujuan, pembuatan massal, dan lapisan analitik",
            "Pendampingan khusus untuk aktivasi tim yang lebih cepat"
          ],
          cta: "Hubungi Tim"
        }
      ]
    },
    assist: {
      eyebrow: "Pendampingan awal",
      title: "Perlu bantuan untuk menjalankan alur pertama?",
      description:
        "Untuk tim yang ingin mulai lebih cepat, pendampingan awal membantu mengubah produk pertama menjadi draft pertama yang siap jalan tanpa membuang sesi awal.",
      primaryCta: "Mulai Uji Coba Didampingi",
      secondaryCta: "Lihat Demo Alur Kerja",
      points: [
        "Uji coba gratis 7 hari dengan akses penuh",
        "Pembayaran lokal tersedia saat tim siap lanjut",
        "Aktivasi lebih cepat untuk seller, affiliate, dan tim kecil"
      ]
    },
    faq: {
      eyebrow: "FAQ",
      title: "Pertanyaan yang biasanya muncul sebelum tim benar-benar berkomitmen.",
      items: [
        {
          question: "Apakah CreatorFlow menjamin video viral atau penjualan langsung naik?",
          answer:
            "Tidak. Produk ini dirancang untuk membantu tim bikin konten promo lebih cepat dan lebih konsisten. Hasil tetap bergantung pada produk, angle, eksekusi, dan distribusi."
        },
        {
          question: "Apakah saya harus tampil di kamera?",
          answer:
            "Tidak harus. CreatorFlow dibuat untuk seller dan affiliate yang ingin output promo lebih besar tanpa bergantung pada syuting manual terus-menerus."
        },
        {
          question: "Apakah bisa dipakai lintas platform?",
          answer:
            "Ya. Alur kerjanya dibangun untuk web, mobile, dan desktop, dengan operasi konten dan publikasi yang tetap tersambung."
        },
        {
          question: "Apa bedanya dengan CapCut atau editor biasa?",
          answer:
            "CapCut membantu edit video. CreatorFlow membantu mengubah konteks produk menjadi angle jualan, draft video, caption, dan alur kerja yang lebih dekat ke posting dan pengujian."
        },
        {
          question: "Kalau alur kerjanya tidak cocok, apakah bisa batal?",
          answer:
            "Bisa. Model komersialnya dibuat fleksibel supaya tim bisa mencoba, mengevaluasi, lalu memutuskan dengan lebih jelas tanpa terkunci terlalu cepat."
        }
      ]
    },
    closing: {
      title: "Output promo lebih besar, ruang pengujian lebih luas, kerja manual lebih ringan.",
      body:
        "Kalau tim butuh cara yang lebih cepat untuk mengubah konteks produk menjadi konten promo yang benar-benar siap jalan, CreatorFlow dibuat untuk pekerjaan itu.",
      primaryCta: "Mulai Gratis 7 Hari",
      secondaryCta: "Lihat Demo Lengkap",
      highlights: [
        { icon: "ni ni-spaceship", label: "Output lebih besar per produk" },
        { icon: "ni ni-chart-bar-32", label: "Posting lebih konsisten" },
        { icon: "ni ni-shield-check", label: "Alur lebih siap untuk seller" }
      ]
    }
  }
};

function LandingIcon({ name, className = "" }) {
  const iconName = ICON_ALIASES[name] ?? name;

  const iconMap = {
    arrow: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4.5 10h11m0 0-4-4m4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    calendar: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3.5" y="4.5" width="13" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M6.5 2.8v3.4M13.5 2.8v3.4M3.5 8h13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
    chat: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5 5.5h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-3.5 2v-2H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    ),
    chart: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 15.5h12M6.5 13V9.5M10 13V6.5M13.5 13v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    check: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="m5.5 10 3 3 6-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    collection: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M7 4V2.8M10 4V2.8M13 4V2.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
    commerce: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5 7.5h10l-.8 6.2a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8L5 7.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M7.5 7.5V6.3a2.5 2.5 0 1 1 5 0v1.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
    desktop: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3.5" y="4.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M7.5 16.2h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
    layers: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="m10 4 6 3.5L10 11 4 7.5 10 4Zm0 4 6 3.5L10 15 4 11.5 10 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
    mobile: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="6" y="2.8" width="8" height="14.4" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="10" cy="14.8" r=".8" fill="currentColor" />
      </svg>
    ),
    play: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="m8.6 7.6 4 2.4-4 2.4V7.6Z" fill="currentColor" />
      </svg>
    ),
    rocket: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M11.8 4.2c2.6.5 4 2.7 4 5.3v.5l-4.1 4H7.5l-2.1-2.1V7.7l4-3.5h2.4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="m7.4 12.6-1.6 2.7M12.6 7.4a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    shield: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 3.4 15 5v4.2c0 3-2 5.7-5 6.8-3-1.1-5-3.8-5-6.8V5l5-1.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="m7.7 9.9 1.5 1.5 3.1-3.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    spark: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="m10 3 1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6L10 3ZM4.2 3.8l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6Zm11 8 .5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5.5-1.2Z" fill="currentColor" />
      </svg>
    ),
    speed: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5 13a5 5 0 1 1 10 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="m10 10 2.6-2.1M10 13.2h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
    video: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3.5" y="5" width="9.5" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <path d="m13 8 3.5-2v8L13 12V8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    ),
    web: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="2.8" y="4" width="14.4" height="11.2" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M2.8 7.2h14.4M7.2 4v11.2M12.8 4v11.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    )
  };

  return (
    <span className={`${styles.iconGlyph}${className ? ` ${className}` : ""}`} aria-hidden="true">
      {iconMap[iconName] ?? iconMap.spark}
    </span>
  );
}

function SectionHeader({ eyebrow, title, description, centered = false }) {
  return (
    <div className={`${styles.sectionHeader}${centered ? ` ${styles.sectionHeaderCentered}` : ""}`}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <p className={styles.sectionDescription}>{description}</p>
    </div>
  );
}

function HeroPreview({ preview }) {
  return (
    <div className={styles.previewWrap}>
      <div className={styles.floatingCard}>
        <span className={styles.floatingLabel}>{preview.floating[0].label}</span>
        <span className={styles.floatingValue}>{preview.floating[0].value}</span>
      </div>

      <div className={styles.previewFrame}>
        <div className={styles.previewTopbar}>
          <div className={styles.previewDots}>
            <span />
            <span />
            <span />
          </div>
          <span className={styles.previewLabel}>{preview.label}</span>
        </div>

        <div className={styles.previewGrid}>
          {preview.columns.map((column) => (
            <div
              key={column.title}
              className={`${styles.previewPanel}${column.accent ? ` ${styles.previewPanelAccent}` : ""}`}
            >
              <div className={styles.previewPanelTitle}>
                <span className={styles.previewPanelHeading}>
                  <LandingIcon name={column.icon} className={styles.previewPanelIcon} />
                  {column.title}
                </span>
                <span>{column.status}</span>
              </div>
              <div className={styles.previewList}>
                {column.items.map((item) => (
                  <div key={item.title} className={styles.previewItem}>
                    <strong>{item.title}</strong>
                    {item.body}
                    <span className={styles.previewStatus}>{column.status}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.floatingCardAlt}>
        <span className={styles.floatingLabel}>{preview.floating[1].label}</span>
        <span className={styles.floatingValue}>{preview.floating[1].value}</span>
      </div>
    </div>
  );
}

function FaqCard({ item }) {
  return (
    <div className={styles.faqItem}>
      <details className={styles.faqDetails}>
        <summary className={styles.faqSummary}>
          <span>{item.question}</span>
          <span>+</span>
        </summary>
        <div className={styles.faqBody}>{item.answer}</div>
      </details>
    </div>
  );
}

export default function LandingPage() {
  const { locale } = useWebLocale();
  const copy = LANDING_COPY[locale] ?? LANDING_COPY.en;

  return (
    <SiteShell
      headerProps={{
        primaryCtaHref: "/sign-up",
        primaryCtaLabel: copy.hero.primaryCta,
        secondaryCtaHref: "/#workflow",
        secondaryCtaLabel: copy.hero.secondaryCta,
        navItems: [
          { href: "/", label: locale === "id" ? "Beranda" : "Home" },
          { href: "/#workflow", label: copy.nav.workflow },
          { href: "/#use-cases", label: copy.nav.useCases },
          { href: "/#pricing", label: copy.nav.pricing }
        ]
      }}
    >
      <div className={styles.page}>
        <section className={styles.heroSection}>
          <div className={styles.heroInner}>
            <div className={styles.heroGrid}>
              <RevealOnScroll
                hiddenClassName={styles.reveal}
                visibleClassName={styles.revealed}
                className={styles.heroCopy}
              >
                <div className={styles.badgeRow}>
                  {copy.hero.badges.map((badge) => (
                    <span key={badge} className={styles.heroBadge}>
                      <LandingIcon name="check" className={styles.heroBadgeIcon} />
                      {badge}
                    </span>
                  ))}
                </div>

                <h1 className={styles.heroTitle}>{copy.hero.title}</h1>
                <p className={styles.heroDescription}>{copy.hero.description}</p>

                <div className={styles.heroActions}>
                  <Link href="/sign-up" className={styles.heroPrimary}>
                    {copy.hero.primaryCta}
                    <LandingIcon name="arrow" className={styles.actionIcon} />
                  </Link>
                  <Link href="/#workflow" className={styles.heroSecondary}>
                    {copy.hero.secondaryCta}
                    <LandingIcon name="arrow" className={styles.actionIcon} />
                  </Link>
                </div>

                <p className={styles.heroNote}>{copy.hero.note}</p>

                <div className={styles.heroStats}>
                  {copy.hero.stats.map((stat) => (
                    <div key={stat.value} className={styles.heroStatCard}>
                      <span className={styles.heroStatValue}>{stat.value}</span>
                      <span className={styles.heroStatLabel}>{stat.label}</span>
                    </div>
                  ))}
                </div>
              </RevealOnScroll>

              <RevealOnScroll
                hiddenClassName={styles.reveal}
                visibleClassName={styles.revealed}
                delay={120}
              >
                <HeroPreview preview={copy.hero.preview} />
              </RevealOnScroll>
            </div>
          </div>
        </section>

        <section className={styles.sectionCompact}>
          <div className={styles.sectionContent}>
            <div className={styles.supportGrid}>
              <RevealOnScroll hiddenClassName={styles.reveal} visibleClassName={styles.revealed}>
                <div className={styles.supportCard}>
                  <SectionHeader
                    eyebrow={copy.why.eyebrow}
                    title={copy.why.title}
                    description={copy.why.description}
                  />
                  <div className={styles.checklist}>
                    {copy.why.checklist.map((item) => (
                      <div key={item} className={styles.checklistItem}>
                        <LandingIcon name="check" className={styles.listIcon} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </RevealOnScroll>

              <div className={styles.pillarGrid}>
                {copy.pillars.map((item, index) => (
                  <RevealOnScroll
                    key={item.title}
                    hiddenClassName={styles.reveal}
                    visibleClassName={styles.revealed}
                    delay={index * 90}
                  >
                    <div className={styles.pillarCard}>
                      <div className={styles.pillarIcon}>
                        <LandingIcon name={item.icon} className={styles.featureIconGlyph} />
                      </div>
                      <h3 className={styles.pillarTitle}>{item.title}</h3>
                      <p className={styles.pillarText}>{item.body}</p>
                    </div>
                  </RevealOnScroll>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <RevealOnScroll hiddenClassName={styles.reveal} visibleClassName={styles.revealed}>
              <SectionHeader
                eyebrow={copy.proof.eyebrow}
                title={copy.proof.title}
                description={copy.proof.description}
                centered
              />
            </RevealOnScroll>

            <div className={styles.proofGrid}>
              {copy.proof.items.map((item, index) => (
                <RevealOnScroll
                  key={item.title}
                  hiddenClassName={styles.reveal}
                  visibleClassName={styles.revealed}
                  delay={index * 70}
                >
                  <div className={styles.proofCard}>
                    <div className={styles.proofStep}>{`0${index + 1}`}</div>
                    <h3 className={styles.proofTitle}>{item.title}</h3>
                    <p className={styles.proofText}>{item.body}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section id="use-cases" className={styles.sectionMuted}>
          <div className={styles.sectionContent}>
            <RevealOnScroll hiddenClassName={styles.reveal} visibleClassName={styles.revealed}>
              <SectionHeader
                eyebrow={copy.useCases.eyebrow}
                title={copy.useCases.title}
                description={copy.useCases.description}
                centered
              />
            </RevealOnScroll>

            <div className={styles.useCaseGrid}>
              {copy.useCases.items.map((item, index) => (
                <RevealOnScroll
                  key={item.title}
                  hiddenClassName={styles.reveal}
                  visibleClassName={styles.revealed}
                  delay={index * 80}
                >
                  <div className={styles.useCaseCard}>
                    <span className={styles.useCaseBadge}>{item.title}</span>
                    <p className={styles.useCaseText}>{item.body}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className={styles.section}>
          <div className={styles.sectionContent}>
            <RevealOnScroll hiddenClassName={styles.reveal} visibleClassName={styles.revealed}>
              <SectionHeader
                eyebrow={copy.workflow.eyebrow}
                title={copy.workflow.title}
                description={copy.workflow.description}
              />
            </RevealOnScroll>

            <div className={styles.workflowGrid}>
              {copy.workflow.steps.map((item, index) => (
                <RevealOnScroll
                  key={item.title}
                  hiddenClassName={styles.reveal}
                  visibleClassName={styles.revealed}
                  delay={index * 100}
                >
                  <div className={styles.workflowCard}>
                    <span className={styles.stepNumber}>{item.step}</span>
                    <h3 className={styles.workflowTitle}>{item.title}</h3>
                    <p className={styles.workflowText}>{item.body}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className={styles.sectionMuted}>
          <div className={styles.sectionContent}>
            <RevealOnScroll hiddenClassName={styles.reveal} visibleClassName={styles.revealed}>
              <SectionHeader
                eyebrow={copy.aiStack.eyebrow}
                title={copy.aiStack.title}
                description={copy.aiStack.description}
                centered
              />
            </RevealOnScroll>

            <div className={styles.featureGrid}>
              {copy.aiStack.items.map((item, index) => (
                <RevealOnScroll
                  key={item.title}
                  hiddenClassName={styles.reveal}
                  visibleClassName={styles.revealed}
                  delay={index * 80}
                >
                  <div className={styles.featureCard}>
                    <div className={styles.featureIcon}>
                      <LandingIcon name={item.icon} className={styles.featureIconGlyph} />
                    </div>
                    <h3 className={styles.featureTitle}>{item.title}</h3>
                    <p className={styles.featureText}>{item.body}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <RevealOnScroll hiddenClassName={styles.reveal} visibleClassName={styles.revealed}>
              <SectionHeader
                eyebrow={copy.capability.eyebrow}
                title={copy.capability.title}
                description={copy.capability.description}
              />
            </RevealOnScroll>

            <div className={styles.capabilityGrid}>
              {copy.capability.items.map((item, index) => (
                <RevealOnScroll
                  key={item.title}
                  hiddenClassName={styles.reveal}
                  visibleClassName={styles.revealed}
                  delay={index * 70}
                >
                  <div className={styles.stackCard}>
                    <div className={styles.featureIcon}>
                      <LandingIcon name={item.icon} className={styles.featureIconGlyph} />
                    </div>
                    <div className={styles.stackHeader}>
                      <h3 className={styles.featureTitle}>{item.title}</h3>
                      <span className={styles.stackBadge}>{item.badge}</span>
                    </div>
                    <p className={styles.featureText}>{item.body}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.sectionMuted}>
          <div className={styles.sectionContent}>
            <div className={styles.comparisonGrid}>
              <RevealOnScroll hiddenClassName={styles.reveal} visibleClassName={styles.revealed}>
                <SectionHeader
                  eyebrow={copy.comparison.eyebrow}
                  title={copy.comparison.title}
                  description={copy.comparison.description}
                />
              </RevealOnScroll>

              <div className={styles.compareCards}>
                <RevealOnScroll hiddenClassName={styles.reveal} visibleClassName={styles.revealed} delay={80}>
                  <div className={styles.compareCard}>
                    <div className={styles.compareLabel}>{copy.comparison.genericTitle}</div>
                    <div className={styles.compareList}>
                      {copy.comparison.genericItems.map((item) => (
                        <div key={item} className={styles.compareItem}>
                          <span className={styles.compareItemBullet}>•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll hiddenClassName={styles.reveal} visibleClassName={styles.revealed} delay={160}>
                  <div className={`${styles.compareCard} ${styles.compareCardActive}`}>
                    <div className={styles.compareLabel}>{copy.comparison.creatorflowTitle}</div>
                    <div className={styles.compareList}>
                      {copy.comparison.creatorflowItems.map((item) => (
                        <div key={item} className={styles.compareItem}>
                          <span className={styles.compareItemBullet}>•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <RevealOnScroll hiddenClassName={styles.reveal} visibleClassName={styles.revealed}>
              <SectionHeader
                eyebrow={copy.platforms.eyebrow}
                title={copy.platforms.title}
                description={copy.platforms.description}
              />
            </RevealOnScroll>

            <div className={styles.platformGrid}>
              {copy.platforms.items.map((item, index) => (
                <RevealOnScroll
                  key={item.title}
                  hiddenClassName={styles.reveal}
                  visibleClassName={styles.revealed}
                  delay={index * 90}
                >
                  <div className={styles.platformCard}>
                    <div className={styles.featureIcon}>
                      <LandingIcon name={item.icon} className={styles.featureIconGlyph} />
                    </div>
                    <h3 className={styles.featureTitle}>{item.title}</h3>
                    <p className={styles.featureText}>{item.body}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className={styles.sectionMuted}>
          <div className={styles.sectionContent}>
            <RevealOnScroll hiddenClassName={styles.reveal} visibleClassName={styles.revealed}>
              <SectionHeader
                eyebrow={copy.pricing.eyebrow}
                title={copy.pricing.title}
                description={copy.pricing.description}
              />
            </RevealOnScroll>

            <div className={styles.pricingGrid}>
              {copy.pricing.tiers.map((tier, index) => (
                <RevealOnScroll
                  key={tier.name}
                  hiddenClassName={styles.reveal}
                  visibleClassName={styles.revealed}
                  delay={index * 100}
                >
                  <div className={`${styles.pricingCard}${tier.highlight ? ` ${styles.pricingHighlight}` : ""}`}>
                    {tier.badge ? <span className={styles.pricingBadge}>{tier.badge}</span> : null}
                    <h3 className={styles.pricingName}>{tier.name}</h3>
                    <div className={styles.pricingPrice}>{tier.price}</div>
                    <p className={styles.pricingSubtitle}>{tier.subtitle}</p>

                    <div className={styles.pricingList}>
                      {tier.features.map((feature) => (
                        <div key={feature} className={styles.pricingItem}>
                          <LandingIcon name="check" className={styles.pricingItemIcon} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      href="/sign-up"
                      className={`${styles.pricingButton} ${tier.highlight ? styles.pricingButtonLight : styles.pricingButtonDark}`}
                    >
                      {tier.cta}
                      <LandingIcon name="arrow" className={styles.actionIcon} />
                    </Link>
                  </div>
                </RevealOnScroll>
              ))}
            </div>

            <div className={styles.pricingNote}>{copy.pricing.note}</div>
            <div className={styles.paymentRow}>
              {copy.pricing.payments.map((item) => (
                <span key={item} className={styles.paymentBadge}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <RevealOnScroll hiddenClassName={styles.reveal} visibleClassName={styles.revealed}>
              <div className={styles.assistCard}>
                <div className={styles.assistGrid}>
                  <div>
                    <span className={styles.eyebrow}>{copy.assist.eyebrow}</span>
                    <h2 className={styles.assistTitle}>{copy.assist.title}</h2>
                    <p className={styles.assistText}>{copy.assist.description}</p>
                    <div className={styles.assistPoints}>
                      {copy.assist.points.map((item) => (
                        <div key={item} className={styles.assistPoint}>
                          <LandingIcon name="check" className={styles.listIcon} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.assistActions}>
                    <Link href="/sign-up" className={styles.heroPrimary}>
                      {copy.assist.primaryCta}
                      <LandingIcon name="arrow" className={styles.actionIcon} />
                    </Link>
                    <Link href="/#workflow" className={styles.heroSecondary}>
                      {copy.assist.secondaryCta}
                      <LandingIcon name="arrow" className={styles.actionIcon} />
                    </Link>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        <section className={styles.sectionCompact}>
          <div className={styles.sectionContent}>
            <RevealOnScroll hiddenClassName={styles.reveal} visibleClassName={styles.revealed}>
              <SectionHeader
                eyebrow={copy.faq.eyebrow}
                title={copy.faq.title}
                description=""
                centered
              />
            </RevealOnScroll>

            <div className={styles.faqGrid}>
              {copy.faq.items.map((item, index) => (
                <RevealOnScroll
                  key={item.question}
                  hiddenClassName={styles.reveal}
                  visibleClassName={styles.revealed}
                  delay={index * 70}
                >
                  <FaqCard item={item} />
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.closingSection}>
          <div className={styles.closingInner}>
            <RevealOnScroll hiddenClassName={styles.reveal} visibleClassName={styles.revealed}>
              <div className={styles.closingCard}>
                <div className={styles.closingGrid}>
                  <div>
                    <h2 className={styles.closingTitle}>{copy.closing.title}</h2>
                    <p className={styles.closingText}>{copy.closing.body}</p>
                    <div className={styles.closingMetrics}>
                      {copy.closing.highlights.map((item) => (
                        <div key={item.label} className={styles.closingMetric}>
                          <LandingIcon name={item.icon} className={styles.closingMetricIcon} />
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.closingActions}>
                    <Link href="/sign-up" className={styles.heroPrimary}>
                      {copy.closing.primaryCta}
                    </Link>
                    <Link href="/#workflow" className={styles.heroSecondary}>
                      {copy.closing.secondaryCta}
                    </Link>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        <Link href="/sign-up" className={styles.floatingAssistCta}>
          <LandingIcon name="chat" className={styles.floatingAssistIcon} />
          <span>{locale === "id" ? "Butuh bantuan? Mulai uji coba didampingi" : "Need help? Start assisted trial"}</span>
        </Link>
      </div>
    </SiteShell>
  );
}
