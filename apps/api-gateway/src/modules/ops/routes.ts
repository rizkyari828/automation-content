import type { FastifyInstance } from "fastify";
import { authenticateServiceRequest } from "../../lib/auth.js";
import {
  DownstreamServiceError,
  callInternalService
} from "../../lib/internal-service-client.js";

type DownstreamWhoAmIResponse = {
  audience: string;
  callerService: string;
  correlationId?: string;
  requestId?: string;
  scope: string[];
  service: string;
  status: string;
};

export function registerOpsRoutes(app: FastifyInstance) {
  app.get(
    "/internal/v1/observability/downstream-whoami",
    { preHandler: authenticateServiceRequest },
    async (request) => {
      const [mediaProcessingResult, publishingResult] = await Promise.allSettled([
        callInternalService<DownstreamWhoAmIResponse>(request, {
          path: "/internal/v1/whoami",
          service: "media-processing-service"
        }),
        callInternalService<DownstreamWhoAmIResponse>(request, {
          path: "/internal/v1/whoami",
          service: "publishing-service"
        })
      ]);

      return {
        correlationId: request.requestContext?.correlationId,
        requestId: request.requestContext?.requestId,
        services: {
          mediaProcessingService: serializeSettledResult(mediaProcessingResult),
          publishingService: serializeSettledResult(publishingResult)
        },
        status: "ok"
      };
    }
  );
}

function serializeSettledResult(
  result: PromiseSettledResult<{ data: DownstreamWhoAmIResponse; status: number }>
) {
  if (result.status === "fulfilled") {
    return {
      body: result.value.data,
      ok: true,
      statusCode: result.value.status
    };
  }

  const reason = result.reason;

  if (reason instanceof DownstreamServiceError) {
    return {
      body: reason.responseBody,
      error: reason.message,
      ok: false,
      service: reason.service,
      statusCode: reason.statusCode
    };
  }

  return {
    error: reason instanceof Error ? reason.message : String(reason),
    ok: false,
    statusCode: 500
  };
}
