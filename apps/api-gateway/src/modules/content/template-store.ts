import type { PoolClient, QueryResultRow } from "pg";
import { notFound } from "../../lib/http.js";

export type TemplateScope = "official" | "workspace";
export type TemplateStatus = "archived" | "draft" | "published";
export type TemplateNiche = "beauty" | "fashion" | "gadget";
export type TemplateObjective = "comparison" | "problem_solution" | "promo_offer" | "testimonial_style";

export type TemplateVariables = {
  brandTone?: string;
  ctaText?: string;
  offerText?: string;
  presenterImageUrl?: string;
  productImageUrl?: string;
  priceText?: string;
  promptHint?: string;
  sourceType?: string;
  title?: string;
};

type TemplateRow = QueryResultRow & {
  body: string;
  created_at: string;
  id: string;
  key: string;
  niche: TemplateNiche;
  objective: TemplateObjective;
  scope: TemplateScope;
  status: TemplateStatus;
  title: string;
  updated_at: string;
  use_case_badge: string;
  variables: TemplateVariables | null;
  workspace_id: string | null;
};

export function serializeTemplate(row: TemplateRow) {
  return {
    body: row.body,
    createdAt: row.created_at,
    id: row.id,
    key: row.key,
    niche: row.niche,
    objective: row.objective,
    scope: row.scope,
    status: row.status,
    title: row.title,
    updatedAt: row.updated_at,
    useCaseBadge: row.use_case_badge,
    variables: row.variables ?? {},
    workspaceId: row.workspace_id
  };
}

export async function listTemplates(
  client: PoolClient,
  input: {
    includeUnpublished?: boolean;
    scope?: TemplateScope;
    workspaceId?: string;
  }
) {
  const values: unknown[] = [
    input.scope ?? null,
    input.workspaceId ?? null,
    input.includeUnpublished ?? false
  ];

  const result = await client.query<TemplateRow>(
    `
      SELECT
        id,
        workspace_id,
        scope,
        key,
        title,
        body,
        niche,
        objective,
        status,
        use_case_badge,
        variables,
        created_at,
        updated_at
      FROM content.templates
      WHERE ($1::text IS NULL OR scope = $1)
        AND (
          scope = 'official'
          OR workspace_id = $2::uuid
        )
        AND (
          $3::boolean = TRUE
          OR status <> 'archived'
        )
        AND (
          $3::boolean = TRUE
          OR scope <> 'official'
          OR status = 'published'
        )
      ORDER BY
        CASE status
          WHEN 'published' THEN 0
          WHEN 'draft' THEN 1
          ELSE 2
        END,
        updated_at DESC
    `,
    values
  );

  return result.rows.map(serializeTemplate);
}

export async function findTemplateById(
  client: PoolClient,
  input: {
    id: string;
    workspaceId?: string;
  }
) {
  const result = await client.query<TemplateRow>(
    `
      SELECT
        id,
        workspace_id,
        scope,
        key,
        title,
        body,
        niche,
        objective,
        status,
        use_case_badge,
        variables,
        created_at,
        updated_at
      FROM content.templates
      WHERE id = $1
        AND (
          scope = 'official'
          OR workspace_id = $2::uuid
        )
      LIMIT 1
    `,
    [input.id, input.workspaceId ?? null]
  );

  return result.rows[0] ? serializeTemplate(result.rows[0]) : null;
}

export async function createTemplate(
  client: PoolClient,
  input: {
    body: string;
    createdByUserId: string;
    key: string;
    niche: TemplateNiche;
    objective: TemplateObjective;
    scope: TemplateScope;
    status: TemplateStatus;
    title: string;
    useCaseBadge: string;
    variables: TemplateVariables;
    workspaceId?: string | null;
  }
) {
  const result = await client.query<TemplateRow>(
    `
      INSERT INTO content.templates (
        workspace_id,
        created_by_user_id,
        updated_by_user_id,
        scope,
        key,
        title,
        body,
        niche,
        objective,
        status,
        use_case_badge,
        variables
      )
      VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
      RETURNING
        id,
        workspace_id,
        scope,
        key,
        title,
        body,
        niche,
        objective,
        status,
        use_case_badge,
        variables,
        created_at,
        updated_at
    `,
    [
      input.scope === "workspace" ? input.workspaceId ?? null : null,
      input.createdByUserId,
      input.scope,
      input.key,
      input.title,
      input.body,
      input.niche,
      input.objective,
      input.status,
      input.useCaseBadge,
      JSON.stringify(input.variables ?? {})
    ]
  );

  return serializeTemplate(result.rows[0]);
}

export async function updateTemplate(
  client: PoolClient,
  input: {
    body?: string;
    id: string;
    key?: string;
    niche?: TemplateNiche;
    objective?: TemplateObjective;
    status?: TemplateStatus;
    title?: string;
    updatedByUserId: string;
    useCaseBadge?: string;
    variables?: TemplateVariables;
    workspaceId?: string;
  }
) {
  const result = await client.query<TemplateRow>(
    `
      UPDATE content.templates
      SET
        key = COALESCE($2, key),
        title = COALESCE($3, title),
        body = COALESCE($4, body),
        niche = COALESCE($5, niche),
        objective = COALESCE($6, objective),
        status = COALESCE($7, status),
        use_case_badge = COALESCE($8, use_case_badge),
        variables = COALESCE($9::jsonb, variables),
        updated_by_user_id = $10,
        updated_at = NOW()
      WHERE id = $1
        AND (
          scope = 'official'
          OR workspace_id = $11::uuid
        )
      RETURNING
        id,
        workspace_id,
        scope,
        key,
        title,
        body,
        niche,
        objective,
        status,
        use_case_badge,
        variables,
        created_at,
        updated_at
    `,
    [
      input.id,
      input.key ?? null,
      input.title ?? null,
      input.body ?? null,
      input.niche ?? null,
      input.objective ?? null,
      input.status ?? null,
      input.useCaseBadge ?? null,
      input.variables ? JSON.stringify(input.variables) : null,
      input.updatedByUserId,
      input.workspaceId ?? null
    ]
  );

  return result.rows[0] ? serializeTemplate(result.rows[0]) : null;
}

