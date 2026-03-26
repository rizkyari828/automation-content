import {
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  createJsonResponse,
  setAccessTokenCookie,
  syncRefreshCookieFromGateway
} from "../../../../lib/auth/cookies.js";
import { getAuthConfig } from "../../../../lib/auth/config.js";
import { gatewayFetch, readJson } from "../../../../lib/auth/gateway.js";

export async function GET(request) {
  const accessToken = request.cookies.get(getAuthConfig().accessTokenCookieName)?.value;

  const sessionResponse = await resolveSession(request, accessToken);
  return sessionResponse;
}

async function resolveSession(request, accessToken) {
  const forwardedCookie = request.headers.get("cookie") ?? "";

  if (accessToken) {
    const meResponse = await gatewayFetch("/v1/me", {
      headers: {
        authorization: `Bearer ${accessToken}`,
        cookie: forwardedCookie
      }
    });

    if (meResponse.ok) {
      const payload = await readJson(meResponse);
      return createJsonResponse({
        authenticated: true,
        ...payload
      });
    }
  }

  const refreshResponse = await gatewayFetch("/v1/auth/refresh", {
    headers: {
      cookie: forwardedCookie
    },
    method: "POST"
  });

  const refreshPayload = await readJson(refreshResponse);

  if (!refreshResponse.ok || !refreshPayload?.accessToken) {
    const response = createJsonResponse(
      {
        authenticated: false,
        message: refreshPayload?.message ?? "Session expired"
      },
      { status: 401 }
    );

    clearAccessTokenCookie(response);
    clearRefreshTokenCookie(response);

    return response;
  }

  const meResponse = await gatewayFetch("/v1/me", {
    headers: {
      authorization: `Bearer ${refreshPayload.accessToken}`,
      cookie: forwardedCookie
    }
  });

  const mePayload = await readJson(meResponse);

  if (!meResponse.ok || !mePayload?.user || !mePayload?.workspace) {
    const response = createJsonResponse(
      {
        authenticated: false,
        message: mePayload?.message ?? "Unable to load session"
      },
      { status: meResponse.status || 500 }
    );

    clearAccessTokenCookie(response);
    return response;
  }

  const response = createJsonResponse({
    authenticated: true,
    ...mePayload
  });

  setAccessTokenCookie(response, refreshPayload.accessToken);
  syncRefreshCookieFromGateway(response, refreshResponse);

  return response;
}
