import type { FastifyInstance } from "fastify";
import { authenticateUserRequest } from "../../lib/auth.js";
import { badRequest, internalError } from "../../lib/http.js";

const MAX_EVENT_NAME_LENGTH = 120;
const MAX_SURFACE_LENGTH = 40;
const MAX_SESSION_ID_LENGTH = 120;
const MAX_LOCALE_LENGTH = 16;
const MAX_PROPERTIES = 24;

export function registerAnalyticsLiteRoutes(app: FastifyInstance) {
  app.post("/v1/events", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const body = request.body as {
      eventName?: string;
      locale?: string;
      properties?: Record<string, unknown>;
      sessionId?: string;
      surface?: string;
    };

    if (!request.userAuth) {
      return badRequest(reply, "user auth context is required");
    }

    if (!body?.eventName || typeof body.eventName !== "string") {
      return badRequest(reply, "eventName is required");
    }

    if (body.eventName.length > MAX_EVENT_NAME_LENGTH) {
      return badRequest(reply, "eventName is too long");
    }

    if (!body?.sessionId || typeof body.sessionId !== "string") {
      return badRequest(reply, "sessionId is required");
    }

    if (body.sessionId.length > MAX_SESSION_ID_LENGTH) {
      return badRequest(reply, "sessionId is too long");
    }

    if (!body?.surface || typeof body.surface !== "string") {
      return badRequest(reply, "surface is required");
    }

    if (body.surface.length > MAX_SURFACE_LENGTH) {
      return badRequest(reply, "surface is too long");
    }

    if (body.locale && (typeof body.locale !== "string" || body.locale.length > MAX_LOCALE_LENGTH)) {
      return badRequest(reply, "locale is invalid");
    }

    try {
      const properties = sanitizeProperties(body.properties);

      request.log.info(
        {
          analyticsEvent: {
            event_name: body.eventName,
            locale: body.locale ?? null,
            occurred_at: new Date().toISOString(),
            properties,
            request_id: request.requestContext?.requestId ?? request.id,
            session_id: body.sessionId,
            surface: body.surface,
            user_id: request.userAuth.userId,
            workspace_id: request.userAuth.workspaceId
          }
        },
        "analytics event accepted"
      );

      return reply.code(202).send({
        accepted: true,
        eventName: body.eventName
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });
}

function sanitizeProperties(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(input)
      .slice(0, MAX_PROPERTIES)
      .map(([key, value]) => [key, sanitizeValue(value)])
      .filter(([, value]) => value !== undefined)
  );
}

function sanitizeValue(value: unknown): boolean | number | string | null | Array<boolean | number | string | null> | undefined {
  if (value == null) {
    return null;
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return value.slice(0, 240);
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, 12)
      .map((item) => sanitizeValue(item))
      .filter((item): item is boolean | number | string | null => item !== undefined);
  }

  return undefined;
}
