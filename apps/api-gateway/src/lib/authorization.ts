import type { FastifyReply, FastifyRequest } from "fastify";
import type { PoolClient } from "pg";
import { query } from "./database.js";
import { forbidden, unauthorized } from "./http.js";

export const PLATFORM_ROLE_CODES = ["superadmin"] as const;
export const WORKSPACE_ROLE_CODES = ["owner", "admin", "editor", "viewer"] as const;
export const WORKSPACE_FEATURE_CODES = [
  "assets",
  "billing",
  "content",
  "media",
  "publishing",
  "sso",
  "team",
  "trend",
  "workspace_settings"
] as const;
export const PERMISSION_CODES = [
  "assets.read",
  "assets.upload",
  "billing.read",
  "billing.manage",
  "content.generate",
  "content.read",
  "features.manage",
  "media.read",
  "media.render",
  "members.manage",
  "platform.admin",
  "profile.manage",
  "publishing.read",
  "publishing.write",
  "sso.manage",
  "trend.collect",
  "trend.read",
  "workspace.manage",
  "workspace.view"
] as const;

export type PlatformRoleCode = (typeof PLATFORM_ROLE_CODES)[number];
export type WorkspaceRoleCode = (typeof WORKSPACE_ROLE_CODES)[number];
export type WorkspaceFeatureCode = (typeof WORKSPACE_FEATURE_CODES)[number];
export type PermissionCode = (typeof PERMISSION_CODES)[number];

type PlatformRoleRow = {
  role_code: PlatformRoleCode;
};

type WorkspaceFeatureRow = {
  feature_code: WorkspaceFeatureCode;
  is_enabled: boolean;
};

type WorkspaceRoleRow = {
  role_code: WorkspaceRoleCode;
};

export type WorkspaceFeatureState = {
  code: WorkspaceFeatureCode;
  enabled: boolean;
};

export type ResolvedUserAuthorization = {
  enabledFeatureCodes: WorkspaceFeatureCode[];
  features: WorkspaceFeatureState[];
  isSuperadmin: boolean;
  permissions: PermissionCode[];
  platformRoleCode: PlatformRoleCode | null;
  workspaceRoleCode: WorkspaceRoleCode;
};

const DEFAULT_WORKSPACE_FEATURES = WORKSPACE_FEATURE_CODES.map((code) => ({
  code,
  enabled: true
})) as WorkspaceFeatureState[];

const WORKSPACE_ROLE_PERMISSION_MATRIX: Record<WorkspaceRoleCode, PermissionCode[]> = {
  owner: [
    "assets.read",
    "assets.upload",
    "billing.read",
    "billing.manage",
    "content.generate",
    "content.read",
    "features.manage",
    "media.read",
    "media.render",
    "members.manage",
    "profile.manage",
    "publishing.read",
    "publishing.write",
    "sso.manage",
    "trend.collect",
    "trend.read",
    "workspace.manage",
    "workspace.view"
  ],
  admin: [
    "assets.read",
    "assets.upload",
    "billing.read",
    "content.generate",
    "content.read",
    "media.read",
    "media.render",
    "members.manage",
    "profile.manage",
    "publishing.read",
    "publishing.write",
    "sso.manage",
    "trend.collect",
    "trend.read",
    "workspace.manage",
    "workspace.view"
  ],
  editor: [
    "assets.read",
    "assets.upload",
    "content.generate",
    "content.read",
    "media.read",
    "media.render",
    "profile.manage",
    "publishing.read",
    "publishing.write",
    "trend.collect",
    "trend.read",
    "workspace.view"
  ],
  viewer: [
    "assets.read",
    "content.read",
    "media.read",
    "profile.manage",
    "publishing.read",
    "trend.read",
    "workspace.view"
  ]
};

