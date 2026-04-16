import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { authenticateUserRequest, ensureWorkspaceScope } from "../../lib/auth.js";
import { ensureWorkspacePermission } from "../../lib/authorization.js";
import { query, withTransaction } from "../../lib/database.js";
import {
  DownstreamServiceError,
  callInternalService
} from "../../lib/internal-service-client.js";
import { badRequest, internalError, notFound } from "../../lib/http.js";

type PublishJobResponse = {
  jobId: string;
  lastErrorMessage?: string;
  platformCode: string;
  publishPayload?: PublishPayload;
  publishedAt?: string;
  scheduledFor: string;
  status: string;
  workspaceId?: string;
};

type PublishPayload = {
  caption?: string;
  coverText?: string;
  hashtags?: string[];
  platformCode?: string;
  title?: string;
};

type OwnershipRow = {
  account_label?: string;
  external_account_id?: string;
  id: string;
  platform_code?: string;
  status?: string;
};

type CreatedRow = {
  id: string;
};

const PLATFORM_CODES = new Set(["tiktok", "instagram", "facebook", "youtube"]);

export function registerPublishingRoutes(app: FastifyInstance) {
  app.get(
    "/v1/publishing/connected-accounts",
    { preHandler: authenticateUserRequest },
    async (request, reply) => {
      const querystring = request.query as {
        platformCode?: string;
        workspaceId?: string;
      };

      try {
        const workspaceId = querystring.workspaceId ?? request.userAuth?.workspaceId;
        const workspaceError = ensureWorkspaceScope(request, reply, workspaceId);
        if (workspaceError) {
          return workspaceError;
        }

        const permissionError = await ensureWorkspacePermission(request, reply, {
          feature: "publishing",
          permission: "publishing.read"
        });
        if (permissionError) {
          return permissionError;
        }

        if (!workspaceId) {
          return badRequest(reply, "workspaceId is required");
        }

        if (querystring.platformCode && !PLATFORM_CODES.has(querystring.platformCode)) {
          return badRequest(reply, "platformCode is invalid");
        }

        const result = await query<OwnershipRow>(
          `
            SELECT
              id,
              platform_code,
              account_label,
              external_account_id,
              status
            FROM publishing.connected_accounts
            WHERE workspace_id = $1
              AND ($2::text IS NULL OR platform_code = $2)
            ORDER BY created_at DESC
          `,
          [workspaceId, querystring.platformCode ?? null]
        );

        return reply.send({
          items: result.rows.map((row) => ({
            id: row.id,
            platformCode: row.platform_code,
            accountLabel: row.account_label,
            externalAccountId: row.external_account_id,
            status: row.status
          }))
        });
      } catch (error) {
        request.log.error(error);
        return internalError(reply);
      }
    }
  );

  app.post(
    "/v1/publishing/connected-accounts",
    { preHandler: authenticateUserRequest },
    async (request, reply) => {
      const body = request.body as {
        accountLabel?: string;
        externalAccountId?: string;
        platformCode?: string;
        workspaceId?: string;
      };

      if (!body.accountLabel || !body.platformCode) {
        return badRequest(reply, "accountLabel and platformCode are required");
      }

      if (!PLATFORM_CODES.has(body.platformCode)) {
        return badRequest(reply, "platformCode is invalid");
      }

      try {
        const workspaceId = body.workspaceId ?? request.userAuth?.workspaceId;
        const workspaceError = ensureWorkspaceScope(request, reply, workspaceId);
        if (workspaceError) {
          return workspaceError;
        }

        const permissionError = await ensureWorkspacePermission(request, reply, {
          feature: "publishing",
          permission: "publishing.write"
        });
        if (permissionError) {
          return permissionError;
        }

        if (!workspaceId) {
          return badRequest(reply, "workspaceId is required");
        }

        const externalAccountId = createConnectedAccountExternalId(body.externalAccountId, body.accountLabel);
        const result = await query<OwnershipRow>(
          `
            INSERT INTO publishing.connected_accounts (
              workspace_id,
              platform_code,
              account_label,
              external_account_id,
              status
            )
            VALUES ($1, $2, $3, $4, 'active')
            RETURNING
              id,
              platform_code,
              account_label,
              external_account_id,
              status
          `,
          [workspaceId, body.platformCode, body.accountLabel.trim(), externalAccountId]
        );

        const account = result.rows[0];
        return reply.code(201).send({
          account: {
            id: account.id,
            platformCode: account.platform_code,
            accountLabel: account.account_label,
            externalAccountId: account.external_account_id,
            status: account.status
          }
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes("connected_accounts_external_unique")) {
          return badRequest(reply, "externalAccountId is already connected");
        }

        request.log.error(error);
        return internalError(reply);
      }
    }
  );

  app.post(
    "/v1/publishing/publish-jobs",
    { preHandler: authenticateUserRequest },
    async (request, reply) => {
      const body = request.body as {
        assetId?: string;
        captionId?: string;
        connectedAccountId?: string;
        idempotencyKey?: string;
        platformCode?: string;
        platformPackage?: PublishPayload;
        scheduledFor?: string;
        workspaceId?: string;
      };

      if (!body.platformCode || !body.scheduledFor) {
        return badRequest(reply, "platformCode and scheduledFor are required");
      }

      if (!PLATFORM_CODES.has(body.platformCode)) {
        return badRequest(reply, "platformCode is invalid");
      }

      if (Number.isNaN(Date.parse(body.scheduledFor))) {
        return badRequest(reply, "scheduledFor must be a valid ISO date-time");
      }

      try {
        const workspaceId = body.workspaceId ?? request.userAuth?.workspaceId;
        const workspaceError = ensureWorkspaceScope(request, reply, workspaceId);
        if (workspaceError) {
          return workspaceError;
        }

        const permissionError = await ensureWorkspacePermission(request, reply, {
          feature: "publishing",
          permission: "publishing.write"
        });
        if (permissionError) {
          return permissionError;
        }

        if (!workspaceId) {
          return badRequest(reply, "workspaceId is required");
        }

        const publishPayload = normalizePublishPayload(body.platformPackage, body.platformCode);
        if (body.platformPackage && !publishPayload) {
          return badRequest(reply, "platformPackage is invalid");
        }

        const effectiveCaptionId = body.captionId
          ? body.captionId
          : publishPayload
            ? await createCaptionFromPublishPayload({
              platformCode: body.platformCode,
              publishPayload,
              userId: request.userAuth?.userId ?? null,
              workspaceId
            })
            : undefined;

        if (body.assetId) {
          const assetResult = await query<OwnershipRow>(
            `
              SELECT id
              FROM asset.assets
              WHERE id = $1 AND workspace_id = $2
              LIMIT 1
            `,
            [body.assetId, workspaceId]
          );

          if (!assetResult.rows[0]) {
            return notFound(reply, "Asset was not found in the active workspace");
          }
        }

        if (effectiveCaptionId) {
          const captionResult = await query<OwnershipRow>(
            `
              SELECT id, platform_code
              FROM content.captions
              WHERE id = $1 AND workspace_id = $2
              LIMIT 1
            `,
            [effectiveCaptionId, workspaceId]
          );

          const caption = captionResult.rows[0];
          if (!caption) {
            return notFound(reply, "Caption was not found in the active workspace");
          }

          if (caption.platform_code && caption.platform_code !== body.platformCode) {
            return badRequest(reply, "Caption platform does not match platformCode");
          }
        }

        if (body.connectedAccountId) {
          const accountResult = await query<OwnershipRow>(
            `
              SELECT id, platform_code
              FROM publishing.connected_accounts
              WHERE id = $1 AND workspace_id = $2
              LIMIT 1
            `,
            [body.connectedAccountId, workspaceId]
          );

          const account = accountResult.rows[0];
          if (!account) {
            return notFound(reply, "Connected account was not found in the active workspace");
          }

          if (account.platform_code && account.platform_code !== body.platformCode) {
            return badRequest(reply, "Connected account platform does not match platformCode");
          }
        }

        const result = await callInternalService<PublishJobResponse>(request, {
          body: {
            assetId: body.assetId,
            captionId: effectiveCaptionId,
            connectedAccountId: body.connectedAccountId,
            idempotencyKey: body.idempotencyKey ?? randomUUID(),
            platformCode: body.platformCode,
            publishPayload: publishPayload ?? undefined,
            scheduledFor: body.scheduledFor,
            workspaceId
          },
          method: "POST",
          path: "/internal/v1/publish-jobs",
          scope: ["publishing.write"],
          service: "publishing-service"
        });

        return reply.code(result.status).send(stripWorkspaceId(result.data));
      } catch (error) {
        if (error instanceof DownstreamServiceError) {
          return reply.code(error.statusCode).send(error.responseBody);
        }

        request.log.error(error);
        return internalError(reply);
      }
    }
  );

  app.get(
    "/v1/publishing/publish-jobs/:jobId",
    { preHandler: authenticateUserRequest },
    async (request, reply) => {
      const params = request.params as { jobId?: string };

      if (!params.jobId) {
        return badRequest(reply, "jobId is required");
      }

      try {
        const permissionError = await ensureWorkspacePermission(request, reply, {
          feature: "publishing",
          permission: "publishing.read"
        });
        if (permissionError) {
          return permissionError;
        }

        const result = await callInternalService<PublishJobResponse>(request, {
          path: `/internal/v1/publish-jobs/${params.jobId}`,
          scope: ["publishing.read"],
          service: "publishing-service"
        });

        const workspaceError = ensureWorkspaceScope(request, reply, result.data.workspaceId);
        if (workspaceError) {
          return workspaceError;
        }

        return reply.send(stripWorkspaceId(result.data));
      } catch (error) {
        if (error instanceof DownstreamServiceError) {
          return reply.code(error.statusCode).send(error.responseBody);
        }

        request.log.error(error);
        return internalError(reply);
      }
    }
  );
}

function stripWorkspaceId(job: PublishJobResponse) {
  const { workspaceId: _, ...publicJob } = job;
  return publicJob;
}

function createConnectedAccountExternalId(input: string | undefined, accountLabel: string) {
  const candidate = (input ?? accountLabel)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return candidate || randomUUID().slice(0, 12);
}

function normalizePublishPayload(
  input: PublishPayload | undefined,
  platformCode: string | undefined
): PublishPayload | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const resolvedPlatformCode = typeof input.platformCode === "string" && input.platformCode.trim()
    ? input.platformCode.trim()
    : platformCode?.trim();

  if (!resolvedPlatformCode || !PLATFORM_CODES.has(resolvedPlatformCode)) {
    return null;
  }

  if (platformCode?.trim() && resolvedPlatformCode !== platformCode.trim()) {
    return null;
  }

  const title = normalizeOptionalText(input.title);
  const coverText = normalizeOptionalText(input.coverText);
  const caption = normalizeOptionalText(input.caption);
  const hashtags = normalizeHashtags(input.hashtags);

  if (!title && !coverText && !caption && hashtags.length === 0) {
    return null;
  }

  return {
    caption: caption ?? undefined,
    coverText: coverText ?? undefined,
    hashtags,
    platformCode: resolvedPlatformCode,
    title: title ?? undefined
  };
}

function normalizeOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeHashtags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 30);
}

async function createCaptionFromPublishPayload(input: {
  platformCode: string;
  publishPayload: PublishPayload;
  userId: string | null;
  workspaceId: string;
}) {
  const title = input.publishPayload.title?.trim()
    || input.publishPayload.coverText?.trim()
    || `Publish package ${input.platformCode}`;
  const body = input.publishPayload.caption?.trim()
    || input.publishPayload.coverText?.trim()
    || input.publishPayload.title?.trim()
    || `Publish package for ${input.platformCode}`;
  const hashtags = normalizeHashtags(input.publishPayload.hashtags);

  return withTransaction(async (client) => {
    const scriptResult = await client.query<CreatedRow>(
      `
        INSERT INTO content.scripts (
          workspace_id,
          created_by_user_id,
          source_type,
          title,
          hook,
          body,
          cta,
          language_code,
          status
        )
        VALUES ($1, $2, 'manual', $3, $4, $5, NULL, 'id', 'ready')
        RETURNING id
      `,
      [
        input.workspaceId,
        input.userId,
        title,
        input.publishPayload.coverText?.trim() || null,
        body
      ]
    );
    const scriptId = scriptResult.rows[0]?.id;
    if (!scriptId) {
      throw new Error("Failed to create publish script");
    }

    const captionResult = await client.query<CreatedRow>(
      `
        INSERT INTO content.captions (
          script_id,
          workspace_id,
          platform_code,
          caption_text,
          hashtags
        )
        VALUES ($1, $2, $3, $4, $5::text[])
        RETURNING id
      `,
      [
        scriptId,
        input.workspaceId,
        input.platformCode,
        input.publishPayload.caption?.trim() || body,
        hashtags
      ]
    );

    const captionId = captionResult.rows[0]?.id;
    if (!captionId) {
      throw new Error("Failed to create publish caption");
    }

    return captionId;
  });
}
