import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { PoolClient } from "pg";
import { createOpaqueToken, hashOpaqueToken } from "@creatorflow/auth";
import {
  authenticateUserRequest,
  createInternalServiceToken,
  createUserAccessToken
} from "../../lib/auth.js";
import { getConfig } from "../../config.js";
import { query, withTransaction } from "../../lib/database.js";
import { badRequest, internalError, unauthorized } from "../../lib/http.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { createWorkspaceSlug } from "../../lib/slug.js";

type UserRow = {
  email: string;
  full_name: string | null;
  id: string;
  password_hash: string;
  status: string;
};

type WorkspaceMembershipRow = {
  role_code: string;
  workspace_id: string;
  workspace_name: string;
  workspace_slug: string;
};

type RefreshSessionRow = {
  expires_at: string;
  id: string;
  replaced_by_session_id: string | null;
  revoked_at: string | null;
  rotated_at: string | null;
  token_family_id: string;
  user_id: string;
  workspace_id: string;
};

type ClientType = "native" | "web";

export function registerIdentityRoutes(app: FastifyInstance) {
  app.post("/v1/auth/register", async (request, reply) => {
    const body = getBodyObject(request) as {
      clientType?: string;
      email?: string;
      fullName?: string;
      password?: string;
      workspaceName?: string;
    };
    const clientType = resolveClientType(request, body);

    if (!body.email || !body.password || !body.workspaceName) {
      return badRequest(reply, "email, password, and workspaceName are required");
    }

    if (body.password.length < 8) {
      return badRequest(reply, "password must be at least 8 characters");
    }

    try {
      const existingUser = await query<UserRow>(
        "SELECT id, email, full_name, password_hash, status FROM identity.users WHERE email = $1 LIMIT 1",
        [body.email.toLowerCase()]
      );

      if (existingUser.rowCount && existingUser.rowCount > 0) {
        return badRequest(reply, "email is already registered");
      }

      const passwordHash = await hashPassword(body.password);

      const session = await withTransaction(async (client) => {
        const userId = await createUser(client, {
          email: body.email!.toLowerCase(),
          fullName: body.fullName ?? null,
          passwordHash
        });

        const workspaceId = await createWorkspace(client, {
          ownerUserId: userId,
          workspaceName: body.workspaceName!
        });

        await client.query(
          `
            INSERT INTO identity.memberships (
              workspace_id,
              user_id,
              role_code,
              joined_at
            )
            VALUES ($1, $2, 'owner', NOW())
          `,
          [workspaceId, userId]
        );

        return createRefreshSession(client, request, {
          userId,
          workspaceId
        });
      });

      return sendAuthSessionResponse(reply, session, clientType, 201);
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.post("/v1/auth/login", async (request, reply) => {
    const body = getBodyObject(request) as {
      clientType?: string;
      email?: string;
      password?: string;
    };
    const clientType = resolveClientType(request, body);

    if (!body.email || !body.password) {
      return badRequest(reply, "email and password are required");
    }

    try {
      const userResult = await query<UserRow>(
        "SELECT id, email, full_name, password_hash, status FROM identity.users WHERE email = $1 LIMIT 1",
        [body.email.toLowerCase()]
      );

      const user = userResult.rows[0];
      if (!user) {
        return unauthorized(reply);
      }

      const passwordOk = await verifyPassword(body.password, user.password_hash);
      if (!passwordOk) {
        return unauthorized(reply);
      }

      const workspaceResult = await query<WorkspaceMembershipRow>(
        `
          SELECT
            m.workspace_id,
            m.role_code,
            w.name AS workspace_name,
            w.slug AS workspace_slug
          FROM identity.memberships m
          INNER JOIN identity.workspaces w ON w.id = m.workspace_id
          WHERE m.user_id = $1
          ORDER BY m.created_at ASC
          LIMIT 1
        `,
        [user.id]
      );

      const workspace = workspaceResult.rows[0];
      if (!workspace) {
        return unauthorized(reply, "No workspace membership found");
      }

      const session = await withTransaction(async (client) => {
        await client.query(
          "UPDATE identity.users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1",
          [user.id]
        );

        return createRefreshSession(client, request, {
          userId: user.id,
          workspaceId: workspace.workspace_id
        });
      });

      return sendAuthSessionResponse(reply, session, clientType);
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.post("/v1/auth/refresh", async (request, reply) => {
    const body = getBodyObject(request) as {
      clientType?: string;
      refreshToken?: string;
    };
    const clientType = resolveClientType(request, body);
    const refreshToken =
      clientType === "native"
        ? typeof body.refreshToken === "string"
          ? body.refreshToken.trim()
          : ""
        : request.cookies[getConfig().refreshTokenCookieName];

    if (!refreshToken) {
      return unauthorized(reply, "Missing refresh token");
    }

    try {
      const session = await withTransaction(async (client) => {
        const currentSession = await findRefreshSessionForUpdate(client, refreshToken);

        if (!currentSession) {
          return null;
        }

        if (currentSession.revoked_at || currentSession.rotated_at || currentSession.replaced_by_session_id) {
          await revokeRefreshFamily(client, currentSession.token_family_id);
          return null;
        }

        const isExpired = new Date(currentSession.expires_at).getTime() <= Date.now();
        if (isExpired) {
          await client.query(
            "UPDATE identity.refresh_sessions SET revoked_at = NOW() WHERE id = $1",
            [currentSession.id]
          );
          return null;
        }

        const rotatedSession = await createRefreshSession(
          client,
          request,
          {
            userId: currentSession.user_id,
            workspaceId: currentSession.workspace_id
          },
          currentSession.token_family_id
        );

        await client.query(
          `
            UPDATE identity.refresh_sessions
            SET
              rotated_at = NOW(),
              last_used_at = NOW(),
              replaced_by_session_id = $2
            WHERE id = $1
          `,
          [currentSession.id, rotatedSession.sessionId]
        );

        return rotatedSession;
      });

      if (!session) {
        if (clientType === "web") {
          await clearRefreshCookie(reply);
        }
        return unauthorized(reply, "Refresh token is invalid or expired");
      }

      return sendAuthSessionResponse(reply, session, clientType);
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.post("/v1/auth/logout", async (request, reply) => {
    const body = getBodyObject(request) as {
      clientType?: string;
      refreshToken?: string;
    };
    const clientType = resolveClientType(request, body);
    const refreshToken =
      clientType === "native"
        ? typeof body.refreshToken === "string"
          ? body.refreshToken.trim()
          : ""
        : request.cookies[getConfig().refreshTokenCookieName];

    try {
      if (refreshToken) {
        const tokenHash = hashOpaqueToken(refreshToken);
        await query(
          `
            UPDATE identity.refresh_sessions
            SET revoked_at = NOW()
            WHERE token_hash = $1 AND revoked_at IS NULL
          `,
          [tokenHash]
        );
      }

      if (clientType === "web") {
        await clearRefreshCookie(reply);
      }

      if (clientType === "native") {
        return reply.send({
          clientType,
          loggedOut: true
        });
      }

      return reply.code(204).send();
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.get("/v1/me", { preHandler: authenticateUserRequest }, async (request, reply) => {
    if (!request.userAuth) {
      return unauthorized(reply);
    }

    try {
      const userResult = await query<UserRow>(
        `
          SELECT id, email, full_name, password_hash, status
          FROM identity.users
          WHERE id = $1
          LIMIT 1
        `,
        [request.userAuth.userId]
      );

      const membershipResult = await query<WorkspaceMembershipRow>(
        `
          SELECT
            m.workspace_id,
            m.role_code,
            w.name AS workspace_name,
            w.slug AS workspace_slug
          FROM identity.memberships m
          INNER JOIN identity.workspaces w ON w.id = m.workspace_id
          WHERE m.user_id = $1 AND m.workspace_id = $2
          LIMIT 1
        `,
        [request.userAuth.userId, request.userAuth.workspaceId]
      );

      const user = userResult.rows[0];
      const membership = membershipResult.rows[0];

      if (!user || !membership) {
        return unauthorized(reply, "User session is no longer valid");
      }

      return reply.send({
        user: {
          email: user.email,
          fullName: user.full_name,
          id: user.id,
          status: user.status
        },
        workspace: {
          id: membership.workspace_id,
          name: membership.workspace_name,
          roleCode: membership.role_code,
          slug: membership.workspace_slug
        }
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.post("/internal/v1/auth/service-token", async (request, reply) => {
    const body = request.body as {
      audience?: string;
      scope?: string[];
      serviceName?: string;
    };
    const bootstrapSecret = request.headers["x-internal-bootstrap-secret"];

    if (bootstrapSecret !== getConfig().internalTokenBootstrapSecret) {
      return unauthorized(reply, "Invalid internal bootstrap secret");
    }

    if (!body.serviceName) {
      return badRequest(reply, "serviceName is required");
    }

    try {
      return reply.send({
        accessToken: await createInternalServiceToken({
          audience: body.audience,
          scope: body.scope,
          serviceName: body.serviceName
        }),
        audience: body.audience ?? getConfig().internalServiceAudience,
        expiresIn: getConfig().internalServiceExpiresIn
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });
}

async function createUser(
  client: PoolClient,
  input: { email: string; fullName: string | null; passwordHash: string }
) {
  const result = await client.query<{ id: string }>(
    `
      INSERT INTO identity.users (email, full_name, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id
    `,
    [input.email, input.fullName, input.passwordHash]
  );

  return result.rows[0].id;
}

async function createWorkspace(
  client: PoolClient,
  input: { ownerUserId: string; workspaceName: string }
) {
  const result = await client.query<{ id: string }>(
    `
      INSERT INTO identity.workspaces (owner_user_id, name, slug)
      VALUES ($1, $2, $3)
      RETURNING id
    `,
    [input.ownerUserId, input.workspaceName, createWorkspaceSlug(input.workspaceName)]
  );

  return result.rows[0].id;
}

async function createRefreshSession(
  client: PoolClient,
  request: FastifyRequest,
  input: { userId: string; workspaceId: string },
  tokenFamilyId?: string
) {
  const refreshToken = createOpaqueToken();
  const sessionId = randomUUID();
  const familyId = tokenFamilyId ?? randomUUID();

  await client.query(
    `
      INSERT INTO identity.refresh_sessions (
        id,
        token_family_id,
        user_id,
        workspace_id,
        token_hash,
        user_agent,
        ip_address,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + ($8 * INTERVAL '1 second'))
    `,
    [
      sessionId,
      familyId,
      input.userId,
      input.workspaceId,
      hashOpaqueToken(refreshToken),
      request.headers["user-agent"] ?? null,
      request.ip,
      getConfig().refreshTokenMaxAgeSeconds
    ]
  );

  return {
    refreshToken,
    sessionId,
    userId: input.userId,
    workspaceId: input.workspaceId
  };
}

async function findRefreshSessionForUpdate(client: PoolClient, refreshToken: string) {
  const result = await client.query<RefreshSessionRow>(
    `
      SELECT
        id,
        token_family_id,
        user_id,
        workspace_id,
        expires_at,
        revoked_at,
        rotated_at,
        replaced_by_session_id
      FROM identity.refresh_sessions
      WHERE token_hash = $1
      LIMIT 1
      FOR UPDATE
    `,
    [hashOpaqueToken(refreshToken)]
  );

  return result.rows[0] ?? null;
}

async function revokeRefreshFamily(client: PoolClient, tokenFamilyId: string) {
  await client.query(
    `
      UPDATE identity.refresh_sessions
      SET revoked_at = NOW()
      WHERE token_family_id = $1 AND revoked_at IS NULL
    `,
    [tokenFamilyId]
  );
}

async function setRefreshCookie(reply: FastifyReply, refreshToken: string) {
  const config = getConfig();

  reply.setCookie(config.refreshTokenCookieName, refreshToken, {
    httpOnly: true,
    maxAge: config.refreshTokenMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: config.refreshTokenSecure
  });
}

async function clearRefreshCookie(reply: FastifyReply) {
  reply.clearCookie(getConfig().refreshTokenCookieName, {
    path: "/"
  });
}

function getBodyObject(request: FastifyRequest) {
  if (request.body && typeof request.body === "object" && !Array.isArray(request.body)) {
    return request.body as Record<string, unknown>;
  }

  return {};
}

function resolveClientType(request: FastifyRequest, body: Record<string, unknown>): ClientType {
  const headerValue = request.headers["x-client-type"];
  const rawClientType =
    typeof body.clientType === "string"
      ? body.clientType
      : typeof headerValue === "string"
        ? headerValue
        : Array.isArray(headerValue)
          ? headerValue[0]
          : undefined;

  return rawClientType === "native" ? "native" : "web";
}

async function sendAuthSessionResponse(
  reply: FastifyReply,
  session: { refreshToken: string; userId: string; workspaceId: string },
  clientType: ClientType,
  statusCode = 200
) {
  const config = getConfig();

  if (clientType === "web") {
    await setRefreshCookie(reply, session.refreshToken);
  }

  return reply.code(statusCode).send({
    accessToken: await createUserAccessToken(session),
    clientType,
    expiresIn: config.accessTokenExpiresIn,
    ...(clientType === "native"
      ? {
          refreshToken: session.refreshToken,
          refreshTokenExpiresIn: config.refreshTokenMaxAgeSeconds
        }
      : {}),
    tokenType: "Bearer",
    userId: session.userId,
    workspaceId: session.workspaceId
  });
}
