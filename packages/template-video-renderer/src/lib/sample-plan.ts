export const sampleBeautyPromoPlan = {
  aspectRatio: "9:16",
  durationSeconds: 11,
  product: {
    ctaText: "Cek promo sebelum stok habis",
    imageUrl: "",
    offerText: "Diskon payday 35%",
    priceText: "Mulai Rp129.000",
    subtitle: "Serum brightening untuk daily routine",
    title: "Serum brightening untuk bekas jerawat"
  },
  scenes: [
    {
      durationFrames: 75,
      id: "scene-hook",
      kind: "hook",
      layout: "hero",
      textBlocks: [
        {
          animation: "slide-up",
          role: "headline",
          text: "Bekas jerawat masih susah pudar?"
        },
        {
          animation: "fade",
          role: "supporting",
          text: "Serum brightening untuk daily routine"
        }
      ]
    },
    {
      durationFrames: 90,
      id: "scene-benefit",
      kind: "benefit",
      layout: "split",
      textBlocks: [
        {
          animation: "fade",
          role: "headline",
          text: "Tekstur ringan, bantu bikin wajah terasa lebih clean dan rata"
        },
        {
          animation: "fade",
          role: "caption",
          text: "Cocok untuk konten promo problem-solution yang cepat"
        }
      ]
    },
    {
      durationFrames: 75,
      id: "scene-offer",
      kind: "offer",
      layout: "product-focus",
      textBlocks: [
        {
          animation: "pop",
          role: "offer",
          text: "Diskon payday 35%"
        },
        {
          animation: "fade",
          role: "price",
          text: "Mulai Rp129.000"
        }
      ]
    },
    {
      durationFrames: 90,
      id: "scene-cta",
      kind: "cta",
      layout: "caption-led",
      textBlocks: [
        {
          animation: "type",
          role: "cta",
          text: "Cek promo sebelum stok habis"
        },
        {
          animation: "fade",
          role: "caption",
          text: "Template ini nanti akan menerima payload dari scene planner"
        }
      ]
    }
  ],
  templateKey: "beauty/promo_offer",
  version: 1
};

export const sampleBeautyTestimonialPlan = {
  aspectRatio: "9:16",
  durationSeconds: 12,
  product: {
    ctaText: "Cek paketnya sebelum batch promo habis",
    imageUrl: "",
    offerText: "Creator pick minggu ini",
    presenterImageUrl: "",
    priceText: "Mulai Rp149.000",
    subtitle: "Angle host-style untuk skincare affiliate",
    title: "Serum calming untuk jerawat aktif"
  },
  scenes: [
    {
      durationFrames: 75,
      id: "scene-hook",
      kind: "creator_hook",
      layout: "ugc-host",
      textBlocks: [
        {
          animation: "slide-up",
          role: "headline",
          text: "Kalau lagi cari serum yang enak dipakai harian, ini yang paling sering aku taruh di shortlist."
        },
        {
          animation: "fade",
          role: "supporting",
          text: "Teksturnya ringan dan angle-nya terasa lebih personal saat dibawa pakai host frame."
        }
      ]
    },
    {
      durationFrames: 90,
      id: "scene-proof",
      kind: "creator_proof",
      layout: "host-product",
      textBlocks: [
        {
          animation: "fade",
          role: "headline",
          text: "Enak buat konten UGC karena bisa sambil nunjukin pengalaman pakai dan alasan kenapa produk ini terasa aman dicoba."
        },
        {
          animation: "fade",
          role: "caption",
          text: "Gunakan subtitle yang terasa seperti creator lagi bicara langsung ke penonton."
        }
      ]
    },
    {
      durationFrames: 75,
      id: "scene-offer",
      kind: "offer",
      layout: "offer-card",
      textBlocks: [
        {
          animation: "pop",
          role: "offer",
          text: "Creator pick minggu ini"
        },
        {
          animation: "fade",
          role: "price",
          text: "Mulai Rp149.000"
        }
      ]
    },
    {
      durationFrames: 90,
      id: "scene-cta",
      kind: "cta",
      layout: "host-cta",
      textBlocks: [
        {
          animation: "type",
          role: "cta",
          text: "Cek paketnya sebelum batch promo habis"
        },
        {
          animation: "fade",
          role: "caption",
          text: "Template ini cocok untuk feel UGC tanpa harus langsung pakai avatar AI."
        }
      ]
    }
  ],
  templateKey: "beauty/testimonial_style",
  version: 1
};

export const sampleGadgetComparisonPlan = {
  aspectRatio: "9:16",
  durationSeconds: 12,
  product: {
    ctaText: "Cek promo gadget hari ini",
    imageUrl: "",
    offerText: "Value paling masuk akal",
    priceText: "Mulai Rp499.000",
    subtitle: "Shortlist gadget harian",
    title: "Earbuds ANC vs smartwatch"
  },
  scenes: [
    {
      durationFrames: 75,
      id: "scene-hook",
      kind: "comparison",
      layout: "split",
      textBlocks: [
        {
          animation: "slide-up",
          role: "headline",
          text: "Mending upgrade ke earbuds ANC atau smartwatch dulu?"
        },
        {
          animation: "fade",
          role: "supporting",
          text: "Bandingkan value paling masuk akal untuk daily setup"
        }
      ]
    },
    {
      durationFrames: 90,
      id: "scene-left-advantage",
      kind: "feature_battle",
      layout: "comparison",
      textBlocks: [
        {
          animation: "slide-up",
          role: "headline",
          text: "Earbuds ANC lebih kerasa kalau kamu butuh fokus di jalan"
        },
        {
          animation: "fade",
          role: "supporting",
          text: "Noise canceling, compact, dan langsung terasa impact-nya"
        }
      ]
    },
    {
      durationFrames: 90,
      id: "scene-right-advantage",
      kind: "feature_battle",
      layout: "comparison",
      textBlocks: [
        {
          animation: "slide-up",
          role: "headline",
          text: "Smartwatch menang kalau kamu cari tracking dan notifikasi harian"
        },
        {
          animation: "fade",
          role: "supporting",
          text: "Lebih cocok untuk angle produktivitas dan fitness"
        }
      ]
    },
    {
      durationFrames: 105,
      id: "scene-cta",
      kind: "cta",
      layout: "comparison",
      textBlocks: [
        {
          animation: "pop",
          role: "headline",
          text: "Pilih yang paling match sama rutinitasmu, lalu cek promo hari ini"
        },
        {
          animation: "fade",
          role: "caption",
          text: "Template comparison ini siap dipakai untuk gadget shortlist ads"
        }
      ]
    }
  ],
  templateKey: "gadget/comparison",
  version: 1
};
