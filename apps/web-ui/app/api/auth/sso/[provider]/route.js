import { NextResponse } from "next/server";

import { getAuthConfig } from "../../../../../lib/auth/config.js";
import { gatewayFetch, readJson } from "../../../../../lib/auth/gateway.js";
import {
  encodeSsoContext,
  isSupportedSsoProvider,
  SSO_CONTEXT_COOKIE_NAME
} from "../../../../../lib/auth/sso.js";

const SSO_CONTEXT_MAX_AGE_SECONDS = 15 * 60;

export async function GET(request, { params }) {
  const { provider } = await params;
  const requestUrl = new URL(request.url);
  const nextPath = normalizeNextPath(requestUrl.searchParams.get("next"));
  const intent = requestUrl.searchParams.get("intent") === "register" ? "register" : "sign_in";

  if (!isSupportedSsoProvider(provider)) {
    return redirectWithError(request, {
      intent,
      message: "Provider SSO tidak didukung.",
      nextPath
    });
  }

  const callbackUrl = new URL(`/api/auth/sso/${provider}/callback`, request.url);
  const gatewayQuery = new URLSearchParams({
    intent,
    nextPath,
    redirectUri: callbackUrl.toString()
  });

  const gatewayResponse = await gatewayFetch(`/v1/auth/oauth/${provider}/start?${gatewayQuery.toString()}`);
  const payload = await readJson(gatewayResponse);

  if (!gatewayResponse.ok || !payload?.authorizationUrl) {
    return redirectWithError(request, {
      intent,
      message: payload?.message ?? "Tidak bisa memulai login SSO.",
      nextPath
    });
  }

  const response = NextResponse.redirect(payload.authorizationUrl);
  response.cookies.set(SSO_CONTEXT_COOKIE_NAME, encodeSsoContext({ intent, nextPath }), {
    httpOnly: true,
    maxAge: SSO_CONTEXT_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: getAuthConfig().cookieSecure
  });

  return response;
}

function redirectWithError(request, { intent, message, nextPath }) {
  const pathname = intent === "register" ? "/sign-up" : "/sign-in";
  const destination = new URL(pathname, request.url);
  destination.searchParams.set("error", message);

  if (pathname === "/sign-in") {
    destination.searchParams.set("next", nextPath);
  }

  return NextResponse.redirect(destination);
}

function normalizeNextPath(value) {
  return typeof value === "string" && value.startsWith("/") ? value : "/dashboard";
}
