type TemplatePlannerInput = {
  aspectRatio?: string;
  brandTone?: string;
  durationSeconds?: number;
  imageAssetIds?: string[];
  musicMode?: string;
  niche: "beauty" | "gadget" | "fashion";
  objective: "comparison" | "problem_solution" | "promo_offer" | "testimonial_style";
  product: {
    ctaText?: string;
    description?: string;
    offerText?: string;
    priceText?: string;
    subtitle?: string;
    title: string;
  };
  script: {
    body: string;
    cta: string;
    hook: string;
    subtitleLines?: string[];
  };
  variant?: string;
};

const DEFAULT_ASPECT_RATIO = "9:16";
const DEFAULT_DURATION_SECONDS = 18;

export function buildTemplatePlan(input: TemplatePlannerInput) {
  const aspectRatio = input.aspectRatio ?? DEFAULT_ASPECT_RATIO;
  const durationSeconds = input.durationSeconds ?? DEFAULT_DURATION_SECONDS;
  const templateKey = buildTemplateKey(input.niche, input.objective, input.variant);
  const scenePlan = buildTemplateScenePlan({
    ...input,
    aspectRatio,
    durationSeconds,
    templateKey
  });

  return {
    scenePlan,
    templateRenderSpec: {
      aspectRatio,
      ...(input.brandTone ? { brandTone: input.brandTone } : {}),
      durationSeconds,
      ...(input.musicMode ? { musicMode: input.musicMode } : {}),
      niche: input.niche,
      objective: input.objective,
      product: {
        ...input.product,
        ...(input.imageAssetIds?.length ? { imageAssetIds: input.imageAssetIds } : {})
      },
      renderMode: "template_promo",
      scenePlan,
      script: input.script,
      templateKey,
      version: 1
    }
  };
}

export function buildTemplateKey(niche: string, objective: string, variant?: string) {
  return variant ? `${niche}/${objective}/${variant}` : `${niche}/${objective}`;
}

function buildTemplateScenePlan(
  input: TemplatePlannerInput & {
    aspectRatio: string;
    durationSeconds: number;
    templateKey: string;
  }
) {
  const offerText = input.product.offerText?.trim() || input.product.priceText?.trim() || input.script.cta.trim();
  const proofText = input.product.description?.trim() || firstSentence(input.script.body) || input.product.subtitle?.trim() || input.product.title;
  const bodySupport = pickBodySupport(input.script.body, proofText, offerText);

  return {
    aspectRatio: input.aspectRatio,
    durationSeconds: input.durationSeconds,
    ...(input.musicMode ? { musicCue: { mode: input.musicMode, volume: 0.32 } } : {}),
    scenes: [
      {
        durationFrames: 75,
        id: "scene-hook",
        kind: input.objective === "problem_solution" ? "problem" : "hook",
        layout: "hero",
        textBlocks: [
          {
            animation: "slide-up",
            role: "headline",
            text: input.script.hook.trim()
          },
          {
            animation: "fade",
            role: "supporting",
            text: input.product.title
          }
        ]
      },
      {
        durationFrames: 90,
        id: "scene-benefit",
        kind: input.objective === "comparison" ? "proof" : "benefit",
        layout: "split",
        textBlocks: [
          {
            animation: "fade",
            role: "headline",
            text: bodySupport
          },
          {
            animation: "fade",
            role: "caption",
            text: input.product.subtitle?.trim() || input.product.description?.trim() || input.product.title
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
            text: offerText
          },
          {
            animation: "fade",
            role: "price",
            text: input.product.priceText?.trim() || input.product.offerText?.trim() || input.product.title
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
            text: input.product.ctaText?.trim() || input.script.cta.trim()
          },
          {
            animation: "fade",
            role: "caption",
            text: lastSubtitleLine(input.script.subtitleLines) || closingLine(input.objective)
          }
        ]
      }
    ],
    templateKey: input.templateKey,
    version: 1
  };
}

function pickBodySupport(body: string, proofText: string, offerText: string) {
  const parts = splitSentences(body);
  return parts.find((part) => part !== proofText && part !== offerText) ?? parts[0] ?? proofText;
}

function firstSentence(value: string) {
  return splitSentences(value)[0] ?? "";
}

function splitSentences(value: string) {
  return value
    .split(/[.!?]\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function lastSubtitleLine(lines?: string[]) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return "";
  }

  return lines[lines.length - 1]?.trim() ?? "";
}

function closingLine(objective: TemplatePlannerInput["objective"]) {
  if (objective === "comparison") {
    return "Bandingkan sekarang sebelum pilih produk lain.";
  }

  if (objective === "testimonial_style") {
    return "Masuk ke batch berikutnya kalau angle ini terasa paling meyakinkan.";
  }

  return "Dorong satu aksi yang jelas supaya draft ini cepat siap diposting.";
}
