import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const localesDir = path.join(rootDir, "shared", "locales");
const outputWebPath = path.join(
  rootDir,
  "apps",
  "web-ui",
  "components",
  "i18n",
  "generated-messages.js"
);
const outputNativePath = path.join(
  rootDir,
  "apps",
  "native-ui",
  "lib",
  "core",
  "localization",
  "generated_app_strings_data.dart"
);

const localeCodes = ["en", "id"];
const referenceLocale = localeCodes[0];

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeDeep(base, extra) {
  if (!isPlainObject(base) || !isPlainObject(extra)) {
    return extra;
  }

  const merged = { ...base };

  for (const [key, value] of Object.entries(extra)) {
    const current = merged[key];
    merged[key] =
      isPlainObject(current) && isPlainObject(value)
        ? mergeDeep(current, value)
        : value;
  }

  return merged;
}

function getValueKind(value) {
  if (Array.isArray(value)) {
    return "array";
  }

  if (value === null) {
    return "null";
  }

  return typeof value === "object" ? "object" : typeof value;
}

function formatPath(pathSegments) {
  if (pathSegments.length === 0) {
    return "<root>";
  }

  return pathSegments.reduce((pathValue, segment) => {
    if (typeof segment === "number") {
      return `${pathValue}[${segment}]`;
    }

    return pathValue ? `${pathValue}.${segment}` : segment;
  }, "");
}

function compareLocaleShape(referenceValue, candidateValue, pathSegments, errors, candidateLocale) {
  const referenceKind = getValueKind(referenceValue);
  const candidateKind = getValueKind(candidateValue);

  if (referenceKind !== candidateKind) {
    errors.push(
      `${candidateLocale}: type mismatch at ${formatPath(pathSegments)} (expected ${referenceKind}, received ${candidateKind})`
    );
    return;
  }

  if (referenceKind === "array") {
    if (referenceValue.length !== candidateValue.length) {
      errors.push(
        `${candidateLocale}: array length mismatch at ${formatPath(pathSegments)} (expected ${referenceValue.length}, received ${candidateValue.length})`
      );
    }

    const itemCount = Math.min(referenceValue.length, candidateValue.length);

    for (let index = 0; index < itemCount; index += 1) {
      compareLocaleShape(
        referenceValue[index],
        candidateValue[index],
        [...pathSegments, index],
        errors,
        candidateLocale
      );
    }

    return;
  }

  if (referenceKind === "object") {
    const referenceKeys = Object.keys(referenceValue).sort();
    const candidateKeys = Object.keys(candidateValue).sort();
    const referenceKeySet = new Set(referenceKeys);
    const candidateKeySet = new Set(candidateKeys);

    for (const key of referenceKeys) {
      if (!candidateKeySet.has(key)) {
        errors.push(
          `${candidateLocale}: missing key ${formatPath([...pathSegments, key])}`
        );
      }
    }

    for (const key of candidateKeys) {
      if (!referenceKeySet.has(key)) {
        errors.push(
          `${candidateLocale}: unexpected key ${formatPath([...pathSegments, key])}`
        );
      }
    }

    for (const key of referenceKeys) {
      if (candidateKeySet.has(key)) {
        compareLocaleShape(
          referenceValue[key],
          candidateValue[key],
          [...pathSegments, key],
          errors,
          candidateLocale
        );
      }
    }
  }
}

function validateDirectoryFileSets(localeSources) {
  const errors = [];
  const referenceFiles = new Set(localeSources[referenceLocale].fileNames);

  for (const locale of localeCodes.slice(1)) {
    const candidateFiles = new Set(localeSources[locale].fileNames);

    for (const fileName of localeSources[referenceLocale].fileNames) {
      if (!candidateFiles.has(fileName)) {
        errors.push(`${locale}: missing locale file ${fileName}`);
      }
    }

    for (const fileName of localeSources[locale].fileNames) {
      if (!referenceFiles.has(fileName)) {
        errors.push(`${locale}: unexpected locale file ${fileName}`);
      }
    }
  }

  return errors;
}

function validateLocaleSources(localeSources) {
  const sourceModes = new Set(
    localeCodes.map((locale) => localeSources[locale].mode)
  );
  const errors = [];

  if (sourceModes.size > 1) {
    errors.push(
      `Locale source mode must match across locales: ${localeCodes
        .map((locale) => `${locale}=${localeSources[locale].mode}`)
        .join(", ")}`
    );
  }

  if (sourceModes.size === 1 && sourceModes.has("directory")) {
    errors.push(...validateDirectoryFileSets(localeSources));
  }

  const referenceData = localeSources[referenceLocale].data;

  for (const locale of localeCodes.slice(1)) {
    compareLocaleShape(referenceData, localeSources[locale].data, [], errors, locale);
  }

  if (errors.length > 0) {
    const details = errors.map((error) => `- ${error}`).join("\n");
    throw new Error(`Locale validation failed:\n${details}`);
  }
}

function toDartLiteral(value, indentLevel = 0) {
  const indent = "  ".repeat(indentLevel);
  const nextIndent = "  ".repeat(indentLevel + 1);

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[\n${value
      .map((entry) => `${nextIndent}${toDartLiteral(entry, indentLevel + 1)}`)
      .join(",\n")}\n${indent}]`;
  }

  if (value && typeof value === "object") {
    return `{\n${Object.entries(value)
      .map(
        ([key, entry]) =>
          `${nextIndent}${JSON.stringify(key)}: ${toDartLiteral(entry, indentLevel + 1)}`
      )
      .join(",\n")}\n${indent}}`;
  }

  return String(value);
}

async function loadLocaleSource(locale) {
  const directoryPath = path.join(localesDir, locale);
  const legacyFilePath = path.join(localesDir, `${locale}.json`);

  try {
    const directoryEntries = await fs.readdir(directoryPath, {
      withFileTypes: true
    });
    const jsonFiles = directoryEntries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));

    const mergedLocale = {};

    for (const fileName of jsonFiles) {
      const filePath = path.join(directoryPath, fileName);
      const raw = await fs.readFile(filePath, "utf8");
      const data = JSON.parse(raw);
      Object.assign(mergedLocale, mergeDeep(mergedLocale, data));
    }

    return {
      mode: "directory",
      fileNames: jsonFiles,
      data: mergedLocale
    };
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  const raw = await fs.readFile(legacyFilePath, "utf8");

  return {
    mode: "legacy-file",
    fileNames: [`${locale}.json`],
    data: JSON.parse(raw)
  };
}

async function loadLocales() {
  const entries = await Promise.all(
    localeCodes.map(async (locale) => {
      const source = await loadLocaleSource(locale);
      return [locale, source];
    })
  );

  const localeSources = Object.fromEntries(entries);
  validateLocaleSources(localeSources);

  return Object.fromEntries(
    Object.entries(localeSources).map(([locale, source]) => [locale, source.data])
  );
}

async function writeFile(filePath, contents) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf8");
}

async function main() {
  const locales = await loadLocales();

  const webContents = `export const GENERATED_MESSAGES = ${JSON.stringify(locales, null, 2)};\n`;
  const nativeMap = Object.fromEntries(
    Object.entries(locales).map(([locale, data]) => [locale, data.native])
  );
  const nativeContents = `const Map<String, Map<String, Object>> generatedAppStringsData = ${toDartLiteral(nativeMap)};\n`;

  await Promise.all([
    writeFile(outputWebPath, webContents),
    writeFile(outputNativePath, nativeContents)
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
