import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { authenticateUserRequest, ensureWorkspaceScope } from "../../lib/auth.js";
import { query } from "../../lib/database.js";
import {
  DownstreamServiceError,
  callInternalService
} from "../../lib/internal-service-client.js";
import { badRequest, internalError, notFound } from "../../lib/http.js";

type PublishJobResponse = {
  jobId: string;
  lastErrorMessage?: string;
  platformCode: string;
  publishedAt?: string;
  scheduledFor: string;
  status: string;
  workspaceId?: string;
};

type OwnershipRow = {
  id: string;
  platform_code?: string;
};

const PLATFORM_CODES = new Set(["tiktok", "instagram", "facebook", "youtube"]);

export function registerPublishingRoutes(app: FastifyInstance) {
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

        if (!workspaceId) {
          return badRequest(reply, "workspaceId is required");
        }

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

        if (body.captionId) {
          const captionResult = await query<OwnershipRow>(
            `
              SELECT id, platform_code
              FROM content.captions
              WHERE id = $1 AND workspace_id = $2
              LIMIT 1
            `,
            [body.captionId, workspaceId]
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
            captionId: body.captionId,
            connectedAccountId: body.connectedAccountId,
            idempotencyKey: body.idempotencyKey ?? randomUUID(),
            platformCode: body.platformCode,
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