export async function cloneTemplateToWorkspace(
  client: PoolClient,
  input: {
    sourceTemplateId: string;
    userId: string;
    workspaceId: string;
  }
) {
  const source = await client.query<TemplateRow>(
    `
      SELECT
        id,
        workspace_id,
        scope,
        key,
        title,
        body,
        niche,
        objective,
        status,
        use_case_badge,
        variables,
        created_at,
        updated_at
      FROM content.templates
      WHERE id = $1
      LIMIT 1
    `,
    [input.sourceTemplateId]
  );

  const sourceRow = source.rows[0];
  if (!sourceRow || sourceRow.scope !== "official") {
    return null;
  }

  const nextKey = await resolveWorkspaceCloneKey(client, {
    sourceKey: sourceRow.key,
    workspaceId: input.workspaceId
  });

  const result = await client.query<TemplateRow>(
    `
      INSERT INTO content.templates (
        workspace_id,
        created_by_user_id,
        updated_by_user_id,
        scope,
        key,
        title,
        body,
        niche,
        objective,
        status,
        use_case_badge,
        variables
      )
      VALUES ($1, $2, $2, 'workspace', $3, $4, $5, $6, $7, 'draft', $8, $9::jsonb)
      RETURNING
        id,
        workspace_id,
        scope,
        key,
        title,
        body,
        niche,
        objective,
        status,
        use_case_badge,
        variables,
        created_at,
        updated_at
    `,
    [
      input.workspaceId,
      input.userId,
      nextKey,
      buildWorkspaceCloneTitle(sourceRow.title, nextKey === sourceRow.key),
      sourceRow.body,
      sourceRow.niche,
      sourceRow.objective,
      sourceRow.use_case_badge,
      JSON.stringify(sourceRow.variables ?? {})
    ]
  );

  return serializeTemplate(result.rows[0]);
}

export async function duplicateWorkspaceTemplate(
  client: PoolClient,
  input: {
    sourceTemplateId: string;
    userId: string;
    workspaceId: string;
  }
) {
  const source = await client.query<TemplateRow>(
    `
      SELECT
        id,
        workspace_id,
        scope,
        key,
        title,
        body,
        niche,
        objective,
        status,
        use_case_badge,
        variables,
        created_at,
        updated_at
      FROM content.templates
      WHERE id = $1
        AND scope = 'workspace'
        AND workspace_id = $2::uuid
      LIMIT 1
    `,
    [input.sourceTemplateId, input.workspaceId]
  );

  const sourceRow = source.rows[0];
  if (!sourceRow) {
    return null;
  }

  const nextKey = await resolveWorkspaceCloneKey(client, {
    sourceKey: sourceRow.key,
    workspaceId: input.workspaceId
  });

  const result = await client.query<TemplateRow>(
    `
      INSERT INTO content.templates (
        workspace_id,
        created_by_user_id,
        updated_by_user_id,
        scope,
        key,
        title,
        body,
        niche,
        objective,
        status,
        use_case_badge,
        variables
      )
      VALUES ($1, $2, $2, 'workspace', $3, $4, $5, $6, $7, 'draft', $8, $9::jsonb)
      RETURNING
        id,
        workspace_id,
        scope,
        key,
        title,
        body,
        niche,
        objective,
        status,
        use_case_badge,
        variables,
        created_at,
        updated_at
    `,
    [
      input.workspaceId,
      input.userId,
      nextKey,
      buildWorkspaceCloneTitle(sourceRow.title, nextKey === sourceRow.key),
      sourceRow.body,
      sourceRow.niche,
      sourceRow.objective,
      sourceRow.use_case_badge,
      JSON.stringify(sourceRow.variables ?? {})
    ]
  );

  return serializeTemplate(result.rows[0]);
}

export function ensureTemplateFound<T>(
  template: T | null,
  reply: Parameters<typeof notFound>[0]
) {
  if (!template) {
    return notFound(reply, "Template not found");
  }

  return null;
}

async function resolveWorkspaceCloneKey(
  client: PoolClient,
  input: {
    sourceKey: string;
    workspaceId: string;
  }
) {
  const result = await client.query<{ key: string }>(
    `
      SELECT key
      FROM content.templates
      WHERE scope = 'workspace'
        AND workspace_id = $1
        AND (
          key = $2
          OR key = $3
          OR key LIKE $4
        )
    `,
    [
      input.workspaceId,
      input.sourceKey,
      `${input.sourceKey}/copy`,
      `${input.sourceKey}/copy-%`
    ]
  );

  const existingKeys = new Set(result.rows.map((row) => row.key));
  if (!existingKeys.has(input.sourceKey)) {
    return input.sourceKey;
  }

  const firstCloneKey = `${input.sourceKey}/copy`;
  if (!existingKeys.has(firstCloneKey)) {
    return firstCloneKey;
  }

  let counter = 2;
  while (existingKeys.has(`${input.sourceKey}/copy-${counter}`)) {
    counter += 1;
  }

  return `${input.sourceKey}/copy-${counter}`;
}

function buildWorkspaceCloneTitle(sourceTitle: string, preserveTitle: boolean) {
  if (preserveTitle) {
    return `${sourceTitle} · Workspace`;
  }

  return `${sourceTitle} · Workspace copy`;
}
