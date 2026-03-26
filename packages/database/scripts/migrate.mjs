import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const migrationsRoot = path.join(packageRoot, "migrations");
const migrationTableName = "public.schema_migrations";
const advisoryLockKey = "91300421";
const migrationOrder = [
  "0000_bootstrap.sql",
  "identity",
  "content",
  "asset",
  "billing",
  "notification",
  "analytics",
  "trend",
  "publishing",
  "media"
];

async function main() {
  const command = process.argv[2] ?? "status";
  const databaseUrl =
    process.env.DATABASE_URL ?? "postgresql://creatorflow:creatorflow@localhost:5433/creatorflow";

  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to connect to database using DATABASE_URL=${databaseUrl}`);
    console.error(message || "No PostgreSQL server was reachable. Start local infra first, then rerun the migration command.");
    process.exit(1);
  }

  try {
    await ensureMigrationTable(client);

    if (command === "up") {
      await migrateUp(client);
      return;
    }

    if (command === "status") {
      await printStatus(client);
      return;
    }

    throw new Error(`Unknown command: ${command}`);
  } finally {
    await client.end();
  }
}

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${migrationTableName} (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      checksum_sha256 TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function migrateUp(client) {
  const migrationFiles = await getMigrationFiles();
  const applied = await getAppliedMigrations(client);

  await client.query(`SELECT pg_advisory_lock(${advisoryLockKey})`);

  try {
    for (const migrationFile of migrationFiles) {
      const sql = await fs.readFile(migrationFile.absolutePath, "utf8");
      const checksum = hashContent(sql);
      const existing = applied.get(migrationFile.relativePath);

      if (existing) {
        if (existing.checksum !== checksum) {
          throw new Error(
            `Checksum mismatch for applied migration ${migrationFile.relativePath}. Create a new migration instead of editing an applied one.`
          );
        }
        continue;
      }

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO ${migrationTableName} (filename, checksum_sha256) VALUES ($1, $2)`,
          [migrationFile.relativePath, checksum]
        );
        await client.query("COMMIT");
        console.log(`applied ${migrationFile.relativePath}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.query(`SELECT pg_advisory_unlock(${advisoryLockKey})`);
  }
}

async function printStatus(client) {
  const migrationFiles = await getMigrationFiles();
  const applied = await getAppliedMigrations(client);

  for (const migrationFile of migrationFiles) {
    const sql = await fs.readFile(migrationFile.absolutePath, "utf8");
    const checksum = hashContent(sql);
    const existing = applied.get(migrationFile.relativePath);

    if (!existing) {
      console.log(`pending  ${migrationFile.relativePath}`);
      continue;
    }

    if (existing.checksum !== checksum) {
      console.log(`changed  ${migrationFile.relativePath}`);
      continue;
    }

    console.log(`applied  ${migrationFile.relativePath}`);
  }
}

async function getAppliedMigrations(client) {
  const result = await client.query(
    `SELECT filename, checksum_sha256 FROM ${migrationTableName} ORDER BY filename`
  );

  return new Map(
    result.rows.map((row) => [
      row.filename,
      {
        checksum: row.checksum_sha256
      }
    ])
  );
}

async function getMigrationFiles() {
  const files = [];
  await walkDirectory(migrationsRoot, files);

  return files
    .filter((entry) => entry.absolutePath.endsWith(".sql"))
    .sort(compareMigrationFiles);
}

async function walkDirectory(directoryPath, files) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      await walkDirectory(absolutePath, files);
      continue;
    }

    files.push({
      absolutePath,
      relativePath: path.relative(migrationsRoot, absolutePath)
    });
  }
}

function hashContent(content) {
  return createHash("sha256").update(content).digest("hex");
}

function compareMigrationFiles(left, right) {
  const leftWeight = migrationWeight(left.relativePath);
  const rightWeight = migrationWeight(right.relativePath);

  if (leftWeight !== rightWeight) {
    return leftWeight - rightWeight;
  }

  return left.relativePath.localeCompare(right.relativePath);
}

function migrationWeight(relativePath) {
  const [topLevelSegment] = relativePath.split(path.sep);
  const index = migrationOrder.indexOf(topLevelSegment);

  if (index >= 0) {
    return index;
  }

  return migrationOrder.length + 1;
}

main().catch((error) => {
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  } else {
    console.error(String(error));
  }
  process.exit(1);
});
