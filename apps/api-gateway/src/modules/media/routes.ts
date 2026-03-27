import type { FastifyInstance } from "fastify";
import { authenticateUserRequest, ensureWorkspaceScope } from "../../lib/auth.js";
import { ensureWorkspacePermission } from "../../lib/authorization.js";
import {
  DownstreamServiceError,
  callInternalService
} from "../../lib/internal-service-client.js";
import { badRequest, internalError, notFound } from "../../lib/http.js";
import { query } from "../../lib/database.js";

type RenderJobResponse = {
  completedAt?: string;
  jobId: string;
  lastErrorMessage?: string;
  outputAssetId?: string;
  startedAt?: string;
  status: string;
  workspaceId?: string;
};

type AssetOwnershipRow = {
  id: string;
};

export function registerMediaRoutes(app: FastifyInstance) {
  app.post("/v1/media/render-jobs", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const body = request.body as {
      scriptId?: string;
      sourceAssetId?: string;
      workspaceId?: string;
    };

    if (!body.sourceAssetId) {
      return badRequest(reply, "sourceAssetId is required");
    }

    try {
      const workspaceId = body.workspaceId ?? request.userAuth?.workspaceId;
      const workspaceError = ensureWorkspaceScope(request, reply, workspaceId);
      if (workspaceError) {
        return workspaceError;
      }

      const permissionError = await ensureWorkspacePermission(request, reply, {
        feature: "media",
        permission: "media.render"
      });
      if (permissionError) {
        return permissionError;
      }

      if (!workspaceId || !request.userAuth) {
        return badRequest(reply, "workspaceId is required");
      }

      const assetResult = await query<AssetOwnershipRow>(
        `
          SELECT id
          FROM asset.assets
          WHERE id = $1 AND workspace_id = $2
          LIMIT 1
        `,
        [body.sourceAssetId, workspaceId]
      );

      if (!assetResult.rows[0]) {
        return notFound(reply, "Source asset was not found in the active workspace");
      }

      if (body.scriptId) {
        const scriptResult = await query<AssetOwnershipRow>(
          `
            SELECT id
            FROM content.scripts
            WHERE id = $1 AND workspace_id = $2
            LIMIT 1
          `,
          [body.scriptId, workspaceId]
        );

        if (!scriptResult.rows[0]) {
          return notFound(reply, "Script was not found in the active workspace");
        }
      }

      const result = await callInternalService<RenderJobResponse>(request, {
        body: {
          requestedByUserId: request.userAuth.userId,
          scriptId: body.scriptId,
          sourceAssetId: body.sourceAssetId,
          workspaceId
        },
        method: "POST",
        path: "/internal/v1/render-jobs",
        scope: ["media.render.write"],
        service: "media-processing-service"
      });

      return reply.code(result.status).send(stripWorkspaceId(result.data));
    } catch (error) {
      if (error instanceof DownstreamServiceError) {
        return reply.code(error.statusCode).send(error.responseBody);
      }

      request.log.error(error);
      return internalError(reply);
    }
  });

  app.get(
    "/v1/media/render-jobs/:jobId",
    { preHandler: authenticateUserRequest },
    async (request, reply) => {
      const params = request.params as { jobId?: string };

      if (!params.jobId) {
        return badRequest(reply, "jobId is required");
      }

      try {
        const permissionError = await ensureWorkspacePermission(request, reply, {
          feature: "media",
          permission: "media.read"
        });
        if (permissionError) {
          return permissionError;
        }

        const result = await callInternalService<RenderJobResponse>(request, {
          path: `/internal/v1/render-jobs/${params.jobId}`,
          scope: ["media.render.read"],
          service: "media-processing-service"
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

function stripWorkspaceId(job: RenderJobResponse) {
  const { workspaceId: _, ...publicJob } = job;
  return publicJob;
}
