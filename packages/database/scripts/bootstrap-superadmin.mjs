import { randomBytes, scrypt as nodeScrypt } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const scrypt = promisify(nodeScrypt);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(packageRoot, "../..");
const envFilePath = path.join(repoRoot, ".env");

const DEFAULT_DATABASE_URL = "postgresql://creatorflow:creatorflow@localhost:5433/creatorflow";
const DEFAULT_EMAIL = "superadmin@creatorflow.local";
const DEFAULT_FULL_NAME = "CreatorFlow Superadmin";
const DEFAULT_PASSWORD = "creatorflow-dev-superadmin";
const DEFAULT_WORKSPACE_NAME = "CreatorFlow Control Room";
const DEFAULT_WORKSPACE_SLUG = "creatorflow-control-room";
const FEATURE_CODES = [
  "assets",
  "billing",
  "content",
  "media",
  "publishing",
  "sso",
  "team",
  "trend",
  "workspace_settings"
];

async function main() {
  if (process.argv.includes("--help")) {
    printHelp();
    return;
  }

  await loadEnvFile(envFilePath);

  const config = {
    databaseUrl: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    email: (process.env.BOOTSTRAP_SUPERADMIN_EMAIL ?? DEFAULT_EMAIL).toLowerCase(),
    fullName: process.env.BOOTSTRAP_SUPERADMIN_FULL_NAME ?? DEFAULT_FULL_NAME,
    password: process.env.BOOTSTRAP_SUPERADMIN_PASSWORD ?? DEFAULT_PASSWORD,
    workspaceName: process.env.BOOTSTRAP_SUPERADMIN_WORKSPACE_NAME ?? DEFAULT_WORKSPACE_NAME,
    workspaceSlug: process.env.BOOTSTRAP_SUPERADMIN_WORKSPACE_SLUG ?? DEFAULT_WORKSPACE_SLUG
  };

  if (config.password.length < 8) {
    throw new Error("BOOTSTRAP_SUPERADMIN_PASSWORD must be at least 8 characters.");
  }

  const client = new Client({ connectionString: config.databaseUrl });
  try {
    await client.connect();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to connect to database using DATABASE_URL=${config.databaseUrl}`);
    console.error(message || "No PostgreSQL server was reachable. Start local infra first, then rerun the bootstrap command.");
    process.exit(1);
  }

  try {
    await client.query("BEGIN");

    const passwordHash = await hashPassword(config.password);
    const userId = await ensureUser(client, {
      email: config.email,
      fullName: config.fullName,
      passwordHash
    });
    const workspaceId = await ensureWorkspace(client, {
      ownerUserId: userId,
      workspaceName: config.workspaceName,
      workspaceSlug: config.workspaceSlug
    });

    await ensureOwnerMembership(client, { userId, workspaceId });
    await ensureSuperadminRole(client, { userId });
    await ensureWorkspaceFeatures(client, { configuredByUserId: userId, workspaceId });

    await client.query("COMMIT");

    console.log("CreatorFlow superadmin bootstrap completed.");
    console.log(`Email: ${config.email}`);
    console.log(`Password: ${config.password}`);
    console.log(`Workspace: ${config.workspaceName}`);
    console.log(`Workspace slug: ${config.workspaceSlug}`);
    console.log("This command is idempotent and safe to rerun for local development.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

async function ensureUser(client, input) {
  const existing = await client.query(
    `
      SELECT id
      FROM identity.users
      WHERE email = $1
      LIMIT 1
    `,
    [input.email]
  );

  if (existing.rows[0]?.id) {
    await client.query(
      `
        UPDATE identity.users
        SET
          full_name = $2,
          password_hash = $3,
          status = 'active',
          email_verified_at = COALESCE(email_verified_at, NOW()),
          updated_at = NOW()
        WHERE id = $1
      `,
      [existing.rows[0].id, input.fullName, input.passwordHash]
    );

    return existing.rows[0].id;
  }

  const inserted = await client.query(
    `
      INSERT INTO identity.users (
        email,
        password_hash,
        full_name,
        status,
        email_verified_at
      )
      VALUES ($1, $2, $3, 'active', NOW())
      RETURNING id
    `,
    [input.email, input.passwordHash, input.fullName]
  );

  return inserted.rows[0].id;
}

async function ensureWorkspace(client, input) {
  const existing = await client.query(
    `
      SELECT id
      FROM identity.workspaces
      WHERE slug = $1
      LIMIT 1
    `,
    [input.workspaceSlug]
  );

  if (existing.rows[0]?.id) {
    await client.query(
      `
        UPDATE identity.workspaces
        SET
          owner_user_id = $2,
          name = $3,
          status = 'active',
          updated_at = NOW()
        WHERE id = $1
      `,
      [existing.rows[0].id, input.ownerUserId, input.workspaceName]
    );

    return existing.rows[0].id;
  }

  const inserted = await client.query(
    `
      INSERT INTO identity.workspaces (
        owner_user_id,
        name,
        slug,
        status
      )
      VALUES ($1, $2, $3, 'active')
      RETURNING id
    `,
    [input.ownerUserId, input.workspaceName, input.workspaceSlug]
  );

  return inserted.rows[0].id;
}

async function ensureOwnerMembership(client, input) {
  await client.query(
    `
      INSERT INTO identity.memberships (
        workspace_id,
        user_id,
        role_code,
        joined_at
      )
      VALUES ($1, $2, 'owner', NOW())
      ON CONFLICT (workspace_id, user_id) DO UPDATE
      SET
        role_code = 'owner',
        joined_at = COALESCE(identity.memberships.joined_at, NOW()),
        updated_at = NOW()
    `,
    [input.workspaceId, input.userId]
  );
}

async function ensureSuperadminRole(client, input) {
  await client.query(
    `
      INSERT INTO identity.platform_role_assignments (
        user_id,
        role_code,
        created_by_user_id
      )
      VALUES ($1, 'superadmin', $1)
      ON CONFLICT (user_id, role_code) DO NOTHING
    `,
    [input.userId]
  );
}

async function ensureWorkspaceFeatures(client, input) {
  for (const featureCode of FEATURE_CODES) {
    await client.query(
      `
        INSERT INTO identity.workspace_features (
          workspace_id,
          feature_code,
          is_enabled,
          configured_by_user_id
        )
        VALUES ($1, $2, TRUE, $3)
        ON CONFLICT (workspace_id, feature_code) DO UPDATE
        SET
          is_enabled = TRUE,
          configured_by_user_id = EXCLUDED.configured_by_user_id,
          updated_at = NOW()
      `,
      [input.workspaceId, featureCode, input.configuredByUserId]
    );
  }
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function loadEnvFile(targetPath) {
  try {
    const content = await fs.readFile(targetPath, "utf8");

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      if (!key || process.env[key] !== undefined) {
        continue;
      }

      process.env[key] = stripQuotes(rawValue);
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
}

function stripQuotes(value) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function printHelp() {
  console.log("Bootstrap a local CreatorFlow superadmin account.");
  console.log("");
  console.log("Usage:");
  console.log("  npm run bootstrap:superadmin");
  console.log("");
  console.log("Optional env overrides:");
  console.log("  BOOTSTRAP_SUPERADMIN_EMAIL");
  console.log("  BOOTSTRAP_SUPERADMIN_PASSWORD");
  console.log("  BOOTSTRAP_SUPERADMIN_FULL_NAME");
  console.log("  BOOTSTRAP_SUPERADMIN_WORKSPACE_NAME");
  console.log("  BOOTSTRAP_SUPERADMIN_WORKSPACE_SLUG");
}

main().catch((error) => {
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  } else {
    console.error(String(error));
  }
  process.exit(1);
});
