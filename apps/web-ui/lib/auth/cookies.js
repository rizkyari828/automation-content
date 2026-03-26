import { NextResponse } from "next/server";

import { getAuthConfig } from "./config.js";

export function createJsonResponse(payload, init) {
  return NextResponse.json(payload, init);
}

export function setAccessTokenCookie(response, accessToken) {
  const config = getAuthConfig();

  response.cookies.set(config.accessTokenCookieName, accessToken, {
    httpOnly: true,
    maxAge: config.accessTokenCookieMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: config.cookieSecure
  });
}

export function clearAccessTokenCookie(response) {
  response.cookies.set(getAuthConfig().accessTokenCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: getAuthConfig().cookieSecure
  });
}

export function clearRefreshTokenCookie(response) {
  response.cookies.set(getAuthConfig().refreshTokenCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: getAuthConfig().cookieSecure
  });
}

export function syncRefreshCookieFromGateway(response, gatewayResponse) {
  const config = getAuthConfig();
  const setCookieHeader = gatewayResponse.headers.get("set-cookie");

  if (!setCookieHeader) {
    return;
  }

  const refreshCookiePrefix = `${config.refreshTokenCookieName}=`;
  const refreshCookieEntry = setCookieHeader
    .split(/,(?=[^;]+=[^;]+)/)
    .find((entry) => entry.trim().startsWith(refreshCookiePrefix));

  if (!refreshCookieEntry) {
    return;
  }

  const [pair] = refreshCookieEntry.split(";");
  const value = pair.slice(refreshCookiePrefix.length);
  const maxAgeMatch = /Max-Age=(\d+)/i.exec(refreshCookieEntry);

  response.cookies.set(config.refreshTokenCookieName, value, {
    httpOnly: true,
    maxAge: maxAgeMatch ? Number(maxAgeMatch[1]) : undefined,
    path: "/",
    sameSite: "lax",
    secure: config.cookieSecure
  });
}
