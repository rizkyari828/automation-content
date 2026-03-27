import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(appDir, "../..");
const sharedLocalesDir = path.join(repoRoot, "shared", "locales");
const rootGeneratorPath = path.join(repoRoot, "scripts", "generate-locales.mjs");
const generatedMessagesPath = path.join(
  appDir,
  "components",
  "i18n",
  "generated-messages.js"
);

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const hasSharedLocales = await pathExists(sharedLocalesDir);
  const hasRootGenerator = await pathExists(rootGeneratorPath);

  if (hasSharedLocales && hasRootGenerator) {
    execFileSync(process.execPath, [rootGeneratorPath], {
      cwd: repoRoot,
      stdio: "inherit"
    });
    return;
  }

  if (await pathExists(generatedMessagesPath)) {
    console.warn(
      "[generate:i18n] Shared locale source not found. Using committed generated messages."
    );
    return;
  }

  throw new Error(
    "Shared locale source not found and generated web messages are unavailable."
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
