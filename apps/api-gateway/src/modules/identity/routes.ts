import { randomInt, randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { PoolClient } from "pg";
import { createOpaqueToken, hashOpaqueToken } from "@creatorflow/auth";
import {
  authenticateUserRequest,
  createInternalServiceToken,
  createUserAccessToken
} from "../../lib/auth.js";
import {
  ensureWorkspacePermission,
  getRequestAuthorization,
  seedDefaultWorkspaceFeatures,
  WORKSPACE_FEATURE_CODES,
  WORKSPACE_ROLE_CODES,
  type ResolvedUserAuthorization
} from "../../lib/authorization.js";
import { getConfig } from "../../config.js";
import { query, withTransaction } from "../../lib/database.js";
import { badRequest, internalError, notFound, unauthorized } from "../../lib/http.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { createWorkspaceSlug } from "../../lib/slug.js";
import { sendAuthCodeEmail } from "../notification-lite/email.js";
import {
  createOAuthAuthorizationRequest,
  exchangeOAuthCodeForProfile,
  isOAuthProviderCode,
  type OAuthProviderCode,
  type OAuthProviderProfile
} from "./oauth.js";

type UserRow = {
  about_text: string | null;
  email: string;
  email_verified_at: string | null;
  full_name: string | null;
  id: string;
  last_login_at: string | null;
  password_hash: string;
  status: string;
};

type WorkspaceMembershipRow = {
  role_code: string;
  workspace_id: string;
  workspace_name: string;
  workspace_slug: string;
};

type WorkspaceFeatureDetailRow = {
  configured_by_email: string | null;
  configured_by_user_id: string | null;
  feature_code: string;
  is_enabled: boolean;
  updated_at: string;
};

type WorkspaceMemberDetailRow = {
  joined_at: string | null;
  membership_id: string;
  role_code: string;
  user_email: string;
  user_full_name: string | null;
  user_id: string;
  user_status: string;
};

type WorkspaceMemberForUpdateRow = {
  membership_id: string;
  role_code: string;
  user_id: string;
  workspace_owner_user_id: string;
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

type ExternalAccountRow = {
  avatar_url: string | null;
  created_at: string;
  last_login_at: string | null;
  provider_code: OAuthProviderCode;
  provider_email: string | null;
  provider_user_id: string;
  provider_username: string | null;
  user_id: string;
};

type AuthChallengePurpose = "reset_password" | "verify_email";

type AuthChallengeRow = {
  email: string;
  expires_at: string;
  id: string;
  purpose: AuthChallengePurpose;
  user_id: string | null;
};

type OAuthFlowRow = {
  expires_at: string;
  id: string;
  intent: string;
  next_path: string | null;
  pkce_code_verifier: string | null;
  provider_code: OAuthProviderCode;
  redirect_uri: string;
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

      try {
        await createAndDispatchAuthChallenge(request, {
          email: body.email.toLowerCase(),
          purpose: "verify_email",
          userId: session.userId
        });
      } catch (error) {
        request.log.error(error);
      }

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
        `
          SELECT
            id,
            email,
            full_name,
            password_hash,
            status,
            about_text,
            email_verified_at,
            last_login_at
          FROM identity.users
          WHERE email = $1
          LIMIT 1
        `,
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

  app.get("/v1/auth/oauth/:provider/start", async (request, reply) => {
    const params = request.params as { provider?: string };
    const queryParams = getQueryObject(request);
    const providerCode = resolveOAuthProviderCode(params.provider);
    const redirectUri = typeof queryParams.redirectUri === "string" ? queryParams.redirectUri.trim() : "";
    const nextPath = normalizeNextPath(queryParams.nextPath);

    if (!providerCode) {
      return badRequest(reply, "Unsupported SSO provider");
    }

    if (!redirectUri) {
      return badRequest(reply, "redirectUri is required");
    }

    try {
      new URL(redirectUri);
    } catch {
      return badRequest(reply, "redirectUri must be a valid absolute URL");
    }

    try {
      const { authorizationUrl, codeVerifier, stateToken } = createOAuthAuthorizationRequest({
        providerCode,
        redirectUri
      });

      await query(
        `
          INSERT INTO identity.oauth_flows (
            provider_code,
            state_token_hash,
            pkce_code_verifier,
            intent,
            redirect_uri,
            next_path,
            user_agent,
            ip_address,
            expires_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + ($9 * INTERVAL '1 second'))
        `,
        [
          providerCode,
          hashOpaqueToken(stateToken),
          codeVerifier,
          normalizeOAuthIntent(queryParams.intent),
          redirectUri,
          nextPath,
          request.headers["user-agent"] ?? null,
          request.ip,
          getConfig().oauthFlowMaxAgeSeconds
        ]
      );

      return reply.send({
        authorizationUrl,
        provider: providerCode
      });
    } catch (error) {
      request.log.error(error);
      return badRequest(reply, error instanceof Error ? error.message : "Unable to start SSO flow");
    }
  });

  app.post("/v1/auth/oauth/:provider/callback", async (request, reply) => {
    const params = request.params as { provider?: string };
    const providerCode = resolveOAuthProviderCode(params.provider);
    const body = getBodyObject(request) as {
      clientType?: string;
      code?: string;
      oauthUser?: string;
      state?: string;
    };
    const clientType = resolveClientType(request, body);
    const stateToken = typeof body.state === "string" ? body.state.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!providerCode) {
      return badRequest(reply, "Unsupported SSO provider");
    }

    if (!stateToken || !code) {
      return badRequest(reply, "state and code are required");
    }

    try {
      const flow = await findOAuthFlow(stateToken, providerCode);

      if (!flow || new Date(flow.expires_at).getTime() <= Date.now()) {
        return unauthorized(reply, "SSO flow is invalid or has expired");
      }

      const profile = await exchangeOAuthCodeForProfile({
        code,
        codeVerifier: flow.pkce_code_verifier,
        oauthUser: body.oauthUser ?? null,
        providerCode,
        redirectUri: flow.redirect_uri
      });

      const sessionResult = await withTransaction(async (client) => {
        const currentFlow = await findOAuthFlowForUpdate(client, stateToken, providerCode);

        if (!currentFlow || new Date(currentFlow.expires_at).getTime() <= Date.now()) {
          return null;
        }

        await client.query("DELETE FROM identity.oauth_flows WHERE id = $1", [currentFlow.id]);

        return continueOAuthSession(client, request, profile);
      });

      if (!sessionResult) {
        return unauthorized(reply, "SSO flow is invalid or has expired");
      }

      const response = await sendAuthSessionResponse(reply, sessionResult, clientType, 201);
      return response;
    } catch (error) {
      request.log.error(error);
      return badRequest(reply, error instanceof Error ? error.message : "Unable to finish SSO flow");
    }
  });

  app.all("/v1/auth/oauth/:provider/native-bridge", async (request, reply) => {
    const params = request.params as { provider?: string };
    const providerCode = resolveOAuthProviderCode(params.provider);
    const queryParams = getQueryObject(request);
    const nativeRedirectUri =
      typeof queryParams.nativeRedirectUri === "string"
        ? queryParams.nativeRedirectUri.trim()
        : "";
    const payload =
      request.method === "POST"
        ? getBodyObject(request)
        : getQueryObject(request);

    if (!providerCode) {
      return badRequest(reply, "Unsupported SSO provider");
    }

    if (!nativeRedirectUri) {
      return badRequest(reply, "nativeRedirectUri is required");
    }

    try {
      const destination = new URL(nativeRedirectUri);

      ([
        ["code", payload.code],
        ["error", payload.error],
        ["error_description", payload.error_description],
        ["state", payload.state],
        ["user", payload.user]
      ] as Array<[string, unknown]>).forEach(([key, value]) => {
        if (typeof value === "string" && value.trim()) {
          destination.searchParams.set(key, value.trim());
        }
      });

      return reply.redirect(destination.toString());
    } catch {
      return badRequest(reply, "nativeRedirectUri must be a valid absolute URL");
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

  app.post("/v1/auth/email-verification/request", { preHandler: authenticateUserRequest }, async (request, reply) => {
    if (!request.userAuth) {
      return unauthorized(reply);
    }

    try {
      const user = await findUserById(request.userAuth.userId);

      if (!user) {
        return unauthorized(reply, "User session is no longer valid");
      }

      if (user.email_verified_at) {
        return reply.send({
          emailVerified: true,
          message: "Email already verified"
        });
      }

      await createAndDispatchAuthChallenge(request, {
        email: user.email,
        purpose: "verify_email",
        userId: user.id
      });

      return reply.send({
        emailVerified: false,
        message: "Verification code sent"
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.post("/v1/auth/email-verification/verify", { preHandler: authenticateUserRequest }, async (request, reply) => {
    if (!request.userAuth) {
      return unauthorized(reply);
    }

    const body = getBodyObject(request) as { code?: string };
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!code) {
      return badRequest(reply, "code is required");
    }

    try {
      const verifiedAt = await withTransaction(async (client) => {
        const user = await findUserByIdForUpdate(client, request.userAuth!.userId);

        if (!user) {
          return null;
        }

        if (user.email_verified_at) {
          return user.email_verified_at;
        }

        const challenge = await consumeAuthChallenge(client, {
          code,
          email: user.email,
          purpose: "verify_email",
          userId: user.id
        });

        if (!challenge) {
          return false;
        }

        const now = new Date().toISOString();
        await client.query(
          `
            UPDATE identity.users
            SET email_verified_at = $2, updated_at = NOW()
            WHERE id = $1
          `,
          [user.id, now]
        );

        return now;
      });

      if (verifiedAt === null) {
        return unauthorized(reply, "User session is no longer valid");
      }

      if (verifiedAt === false) {
        return badRequest(reply, "Invalid or expired verification code");
      }

      return reply.send({
        emailVerified: true,
        emailVerifiedAt: verifiedAt,
        message: "Email verified"
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.post("/v1/auth/forgot-password/request", async (request, reply) => {
    const body = getBodyObject(request) as { email?: string };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return badRequest(reply, "email is required");
    }

    try {
      const user = await findUserByEmail(null, email);

      if (user) {
        await createAndDispatchAuthChallenge(request, {
          email: user.email,
          purpose: "reset_password",
          userId: user.id
        });
      }

      return reply.send({
        message: "If the email exists, a reset code has been sent"
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.post("/v1/auth/forgot-password/reset", async (request, reply) => {
    const body = getBodyObject(request) as {
      code?: string;
      email?: string;
      newPassword?: string;
    };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!email || !code || !newPassword) {
      return badRequest(reply, "email, code, and newPassword are required");
    }

    if (newPassword.length < 8) {
      return badRequest(reply, "newPassword must be at least 8 characters");
    }

    try {
      const passwordHash = await hashPassword(newPassword);
      const resetSucceeded = await withTransaction(async (client) => {
        const user = await findUserByEmail(client, email, true);

        if (!user) {
          return false;
        }

        const challenge = await consumeAuthChallenge(client, {
          code,
          email,
          purpose: "reset_password",
          userId: user.id
        });

        if (!challenge) {
          return false;
        }

        await client.query(
          `
            UPDATE identity.users
            SET password_hash = $2, updated_at = NOW()
            WHERE id = $1
          `,
          [user.id, passwordHash]
        );

        await client.query(
          `
            UPDATE identity.refresh_sessions
            SET revoked_at = NOW()
            WHERE user_id = $1 AND revoked_at IS NULL
          `,
          [user.id]
        );

        return true;
      });

      if (!resetSucceeded) {
        return badRequest(reply, "Invalid or expired reset code");
      }

      return reply.send({
        message: "Password reset successful",
        reset: true
      });
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
      const context = await loadIdentityContext(request.userAuth.userId, request.userAuth.workspaceId);
      const authorization = await getRequestAuthorization(request);

      if (!context || !authorization) {
        return unauthorized(reply, "User session is no longer valid");
      }

      return reply.send(buildSessionPayload(context.user, context.membership, authorization));
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.get("/v1/profile", { preHandler: authenticateUserRequest }, async (request, reply) => {
    if (!request.userAuth) {
      return unauthorized(reply);
    }

    try {
      const context = await loadIdentityContext(request.userAuth.userId, request.userAuth.workspaceId);
      const authorization = await getRequestAuthorization(request);

      if (!context || !authorization) {
        return unauthorized(reply, "User session is no longer valid");
      }

      const providers = await findExternalAccountsByUserId(request.userAuth.userId);
      return reply.send(buildProfilePayload(context.user, context.membership, providers, authorization));
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.patch("/v1/profile", { preHandler: authenticateUserRequest }, async (request, reply) => {
    if (!request.userAuth) {
      return unauthorized(reply);
    }

    const body = getBodyObject(request) as {
      aboutText?: string;
      fullName?: string;
      workspaceName?: string;
    };
    const fullName = normalizeOptionalString(body.fullName, 120);
    const aboutText = normalizeOptionalString(body.aboutText, 500);
    const workspaceName = normalizeOptionalString(body.workspaceName, 120);
    const shouldUpdateFullName = Object.hasOwn(body, "fullName");
    const shouldUpdateAboutText = Object.hasOwn(body, "aboutText");
    const shouldUpdateWorkspaceName = Object.hasOwn(body, "workspaceName");

    if (!shouldUpdateFullName && !shouldUpdateAboutText && !shouldUpdateWorkspaceName) {
      return badRequest(reply, "No profile updates provided");
    }

    if (shouldUpdateWorkspaceName && !workspaceName) {
      return badRequest(reply, "workspaceName cannot be empty");
    }

    try {
      const profilePermissionError = await ensureWorkspacePermission(request, reply, {
        permission: "profile.manage"
      });
      if (profilePermissionError) {
        return profilePermissionError;
      }

      if (shouldUpdateWorkspaceName) {
        const workspacePermissionError = await ensureWorkspacePermission(request, reply, {
          permission: "workspace.manage"
        });
        if (workspacePermissionError) {
          return workspacePermissionError;
        }
      }

      const updated = await withTransaction(async (client) => {
        const context = await loadIdentityContext(
          request.userAuth!.userId,
          request.userAuth!.workspaceId,
          client
        );

        if (!context) {
          return false;
        }

        if (shouldUpdateFullName || shouldUpdateAboutText) {
          await client.query(
            `
              UPDATE identity.users
              SET
                full_name = CASE WHEN $2::boolean THEN $3 ELSE full_name END,
                about_text = CASE WHEN $4::boolean THEN $5 ELSE about_text END,
                updated_at = NOW()
              WHERE id = $1
            `,
            [
              request.userAuth!.userId,
              shouldUpdateFullName,
              fullName,
              shouldUpdateAboutText,
              aboutText
            ]
          );
        }

        if (shouldUpdateWorkspaceName && workspaceName) {
          await client.query(
            `
              UPDATE identity.workspaces
              SET name = $2, updated_at = NOW()
              WHERE id = $1
            `,
            [request.userAuth!.workspaceId, workspaceName]
          );
        }

        return true;
      });

      if (!updated) {
        return unauthorized(reply, "User session is no longer valid");
      }

      const context = await loadIdentityContext(request.userAuth.userId, request.userAuth.workspaceId);
      const authorization = await getRequestAuthorization(request);

      if (!context || !authorization) {
        return unauthorized(reply, "User session is no longer valid");
      }

      const providers = await findExternalAccountsByUserId(request.userAuth.userId);
      return reply.send(buildProfilePayload(context.user, context.membership, providers, authorization));
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.get("/v1/workspace/members", { preHandler: authenticateUserRequest }, async (request, reply) => {
    if (!request.userAuth) {
      return unauthorized(reply);
    }

    try {
      const permissionError = await ensureWorkspacePermission(request, reply, {
        feature: "team",
        permission: "members.manage"
      });
      if (permissionError) {
        return permissionError;
      }

      const members = await findWorkspaceMembers(request.userAuth.workspaceId);
      return reply.send({
        items: members.map((member) => ({
          email: member.user_email,
          fullName: member.user_full_name,
          id: member.membership_id,
          joinedAt: member.joined_at,
          roleCode: member.role_code,
          status: member.user_status,
          userId: member.user_id
        }))
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.patch(
    "/v1/workspace/members/:membershipId",
    { preHandler: authenticateUserRequest },
    async (request, reply) => {
      if (!request.userAuth) {
        return unauthorized(reply);
      }

      const permissionError = await ensureWorkspacePermission(request, reply, {
        feature: "team",
        permission: "members.manage"
      });
      if (permissionError) {
        return permissionError;
      }

      const params = request.params as { membershipId?: string };
      const body = getBodyObject(request) as { roleCode?: string };
      const membershipId = typeof params.membershipId === "string" ? params.membershipId.trim() : "";
      const roleCode = typeof body.roleCode === "string" ? body.roleCode.trim() : "";

      if (!membershipId || !roleCode) {
        return badRequest(reply, "membershipId and roleCode are required");
      }

      if (!isWorkspaceRoleCode(roleCode)) {
        return badRequest(reply, "Unsupported workspace role");
      }

      try {
        const updated = await withTransaction(async (client) => {
          const membership = await findWorkspaceMemberForUpdate(
            client,
            request.userAuth!.workspaceId,
            membershipId
          );

          if (!membership) {
            return null;
          }

          if (membership.user_id === membership.workspace_owner_user_id && roleCode !== "owner") {
            return "owner-transfer-required" as const;
          }

          if (roleCode === "owner" && membership.user_id !== membership.workspace_owner_user_id) {
            return "owner-transfer-required" as const;
          }

          if (membership.role_code !== roleCode) {
            await client.query(
              `
                UPDATE identity.memberships
                SET role_code = $2, updated_at = NOW()
                WHERE id = $1
              `,
              [membershipId, roleCode]
            );
          }

          return findWorkspaceMemberForUpdate(client, request.userAuth!.workspaceId, membershipId);
        });

        if (!updated) {
          return notFound(reply, "Workspace member not found");
        }

        if (updated === "owner-transfer-required") {
          return badRequest(reply, "Owner transfer is not supported yet");
        }

        return reply.send({
          item: {
            email: updated.user_email,
            fullName: updated.user_full_name,
            id: updated.membership_id,
            joinedAt: updated.joined_at,
            roleCode: updated.role_code,
            status: updated.user_status,
            userId: updated.user_id
          },
          message: "Workspace member role updated"
        });
      } catch (error) {
        request.log.error(error);
        return internalError(reply);
      }
    }
  );

  app.get("/v1/workspace/features", { preHandler: authenticateUserRequest }, async (request, reply) => {
    if (!request.userAuth) {
      return unauthorized(reply);
    }

    try {
      const permissionError = await ensureWorkspacePermission(request, reply, {
        permission: "workspace.view"
      });
      if (permissionError) {
        return permissionError;
      }

      const features = await findWorkspaceFeatureDetails(request.userAuth.workspaceId);
      return reply.send({
        items: features.map((feature) => ({
          code: feature.feature_code,
          configuredByEmail: feature.configured_by_email,
          configuredByUserId: feature.configured_by_user_id,
          enabled: feature.is_enabled,
          updatedAt: feature.updated_at
        }))
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.patch(
    "/v1/workspace/features/:featureCode",
    { preHandler: authenticateUserRequest },
    async (request, reply) => {
      if (!request.userAuth) {
        return unauthorized(reply);
      }

      const permissionError = await ensureWorkspacePermission(request, reply, {
        permission: "features.manage"
      });
      if (permissionError) {
        return permissionError;
      }

      const params = request.params as { featureCode?: string };
      const body = getBodyObject(request) as { enabled?: boolean };
      const featureCode = typeof params.featureCode === "string" ? params.featureCode.trim() : "";

      if (!featureCode) {
        return badRequest(reply, "featureCode is required");
      }

      if (!isWorkspaceFeatureCode(featureCode)) {
        return badRequest(reply, "Unsupported workspace feature");
      }

      if (typeof body.enabled !== "boolean") {
        return badRequest(reply, "enabled must be a boolean");
      }

      try {
        await withTransaction(async (client) => {
          await client.query(
            `
              INSERT INTO identity.workspace_features (
                workspace_id,
                feature_code,
                is_enabled,
                configured_by_user_id
              )
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (workspace_id, feature_code)
              DO UPDATE SET
                is_enabled = EXCLUDED.is_enabled,
                configured_by_user_id = EXCLUDED.configured_by_user_id,
                updated_at = NOW()
            `,
            [request.userAuth!.workspaceId, featureCode, body.enabled, request.userAuth!.userId]
          );
        });

        const [feature] = await findWorkspaceFeatureDetails(request.userAuth.workspaceId, featureCode);
        if (!feature) {
          return notFound(reply, "Workspace feature not found");
        }

        return reply.send({
          item: {
            code: feature.feature_code,
            configuredByEmail: feature.configured_by_email,
            configuredByUserId: feature.configured_by_user_id,
            enabled: feature.is_enabled,
            updatedAt: feature.updated_at
          },
          message: "Workspace feature updated"
        });
      } catch (error) {
        request.log.error(error);
        return internalError(reply);
      }
    }
  );

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
  input: {
    email: string;
    emailVerifiedAt?: string | null;
    fullName: string | null;
    passwordHash: string;
  }
) {
  const result = await client.query<{ id: string }>(
    `
      INSERT INTO identity.users (email, full_name, password_hash, email_verified_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `,
    [input.email, input.fullName, input.passwordHash, input.emailVerifiedAt ?? null]
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

  await seedDefaultWorkspaceFeatures(client, result.rows[0].id, input.ownerUserId);

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

async function createAndDispatchAuthChallenge(
  request: FastifyRequest,
  input: {
    email: string;
    purpose: AuthChallengePurpose;
    userId: string | null;
  }
) {
  const code = generateAuthCode();

  await withTransaction(async (client) => {
    await client.query(
      `
        UPDATE identity.auth_challenges
        SET consumed_at = NOW()
        WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL
      `,
      [input.email, input.purpose]
    );

    await client.query(
      `
        INSERT INTO identity.auth_challenges (
          user_id,
          email,
          purpose,
          code_hash,
          expires_at,
          user_agent,
          ip_address
        )
        VALUES ($1, $2, $3, $4, NOW() + ($5 * INTERVAL '1 second'), $6, $7)
      `,
      [
        input.userId,
        input.email,
        input.purpose,
        hashOpaqueToken(code),
        resolveAuthChallengeMaxAgeSeconds(input.purpose),
        request.headers["user-agent"] ?? null,
        request.ip
      ]
    );
  });

  await sendAuthCodeEmail(request.log, {
    code,
    purpose: input.purpose,
    recipientEmail: input.email
  });
}

async function consumeAuthChallenge(
  client: PoolClient,
  input: {
    code: string;
    email: string;
    purpose: AuthChallengePurpose;
    userId: string | null;
  }
) {
  const result = await client.query<AuthChallengeRow>(
    `
      SELECT id, user_id, email, purpose, expires_at
      FROM identity.auth_challenges
      WHERE
        email = $1
        AND purpose = $2
        AND code_hash = $3
        AND consumed_at IS NULL
        AND expires_at > NOW()
        AND ($4::uuid IS NULL OR user_id = $4::uuid)
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE
    `,
    [input.email, input.purpose, hashOpaqueToken(input.code), input.userId]
  );

  const challenge = result.rows[0] ?? null;

  if (!challenge) {
    return null;
  }

  await client.query(
    `
      UPDATE identity.auth_challenges
      SET consumed_at = NOW()
      WHERE id = $1
    `,
    [challenge.id]
  );

  return challenge;
}

async function continueOAuthSession(
  client: PoolClient,
  request: FastifyRequest,
  profile: OAuthProviderProfile
) {
  const resolvedEmail = resolveOAuthEmail(profile);
  const existingAccount = await findExternalAccount(client, profile.providerCode, profile.providerUserId);

  let userId = existingAccount?.user_id ?? null;

  if (!userId) {
    const existingUser = await findUserByEmail(client, resolvedEmail);

    if (existingUser) {
      userId = existingUser.id;

      if (!existingUser.full_name && profile.fullName) {
        await client.query(
          `
            UPDATE identity.users
            SET full_name = $2, updated_at = NOW()
            WHERE id = $1
          `,
          [existingUser.id, profile.fullName]
        );
      }
    } else {
      userId = await createUser(client, {
        email: resolvedEmail,
        emailVerifiedAt: profile.emailVerified ? new Date().toISOString() : null,
        fullName: profile.fullName,
        passwordHash: await hashPassword(createOpaqueToken(32))
      });
    }
  }

  const workspace = await ensureWorkspaceMembership(client, userId, profile);

  if (existingAccount) {
    await client.query(
      `
        UPDATE identity.external_accounts
        SET
          provider_email = $3,
          provider_username = $4,
          avatar_url = $5,
          profile_json = $6::jsonb,
          last_login_at = NOW(),
          updated_at = NOW()
        WHERE provider_code = $1 AND provider_user_id = $2
      `,
      [
        profile.providerCode,
        profile.providerUserId,
        profile.email,
        profile.username,
        profile.avatarUrl,
        JSON.stringify(profile.rawProfile)
      ]
    );
  } else {
    await client.query(
      `
        INSERT INTO identity.external_accounts (
          user_id,
          provider_code,
          provider_user_id,
          provider_email,
          provider_username,
          avatar_url,
          profile_json,
          last_login_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())
      `,
      [
        userId,
        profile.providerCode,
        profile.providerUserId,
        profile.email,
        profile.username,
        profile.avatarUrl,
        JSON.stringify(profile.rawProfile)
      ]
    );
  }

  await client.query(
    `
      UPDATE identity.users
      SET
        last_login_at = NOW(),
        email_verified_at = COALESCE(email_verified_at, $2),
        updated_at = NOW()
      WHERE id = $1
    `,
    [userId, profile.emailVerified ? new Date().toISOString() : null]
  );

  return createRefreshSession(client, request, {
    userId,
    workspaceId: workspace.workspace_id
  });
}

async function ensureWorkspaceMembership(
  client: PoolClient,
  userId: string,
  profile: OAuthProviderProfile
) {
  const existingMembership = await findFirstWorkspaceMembership(client, userId);

  if (existingMembership) {
    return existingMembership;
  }

  const workspaceName = deriveWorkspaceName(profile);
  const workspaceId = await createWorkspace(client, {
    ownerUserId: userId,
    workspaceName
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

  const membership = await findFirstWorkspaceMembership(client, userId);

  if (!membership) {
    throw new Error("Unable to create default workspace for SSO account");
  }

  return membership;
}

async function findExternalAccount(
  client: PoolClient,
  providerCode: OAuthProviderCode,
  providerUserId: string
) {
  const result = await client.query<ExternalAccountRow>(
    `
      SELECT
        user_id,
        provider_code,
        provider_user_id,
        provider_email,
        provider_username
      FROM identity.external_accounts
      WHERE provider_code = $1 AND provider_user_id = $2
      LIMIT 1
    `,
    [providerCode, providerUserId]
  );

  return result.rows[0] ?? null;
}

async function findUserByEmail(client: PoolClient | null, email: string, forUpdate = false) {
  const sql = `
    SELECT
      id,
      email,
      full_name,
      password_hash,
      status,
      about_text,
      email_verified_at,
      last_login_at
    FROM identity.users
    WHERE email = $1
    LIMIT 1
    ${forUpdate ? "FOR UPDATE" : ""}
  `;
  const result = client ? await client.query<UserRow>(sql, [email]) : await query<UserRow>(sql, [email]);

  return result.rows[0] ?? null;
}

async function findUserById(userId: string) {
  const result = await query<UserRow>(
    `
      SELECT
        id,
        email,
        full_name,
        password_hash,
        status,
        about_text,
        email_verified_at,
        last_login_at
      FROM identity.users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

async function findUserByIdForUpdate(client: PoolClient, userId: string) {
  const result = await client.query<UserRow>(
    `
      SELECT
        id,
        email,
        full_name,
        password_hash,
        status,
        about_text,
        email_verified_at,
        last_login_at
      FROM identity.users
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

async function findFirstWorkspaceMembership(client: PoolClient, userId: string) {
  const result = await client.query<WorkspaceMembershipRow>(
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
    [userId]
  );

  return result.rows[0] ?? null;
}

async function findWorkspaceMembership(
  userId: string,
  workspaceId: string,
  client?: PoolClient
) {
  const sql = `
    SELECT
      m.workspace_id,
      m.role_code,
      w.name AS workspace_name,
      w.slug AS workspace_slug
    FROM identity.memberships m
    INNER JOIN identity.workspaces w ON w.id = m.workspace_id
    WHERE m.user_id = $1 AND m.workspace_id = $2
    LIMIT 1
  `;
  const result = client
    ? await client.query<WorkspaceMembershipRow>(sql, [userId, workspaceId])
    : await query<WorkspaceMembershipRow>(sql, [userId, workspaceId]);

  return result.rows[0] ?? null;
}

async function findWorkspaceMembers(workspaceId: string) {
  const result = await query<WorkspaceMemberDetailRow>(
    `
      SELECT
        m.id AS membership_id,
        m.user_id,
        m.role_code,
        m.joined_at,
        u.email AS user_email,
        u.full_name AS user_full_name,
        u.status AS user_status
      FROM identity.memberships m
      INNER JOIN identity.users u ON u.id = m.user_id
      WHERE m.workspace_id = $1
      ORDER BY
        CASE m.role_code
          WHEN 'owner' THEN 0
          WHEN 'admin' THEN 1
          WHEN 'editor' THEN 2
          ELSE 3
        END,
        COALESCE(m.joined_at, m.created_at) ASC,
        u.email ASC
    `,
    [workspaceId]
  );

  return result.rows;
}

async function findWorkspaceMemberForUpdate(
  client: PoolClient,
  workspaceId: string,
  membershipId: string
) {
  const result = await client.query<WorkspaceMemberDetailRow & WorkspaceMemberForUpdateRow>(
    `
      SELECT
        m.id AS membership_id,
        m.user_id,
        m.role_code,
        m.joined_at,
        u.email AS user_email,
        u.full_name AS user_full_name,
        u.status AS user_status,
        w.owner_user_id AS workspace_owner_user_id
      FROM identity.memberships m
      INNER JOIN identity.users u ON u.id = m.user_id
      INNER JOIN identity.workspaces w ON w.id = m.workspace_id
      WHERE m.workspace_id = $1 AND m.id = $2
      LIMIT 1
      FOR UPDATE
    `,
    [workspaceId, membershipId]
  );

  return result.rows[0] ?? null;
}

async function findWorkspaceFeatureDetails(workspaceId: string, featureCode?: string) {
  const result = await query<WorkspaceFeatureDetailRow>(
    `
      SELECT
        wf.feature_code,
        wf.is_enabled,
        wf.configured_by_user_id,
        wf.updated_at,
        u.email AS configured_by_email
      FROM identity.workspace_features wf
      LEFT JOIN identity.users u ON u.id = wf.configured_by_user_id
      WHERE wf.workspace_id = $1
      ${featureCode ? "AND wf.feature_code = $2" : ""}
      ORDER BY wf.feature_code ASC
    `,
    featureCode ? [workspaceId, featureCode] : [workspaceId]
  );

  return result.rows;
}

async function loadIdentityContext(userId: string, workspaceId: string, client?: PoolClient) {
  const user = client ? await findUserByIdForUpdate(client, userId) : await findUserById(userId);
  const membership = await findWorkspaceMembership(userId, workspaceId, client);

  if (!user || !membership) {
    return null;
  }

  return {
    membership,
    user
  };
}

async function findExternalAccountsByUserId(userId: string) {
  const result = await query<ExternalAccountRow>(
    `
      SELECT
        user_id,
        provider_code,
        provider_user_id,
        provider_email,
        provider_username,
        avatar_url,
        created_at,
        last_login_at
      FROM identity.external_accounts
      WHERE user_id = $1
      ORDER BY created_at ASC
    `,
    [userId]
  );

  return result.rows;
}

async function findOAuthFlow(stateToken: string, providerCode: OAuthProviderCode) {
  const result = await query<OAuthFlowRow>(
    `
      SELECT
        id,
        provider_code,
        pkce_code_verifier,
        intent,
        redirect_uri,
        next_path,
        expires_at
      FROM identity.oauth_flows
      WHERE state_token_hash = $1 AND provider_code = $2
      LIMIT 1
    `,
    [hashOpaqueToken(stateToken), providerCode]
  );

  return result.rows[0] ?? null;
}

async function findOAuthFlowForUpdate(
  client: PoolClient,
  stateToken: string,
  providerCode: OAuthProviderCode
) {
  const result = await client.query<OAuthFlowRow>(
    `
      SELECT
        id,
        provider_code,
        pkce_code_verifier,
        intent,
        redirect_uri,
        next_path,
        expires_at
      FROM identity.oauth_flows
      WHERE state_token_hash = $1 AND provider_code = $2
      LIMIT 1
      FOR UPDATE
    `,
    [hashOpaqueToken(stateToken), providerCode]
  );

  return result.rows[0] ?? null;
}

function buildSessionPayload(
  user: UserRow,
  membership: WorkspaceMembershipRow,
  authorization: ResolvedUserAuthorization
) {
  return {
    authorization: {
      enabledFeatureCodes: authorization.enabledFeatureCodes,
      features: authorization.features,
      permissions: authorization.permissions,
      platformRoleCode: authorization.platformRoleCode,
      workspaceRoleCode: authorization.workspaceRoleCode
    },
    user: {
      aboutText: user.about_text,
      email: user.email,
      emailVerifiedAt: user.email_verified_at,
      fullName: user.full_name,
      id: user.id,
      lastLoginAt: user.last_login_at,
      status: user.status
    },
    workspace: {
      id: membership.workspace_id,
      name: membership.workspace_name,
      roleCode: membership.role_code,
      slug: membership.workspace_slug
    }
  };
}

function buildProfilePayload(
  user: UserRow,
  membership: WorkspaceMembershipRow,
  providers: ExternalAccountRow[],
  authorization: ResolvedUserAuthorization
) {
  return {
    providers: providers.map((provider) => ({
      avatarUrl: provider.avatar_url,
      connectedAt: provider.created_at,
      email: provider.provider_email,
      lastLoginAt: provider.last_login_at,
      provider: provider.provider_code,
      username: provider.provider_username
    })),
    security: {
      emailVerified: Boolean(user.email_verified_at),
      emailVerifiedAt: user.email_verified_at,
      lastLoginAt: user.last_login_at
    },
    ...buildSessionPayload(user, membership, authorization)
  };
}

function resolveOAuthProviderCode(value?: string) {
  return value && isOAuthProviderCode(value) ? value : null;
}

function isWorkspaceFeatureCode(value: string): value is (typeof WORKSPACE_FEATURE_CODES)[number] {
  return WORKSPACE_FEATURE_CODES.includes(value as (typeof WORKSPACE_FEATURE_CODES)[number]);
}

function isWorkspaceRoleCode(value: string): value is (typeof WORKSPACE_ROLE_CODES)[number] {
  return WORKSPACE_ROLE_CODES.includes(value as (typeof WORKSPACE_ROLE_CODES)[number]);
}

function normalizeOAuthIntent(value: unknown) {
  return value === "register" ? "register" : "sign_in";
}

function normalizeNextPath(value: unknown) {
  return typeof value === "string" && value.startsWith("/") ? value : "/dashboard";
}

function deriveWorkspaceName(profile: OAuthProviderProfile) {
  if (profile.fullName) {
    return `${profile.fullName.split(" ")[0]}'s Workspace`;
  }

  if (profile.username) {
    return `${profile.username}'s Workspace`;
  }

  if (profile.email) {
    return `${profile.email.split("@")[0]}'s Workspace`;
  }

  return "CreatorFlow Workspace";
}

function resolveOAuthEmail(profile: OAuthProviderProfile) {
  if (profile.email) {
    return profile.email.toLowerCase();
  }

  const localPart = `${profile.providerCode}-${profile.providerUserId}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${localPart || profile.providerCode}@${getConfig().ssoPlaceholderEmailDomain}`;
}

function generateAuthCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function normalizeOptionalString(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().slice(0, maxLength);
  return normalized.length > 0 ? normalized : null;
}

function resolveAuthChallengeMaxAgeSeconds(purpose: AuthChallengePurpose) {
  const config = getConfig();
  return purpose === "verify_email"
    ? config.authOtpMaxAgeSeconds
    : config.passwordResetOtpMaxAgeSeconds;
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

function getQueryObject(request: FastifyRequest) {
  if (request.query && typeof request.query === "object" && !Array.isArray(request.query)) {
    return request.query as Record<string, unknown>;
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
