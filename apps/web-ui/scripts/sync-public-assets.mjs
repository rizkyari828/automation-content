import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(appRoot, "assets");
const targetDir = path.join(appRoot, "public", "assets");

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Asset source directory not found: ${sourceDir}`);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(path.dirname(targetDir), { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

console.log(`Synced assets to ${targetDir}`);
