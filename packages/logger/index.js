import { randomUUID } from "node:crypto";

export const REQUEST_ID_HEADER = "x-request-id";
export const CORRELATION_ID_HEADER = "x-correlation-id";
export const ACTOR_TYPE_HEADER = "x-actor-type";
export const ACTOR_ID_HEADER = "x-actor-id";
export const WORKSPACE_ID_HEADER = "x-workspace-id";

export const REDACTED_LOG_FIELDS = [
  "authorization",
  "cookie",
  "password",
  "passwordHash",
  "refreshToken",
  "secret",
  "token"
];

export function normalizeHeaderValue(value) {
  if (Array.isArray(value)) {
    return normalizeHeaderValue(value[0]);
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

export function createRequestContext(headers = {}, defaults = {}) {
  const requestId =
    defaults.requestId ??
    normalizeHeaderValue(headers[REQUEST_ID_HEADER]) ??
    randomUUID();
  const correlationId =
    defaults.correlationId ??
    normalizeHeaderValue(headers[CORRELATION_ID_HEADER]) ??
    requestId;
  const actorType =
    defaults.actorType ??
    normalizeHeaderValue(headers[ACTOR_TYPE_HEADER]);
  const actorId =
    defaults.actorId ??
    normalizeHeaderValue(headers[ACTOR_ID_HEADER]);
  const workspaceId =
    defaults.workspaceId ??
    normalizeHeaderValue(headers[WORKSPACE_ID_HEADER]);

  return compactFields({
    actorId,
    actorType,
    correlationId,
    requestId,
    workspaceId
  });
}

export function buildInternalContextHeaders(requestContext, overrides = {}) {
  return compactFields({
    ...overrides,
    [ACTOR_ID_HEADER]: requestContext?.actorId,
    [ACTOR_TYPE_HEADER]: requestContext?.actorType,
    [CORRELATION_ID_HEADER]: requestContext?.correlationId,
    [REQUEST_ID_HEADER]: requestContext?.requestId,
    [WORKSPACE_ID_HEADER]: requestContext?.workspaceId
  });
}

export function createLoggerBindings({ environment, requestContext, service, ...extraFields }) {
  return compactFields({
    environment,
    service,
    requestId: requestContext?.requestId,
    correlationId: requestContext?.correlationId,
    actorType: requestContext?.actorType,
    actorId: requestContext?.actorId,
    workspaceId: requestContext?.workspaceId,
    ...extraFields
  });
}

function compactFields(fields) {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined)
  );
}