export async function getRequestAuthorization(request: FastifyRequest) {
  if (request.userAuthorization) {
    return request.userAuthorization;
  }

  if (!request.userAuth) {
    return null;
  }

  const [workspaceRole, platformRole, workspaceFeatures] = await Promise.all([
    findWorkspaceRole(request.userAuth.userId, request.userAuth.workspaceId),
    findPlatformRole(request.userAuth.userId),
    findWorkspaceFeatures(request.userAuth.workspaceId)
  ]);

  if (!workspaceRole) {
    return null;
  }

  const features = mergeWorkspaceFeatureStates(workspaceFeatures);
  const permissionSet = new Set<PermissionCode>([
    ...WORKSPACE_ROLE_PERMISSION_MATRIX[workspaceRole],
    "profile.manage"
  ]);

  if (platformRole === "superadmin") {
    PERMISSION_CODES.forEach((code) => permissionSet.add(code));
  }

  request.userAuthorization = {
    enabledFeatureCodes: features.filter((feature) => feature.enabled).map((feature) => feature.code),
    features,
    isSuperadmin: platformRole === "superadmin",
    permissions: Array.from(permissionSet),
    platformRoleCode: platformRole,
    workspaceRoleCode: workspaceRole
  };

  return request.userAuthorization;
}

export async function ensureWorkspacePermission(
  request: FastifyRequest,
  reply: FastifyReply,
  input: {
    feature?: WorkspaceFeatureCode;
    permission: PermissionCode;
  }
) {
  if (!request.userAuth) {
    return unauthorized(reply, "Missing user auth context");
  }

  const authorization = await getRequestAuthorization(request);

  if (!authorization) {
    return unauthorized(reply, "Workspace authorization context is missing");
  }

  if (
    input.feature &&
    !authorization.isSuperadmin &&
    !authorization.enabledFeatureCodes.includes(input.feature)
  ) {
    return forbidden(reply, `${input.feature} feature is disabled for this workspace`);
  }

  if (
    !authorization.isSuperadmin &&
    !authorization.permissions.includes(input.permission)
  ) {
    return forbidden(reply, "You do not have permission to perform this action");
  }

  return null;
}

export async function seedDefaultWorkspaceFeatures(
  client: PoolClient,
  workspaceId: string,
  configuredByUserId: string | null
) {
  await client.query(
    `
      INSERT INTO identity.workspace_features (
        workspace_id,
        feature_code,
        is_enabled,
        configured_by_user_id
      )
      VALUES
        ($1, 'assets', TRUE, $2),
        ($1, 'billing', TRUE, $2),
        ($1, 'content', TRUE, $2),
        ($1, 'media', TRUE, $2),
        ($1, 'publishing', TRUE, $2),
        ($1, 'sso', TRUE, $2),
        ($1, 'team', TRUE, $2),
        ($1, 'trend', TRUE, $2),
        ($1, 'workspace_settings', TRUE, $2)
      ON CONFLICT (workspace_id, feature_code) DO NOTHING
    `,
    [workspaceId, configuredByUserId]
  );
}

async function findPlatformRole(userId: string) {
  const result = await query<PlatformRoleRow>(
    `
      SELECT role_code
      FROM identity.platform_role_assignments
      WHERE user_id = $1
      ORDER BY created_at ASC
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0]?.role_code ?? null;
}

async function findWorkspaceFeatures(workspaceId: string) {
  const result = await query<WorkspaceFeatureRow>(
    `
      SELECT feature_code, is_enabled
      FROM identity.workspace_features
      WHERE workspace_id = $1
    `,
    [workspaceId]
  );

  return result.rows;
}

async function findWorkspaceRole(userId: string, workspaceId: string) {
  const result = await query<WorkspaceRoleRow>(
    `
      SELECT role_code
      FROM identity.memberships
      WHERE user_id = $1 AND workspace_id = $2
      LIMIT 1
    `,
    [userId, workspaceId]
  );

  return result.rows[0]?.role_code ?? null;
}

function mergeWorkspaceFeatureStates(rows: WorkspaceFeatureRow[]) {
  const overrides = new Map(
    rows.map((row) => [row.feature_code, row.is_enabled] as const)
  );

  return DEFAULT_WORKSPACE_FEATURES.map((feature) => ({
    code: feature.code,
    enabled: overrides.get(feature.code) ?? feature.enabled
  }));
}

declare module "fastify" {
  interface FastifyRequest {
    userAuthorization?: ResolvedUserAuthorization;
  }
}
