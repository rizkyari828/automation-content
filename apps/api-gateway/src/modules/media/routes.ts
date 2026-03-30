import type { FastifyInstance } from "fastify";
import { authenticateUserRequest, ensureWorkspaceScope } from "../../lib/auth.js";
import { ensureWorkspacePermission } from "../../lib/authorization.js";
import {
  DownstreamServiceError,
  callInternalService,
  fetchInternalServiceResponse
} from "../../lib/internal-service-client.js";
import { badRequest, internalError, notFound } from "../../lib/http.js";
import { query } from "../../lib/database.js";

type RenderJobResponse = {
  completedAt?: string;
  jobId: string;
  lastErrorMessage?: string;
  outputAssetId?: string;
  preferredProvider?: string;
  providerJobId?: string;
  providerName?: string;
  renderMode?: string;
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
      aspectRatio?: string;
      durationSeconds?: number;
      preferredProvider?: string;
      prompt?: string;
      renderMode?: string;
      scriptId?: string;
      sourceAssetId?: string;
      templateRenderSpec?: Record<string, unknown>;
      options?: Record<string, unknown>;
      workspaceId?: string;
    };

    try {
      const renderMode =
        body.renderMode ??
        (body.sourceAssetId ? "template_promo" : "ai_text_to_video");
      const isTemplateRender = renderMode === "template_promo";

      if (!body.sourceAssetId && !body.prompt && !(isTemplateRender && body.templateRenderSpec)) {
        return badRequest(reply, "sourceAssetId or prompt is required");
      }

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

      if (body.sourceAssetId) {
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

      if (renderMode === "template_promo" && !body.templateRenderSpec) {
        return badRequest(reply, "templateRenderSpec is required for template_promo render jobs");
      }

      const options = {
        ...(body.options ?? {}),
        ...(body.templateRenderSpec ? { templateRenderSpec: body.templateRenderSpec } : {})
      };

      const result = await callInternalService<RenderJobResponse>(request, {
        body: {
          aspectRatio: body.aspectRatio,
          durationSeconds: body.durationSeconds,
          options,
          preferredProvider: body.preferredProvider,
          prompt: body.prompt,
          renderMode,
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

  app.get(
    "/v1/media/render-jobs/:jobId/output",
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

        const metadataResult = await callInternalService<RenderJobResponse>(request, {
          path: `/internal/v1/render-jobs/${params.jobId}`,
          scope: ["media.render.read"],
          service: "media-processing-service"
        });

        const workspaceError = ensureWorkspaceScope(request, reply, metadataResult.data.workspaceId);
        if (workspaceError) {
          return workspaceError;
        }

        const downstreamResponse = await fetchInternalServiceResponse(request, {
          headers: request.headers.range ? { range: String(request.headers.range) } : undefined,
          path: `/internal/v1/render-jobs-output/${params.jobId}`,
          scope: ["media.render.read"],
          service: "media-processing-service",
          timeoutMs: 30_000
        });

        const contentType = downstreamResponse.headers.get("content-type");
        const contentLength = downstreamResponse.headers.get("content-length");
        const contentRange = downstreamResponse.headers.get("content-range");
        const acceptRanges = downstreamResponse.headers.get("accept-ranges");
        const cacheControl = downstreamResponse.headers.get("cache-control");
        const payload = Buffer.from(await downstreamResponse.arrayBuffer());

        if (contentType) {
          reply.header("content-type", contentType);
        }
        if (contentLength) {
          reply.header("content-length", contentLength);
        }
        if (contentRange) {
          reply.header("content-range", contentRange);
        }
        if (acceptRanges) {
          reply.header("accept-ranges", acceptRanges);
        }
        if (cacheControl) {
          reply.header("cache-control", cacheControl);
        }

        return reply.code(downstreamResponse.status).send(payload);
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
    "/v1/media/render-jobs/:jobId/poster",
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

        const metadataResult = await callInternalService<RenderJobResponse>(request, {
          path: `/internal/v1/render-jobs/${params.jobId}`,
          scope: ["media.render.read"],
          service: "media-processing-service"
        });

        const workspaceError = ensureWorkspaceScope(request, reply, metadataResult.data.workspaceId);
        if (workspaceError) {
          return workspaceError;
        }

        const downstreamResponse = await fetchInternalServiceResponse(request, {
          path: `/internal/v1/render-jobs-poster/${params.jobId}`,
          scope: ["media.render.read"],
          service: "media-processing-service",
          timeoutMs: 30_000
        });

        const contentType = downstreamResponse.headers.get("content-type");
        const contentLength = downstreamResponse.headers.get("content-length");
        const cacheControl = downstreamResponse.headers.get("cache-control");
        const payload = Buffer.from(await downstreamResponse.arrayBuffer());

        if (contentType) {
          reply.header("content-type", contentType);
        }
        if (contentLength) {
          reply.header("content-length", contentLength);
        }
        if (cacheControl) {
          reply.header("cache-control", cacheControl);
        }

        return reply.code(downstreamResponse.status).send(payload);
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
