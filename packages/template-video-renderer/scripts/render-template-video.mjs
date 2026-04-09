import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const entryPoint = path.join(packageRoot, "src", "index.ts");

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.input || !args.output) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }

  const raw = await readFile(path.resolve(process.cwd(), args.input), "utf8");
  const spec = JSON.parse(raw);
  const plan = normalizePlan(spec);
  const compositionId = resolveCompositionId(plan.templateKey);
  const outputLocation = path.resolve(process.cwd(), args.output);

  await mkdir(path.dirname(outputLocation), { recursive: true });

  const bundled = await bundle({
    entryPoint,
    onProgress: () => undefined
  });

  const composition = await selectComposition({
    id: compositionId,
    inputProps: {
      plan
    },
    serveUrl: bundled
  });

  await renderMedia({
    codec: "h264",
    composition,
    inputProps: {
      plan
    },
    outputLocation,
    overwrite: true,
    serveUrl: bundled
  });

  process.stdout.write(
    JSON.stringify({
      compositionId,
      outputLocation,
      templateKey: plan.templateKey
    })
  );
}

function normalizePlan(spec) {
  const scenePlan = spec?.scenePlan ?? {};
  const scenes = Array.isArray(scenePlan.scenes) ? scenePlan.scenes : [];

  return {
    aspectRatio: spec?.aspectRatio ?? scenePlan?.aspectRatio ?? "9:16",
    durationSeconds: spec?.durationSeconds ?? scenePlan?.durationSeconds ?? 18,
    product: {
      ctaText: spec?.product?.ctaText ?? "",
      imageUrl: spec?.product?.imageUrl ?? "",
      offerText: spec?.product?.offerText ?? "",
      presenterImageUrl: spec?.product?.presenterImageUrl ?? "",
      priceText: spec?.product?.priceText ?? "",
      subtitle: spec?.product?.subtitle ?? "",
      title: spec?.product?.title ?? ""
    },
    scenes: scenes.map((scene, index) => ({
      durationFrames: Number(scene?.durationFrames ?? 75),
      id: scene?.id ?? `scene-${index + 1}`,
      kind: scene?.kind ?? "scene",
      layout: scene?.layout ?? "stacked",
      textBlocks: Array.isArray(scene?.textBlocks)
        ? scene.textBlocks.map((block, blockIndex) => ({
            animation: block?.animation ?? undefined,
            role: block?.role ?? `block-${blockIndex + 1}`,
            text: typeof block?.text === "string" ? block.text : ""
          }))
        : []
    })),
    templateKey: spec?.templateKey ?? scenePlan?.templateKey ?? "beauty/promo_offer",
    version: spec?.version ?? scenePlan?.version ?? 1
  };
}

function parseArgs(argv) {
  const args = {
    help: false,
    input: "",
    output: ""
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--help" || value === "-h") {
      args.help = true;
      continue;
    }

    if (value === "--input") {
      args.input = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (value === "--output") {
      args.output = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
  }

  return args;
}

function resolveCompositionId(templateKey) {
  if (templateKey === "beauty/testimonial_style") {
    return "creatorflow-beauty-testimonial";
  }

  if (templateKey === "gadget/comparison") {
    return "creatorflow-gadget-comparison";
  }

  return "creatorflow-template-video";
}

function printUsage() {
  process.stdout.write(
    [
      "Usage: node ./scripts/render-template-video.mjs --input <spec.json> --output <video.mp4>",
      "",
      "Renders a deterministic CreatorFlow template video from templateRenderSpec JSON."
    ].join("\n")
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
