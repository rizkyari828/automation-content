import {
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  setAccessTokenCookie,
  syncRefreshCookieFromGateway
} from "./cookies.js";
import { getAuthConfig } from "./config.js";
import { gatewayFetch, readJson } from "./gateway.js";

export async function gatewayFetchWithSession(request, pathname, init = {}) {
  const forwardedCookie = request.headers.get("cookie") ?? "";
  const accessToken =
    request.cookies.get(getAuthConfig().accessTokenCookieName)?.value ?? "";

  const makeRequest = (token) =>
    gatewayFetch(pathname, {
      ...init,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        cookie: forwardedCookie,
        ...init.headers
      }
    });

  let gatewayResponse = await makeRequest(accessToken);

  if (gatewayResponse.status !== 401) {
    return { gatewayResponse };
  }

  const refreshResponse = await gatewayFetch("/v1/auth/refresh", {
    headers: {
      cookie: forwardedCookie
    },
    method: "POST"
  });
  const refreshPayload = await readJson(refreshResponse);

  if (!refreshResponse.ok || !refreshPayload?.accessToken) {
    return {
      gatewayResponse,
      refreshPayload,
      refreshResponse
    };
  }

  gatewayResponse = await makeRequest(refreshPayload.accessToken);

  return {
    gatewayResponse,
    refreshedAccessToken: refreshPayload.accessToken,
    refreshPayload,
    refreshResponse
  };
}

export function syncGatewaySessionToResponse(response, result) {
  if (result.refreshedAccessToken) {
    setAccessTokenCookie(response, result.refreshedAccessToken);
  }

  if (result.refreshResponse) {
    syncRefreshCookieFromGateway(response, result.refreshResponse);
  }

  if (result.gatewayResponse.status === 401 && !result.refreshedAccessToken) {
    clearAccessTokenCookie(response);
    clearRefreshTokenCookie(response);
  }
}
