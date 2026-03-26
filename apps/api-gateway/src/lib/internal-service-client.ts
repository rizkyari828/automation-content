import { buildInternalContextHeaders, createRequestContext } from "@creatorflow/logger";
import type { FastifyRequest } from "fastify";
import { getConfig } from "../config.js";
import { createInternalServiceToken } from "./auth.js";

type DownstreamServiceName = "media-processing-service" | "publishing-service";

type DownstreamServiceTarget = {
  audience: string;
  baseUrl: string;
  serviceName: DownstreamServiceName;
};

type InternalServiceRequestOptions = {
  body?: unknown;
  headers?: Record<string, string>;
  method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  path: string;
  scope?: string[];
  service: DownstreamServiceName;
  timeoutMs?: number;
};

type InternalServiceResponse<T> = {
  data: T;
  status: number;
};

export class DownstreamServiceError extends Error {
  readonly responseBody: unknown;
  readonly service: DownstreamServiceName;
  readonly statusCode: number;

  constructor(input: {
    message: string;
    responseBody: unknown;
    service: DownstreamServiceName;
    statusCode: number;
  }) {
    super(input.message);
    this.name = "DownstreamServiceError";
    this.responseBody = input.responseBody;
    this.service = input.service;
    this.statusCode = input.statusCode;
  }
}

export async function callInternalService<T>(
  request: FastifyRequest,
  options: InternalServiceRequestOptions
): Promise<InternalServiceResponse<T>> {
  const method = options.method ?? "GET";
  const timeoutMs = options.timeoutMs ?? 5_000;
  const target = getDownstreamTarget(options.service);
  const requestContext = getOutboundRequestContext(request);
  const accessToken = await createInternalServiceToken({
    audience: target.audience,
    scope: options.scope,
    serviceName: getConfig().serviceName
  });
  const url = createDownstreamUrl(target.baseUrl, options.path);
  const headers: Record<string, string> = {
    accept: "application/json",
    authorization: `Bearer ${accessToken}`,
    ...buildInternalContextHeaders(requestContext),
    ...options.headers
  };

  let body: string | undefined;
  if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    headers["content-type"] = "application/json";
  }

  request.log.info(
    {
      correlationId: requestContext.correlationId,
      downstreamMethod: method,
      downstreamPath: options.path,
      downstreamService: target.serviceName
    },
    "downstream request started"
  );

  let response: Response;

  try {
    response = await fetch(url, {
      body,
      headers,
      method,
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    request.log.error(
      {
        correlationId: requestContext.correlationId,
        downstreamMethod: method,
        downstreamPath: options.path,
        downstreamService: target.serviceName,
        errorMessage
      },
      "downstream request failed"
    );

    throw new DownstreamServiceError({
      message: `Failed to reach ${target.serviceName}`,
      responseBody: { error: errorMessage },
      service: target.serviceName,
      statusCode: 502
    });
  }

  const responseData = await readResponseBody(response);

  if (!response.ok) {
    request.log.error(
      {
        correlationId: requestContext.correlationId,
        downstreamMethod: method,
        downstreamPath: options.path,
        downstreamService: target.serviceName,
        errorMessage: `Downstream responded with ${response.status}`,
        httpStatusCode: response.status
      },
      "downstream request returned error"
    );

    throw new DownstreamServiceError({
      message: `${target.serviceName} returned ${response.status}`,
      responseBody: responseData,
      service: target.serviceName,
      statusCode: response.status
    });
  }

  request.log.info(
    {
      correlationId: requestContext.correlationId,
      downstreamMethod: method,
      downstreamPath: options.path,
      downstreamService: target.serviceName,
      httpStatusCode: response.status
    },
    "downstream request completed"
  );

  return {
    data: responseData as T,
    status: response.status
  };
}

function getDownstreamTarget(service: DownstreamServiceName): DownstreamServiceTarget {
  const config = getConfig();

  if (service === "media-processing-service") {
    return {
      audience: config.mediaProcessingServiceAudience,
      baseUrl: config.mediaProcessingServiceBaseUrl,
      serviceName: service
    };
  }

  return {
    audience: config.publishingServiceAudience,
    baseUrl: config.publishingServiceBaseUrl,
    serviceName: service
  };
}

function getOutboundRequestContext(request: FastifyRequest) {
  const baseRequestContext = request.requestContext ?? createRequestContext(request.headers, {
    requestId: request.id
  });

  return {
    actorId:
      request.userAuth?.userId ??
      request.serviceAuth?.serviceName ??
      baseRequestContext.actorId,
    actorType:
      request.userAuth ? "user" : request.serviceAuth ? "service" : baseRequestContext.actorType,
    correlationId: baseRequestContext.correlationId,
    requestId: baseRequestContext.requestId,
    workspaceId: request.userAuth?.workspaceId ?? baseRequestContext.workspaceId
  };
}

function createDownstreamUrl(baseUrl: string, path: string) {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  return new URL(normalizedPath, normalizedBaseUrl).toString();
}

async function readResponseBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
