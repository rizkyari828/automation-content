export const REQUEST_ID_HEADER: "x-request-id";
export const CORRELATION_ID_HEADER: "x-correlation-id";
export const ACTOR_TYPE_HEADER: "x-actor-type";
export const ACTOR_ID_HEADER: "x-actor-id";
export const WORKSPACE_ID_HEADER: "x-workspace-id";
export const REDACTED_LOG_FIELDS: string[];

export type RequestContext = {
  actorId?: string;
  actorType?: string;
  correlationId: string;
  requestId: string;
  workspaceId?: string;
};

export type RequestContextDefaults = Partial<RequestContext>;

export function normalizeHeaderValue(
  value: string | string[] | undefined
): string | undefined;

export function createRequestContext(
  headers?: Record<string, string | string[] | undefined>,
  defaults?: RequestContextDefaults
): RequestContext;

export function buildInternalContextHeaders(
  requestContext?: RequestContext,
  overrides?: Record<string, string | undefined>
): Record<string, string>;

export function createLoggerBindings(options: {
  environment?: string;
  requestContext?: RequestContext;
  service: string;
  [key: string]: unknown;
}): Record<string, unknown>;
