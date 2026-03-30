import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import formbody from "@fastify/formbody";
import {
  CORRELATION_ID_HEADER,
  REQUEST_ID_HEADER,
  createRequestContext
} from "@creatorflow/logger";
import type { RequestContext } from "@creatorflow/logger";
import { getConfig } from "./config.js";
import { registerAnalyticsLiteRoutes } from "./modules/analytics-lite/routes.js";
import { registerAssetRoutes } from "./modules/assets/routes.js";
import { registerContentRoutes } from "./modules/content/routes.js";
import { registerIdentityRoutes } from "./modules/identity/routes.js";
import { registerMediaRoutes } from "./modules/media/routes.js";
import { registerOpsRoutes } from "./modules/ops/routes.js";
import { registerPublishingRoutes } from "./modules/publishing/routes.js";
import { registerTrendRoutes } from "./modules/trend/routes.js";

export function buildApp() {
  const config = getConfig();
  const app = Fastify({
    logger: {
      base: {
        environment: process.env.NODE_ENV ?? "development",
        service: "api-gateway"
      },
      level: process.env.LOG_LEVEL ?? "info"
    },
    disableRequestLogging: true,
    genReqId: () => randomUUID(),
    requestIdHeader: REQUEST_ID_HEADER,
    requestIdLogLabel: "requestId"
  });

  app.decorateRequest("requestContext", undefined);

  app.addHook("onRequest", async (request, reply) => {
    const requestContext = createRequestContext(request.headers, {
      requestId: request.id
    });

    request.requestContext = requestContext;
    reply.header(REQUEST_ID_HEADER, requestContext.requestId);
    reply.header(CORRELATION_ID_HEADER, requestContext.correlationId);

    request.log.info(
      createRequestLogBindings(requestContext, {
        httpMethod: request.method,
        httpRoute: request.url,
        remoteIp: request.ip,
        userAgent: request.headers["user-agent"]
      }),
      "request started"
    );
  });

  app.addHook("onResponse", async (request, reply) => {
    request.log.info(
      createRequestLogBindings(request.requestContext, {
        durationMs: Math.round(reply.elapsedTime),
        httpMethod: request.method,
        httpRoute: request.routeOptions.url,
        httpStatusCode: reply.statusCode
      }),
      "request completed"
    );
  });

  app.addHook("onError", async (request, reply, error) => {
    request.log.error(
      createRequestLogBindings(request.requestContext, {
        durationMs: Math.round(reply.elapsedTime),
        errorMessage: error.message,
        httpMethod: request.method,
        httpRoute: request.routeOptions.url,
        httpStatusCode: reply.statusCode || 500
      }),
      "request failed"
    );
  });

  app.register(cookie);
  app.register(formbody);

  app.get("/health", async (request) => {
    const requestContext = request.requestContext ?? createRequestContext(request.headers, {
      requestId: request.id
    });

    return {
      correlationId: requestContext.correlationId,
      requestId: requestContext.requestId,
      service: "api-gateway",
      status: "ok",
      databaseUrlConfigured: Boolean(config.databaseUrl),
      refreshCookieName: config.refreshTokenCookieName
    };
  });

  app.get("/", async () => {
    return {
      name: "CreatorFlow API Gateway",
      modules: [
        "identity",
        "content",
        "asset",
        "trend-intelligence",
        "affiliate-lite",
        "billing-lite",
        "notification-lite",
        "analytics-lite"
      ]
    };
  });

  registerIdentityRoutes(app);
  registerAnalyticsLiteRoutes(app);
  registerContentRoutes(app);
  registerAssetRoutes(app);
  registerTrendRoutes(app);
  registerMediaRoutes(app);
  registerPublishingRoutes(app);
  registerOpsRoutes(app);

  return app;
}

function createRequestLogBindings(
  requestContext: RequestContext | undefined,
  fields: Record<string, unknown>
) {
  return {
    actorId: requestContext?.actorId,
    actorType: requestContext?.actorType,
    correlationId: requestContext?.correlationId,
    workspaceId: requestContext?.workspaceId,
    ...fields
  };
}
