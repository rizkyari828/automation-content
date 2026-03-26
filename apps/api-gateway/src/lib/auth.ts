import type { FastifyReply, FastifyRequest } from "fastify";
import {
  issueServiceAccessToken,
  issueUserAccessToken,
  verifyServiceAccessToken,
  verifyUserAccessToken
} from "@creatorflow/auth";
import { getConfig } from "../config.js";
import { unauthorized } from "./http.js";

export type UserAuthContext = {
  tokenType: "user";
  userId: string;
  workspaceId: string;
};

export type ServiceAuthContext = {
  scope: string[];
  serviceName: string;
  tokenType: "service";
};

export async function createUserAccessToken(input: { userId: string; workspaceId: string }) {
  const config = getConfig();
  return issueUserAccessToken(input, {
    audience: config.accessTokenAudience,
    expiresIn: config.accessTokenExpiresIn,
    issuer: config.accessTokenIssuer,
    secret: config.accessTokenSecret
  });
}

export async function createInternalServiceToken(input: {
  audience?: string;
  scope?: string[];
  serviceName: string;
}) {
  const config = getConfig();
  return issueServiceAccessToken(
    {
      scope: input.scope ?? [],
      serviceName: input.serviceName
    },
    {
      audience: input.audience ?? config.internalServiceAudience,
      expiresIn: config.internalServiceExpiresIn,
      issuer: config.internalServiceIssuer,
      secret: config.internalServiceSecret
    }
  );
}

export async function authenticateUserRequest(request: FastifyRequest, reply: FastifyReply) {
  const token = getBearerToken(request);

  if (!token) {
    return unauthorized(reply, "Missing bearer token");
  }

  try {
    const config = getConfig();
    const payload = await verifyUserAccessToken(token, {
      audience: config.accessTokenAudience,
      expiresIn: config.accessTokenExpiresIn,
      issuer: config.accessTokenIssuer,
      secret: config.accessTokenSecret
    });

    request.userAuth = {
      tokenType: "user",
      userId: payload.userId,
      workspaceId: payload.workspaceId
    };
  } catch {
    return unauthorized(reply, "Invalid or expired access token");
  }
}

export async function authenticateServiceRequest(request: FastifyRequest, reply: FastifyReply) {
  const token = getBearerToken(request);

  if (!token) {
    return unauthorized(reply, "Missing internal service token");
  }

  try {
    const config = getConfig();
    const payload = await verifyServiceAccessToken(token, {
      audience: config.internalServiceAudience,
      expiresIn: config.internalServiceExpiresIn,
      issuer: config.internalServiceIssuer,
      secret: config.internalServiceSecret
    });

    request.serviceAuth = {
      scope: payload.scope,
      serviceName: payload.serviceName,
      tokenType: "service"
    };
  } catch {
    return unauthorized(reply, "Invalid internal service token");
  }
}

export function ensureWorkspaceScope(
  request: FastifyRequest,
  reply: FastifyReply,
  workspaceId?: string
) {
  if (!request.userAuth) {
    return unauthorized(reply, "Missing user auth context");
  }

  if (workspaceId && workspaceId !== request.userAuth.workspaceId) {
    return unauthorized(reply, "Workspace access denied");
  }

  return null;
}

function getBearerToken(request: FastifyRequest) {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

declare module "fastify" {
  interface FastifyRequest {
    serviceAuth?: ServiceAuthContext;
    userAuth?: UserAuthContext;
  }
}
