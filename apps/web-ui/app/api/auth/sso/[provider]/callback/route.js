import { NextResponse } from "next/server";

import {
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  setAccessTokenCookie,
  syncRefreshCookieFromGateway
} from "../../../../../../lib/auth/cookies.js";
import { getAuthConfig } from "../../../../../../lib/auth/config.js";
import { gatewayFetch, readJson } from "../../../../../../lib/auth/gateway.js";
import {
  decodeSsoContext,
  isSupportedSsoProvider,
  SSO_CONTEXT_COOKIE_NAME
} from "../../../../../../lib/auth/sso.js";

export async function GET(request, context) {
  return handleCallback(request, context, readSearchParams(request));
}

export async function POST(request, context) {
  const formData = await request.formData();

  return handleCallback(request, context, {
    code: stringValue(formData.get("code")),
    error: stringValue(formData.get("error")),
    errorDescription: stringValue(formData.get("error_description")),
    state: stringValue(formData.get("state")),
    user: stringValue(formData.get("user"))
  });
}

async function handleCallback(request, { params }, payload) {
  const { provider } = await params;
  const ssoContext = decodeSsoContext(request.cookies.get(SSO_CONTEXT_COOKIE_NAME)?.value);
  const intent = ssoContext?.intent ?? "sign_in";
  const nextPath = ssoContext?.nextPath ?? "/dashboard";

  if (!isSupportedSsoProvider(provider)) {
    return redirectBack(request, {
      intent,
      message: "Provider SSO tidak didukung.",
      nextPath
    });
  }

  if (payload.error) {
    return redirectBack(request, {
      intent,
      message: payload.errorDescription ?? payload.error,
      nextPath
    });
  }

  if (!payload.code || !payload.state) {
    return redirectBack(request, {
      intent,
      message: "Callback SSO tidak lengkap.",
      nextPath
    });
  }

  const gatewayResponse = await gatewayFetch(`/v1/auth/oauth/${provider}/callback`, {
    body: JSON.stringify({
      code: payload.code,
      oauthUser: payload.user,
      state: payload.state
    }),
    headers: {
      "content-type": "application/json"
    },
    method: "POST"
  });
  const gatewayPayload = await readJson(gatewayResponse);

  if (!gatewayResponse.ok || !gatewayPayload?.accessToken) {
    return redirectBack(request, {
      intent,
      message: gatewayPayload?.message ?? "Tidak bisa menyelesaikan login SSO.",
      nextPath
    });
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url));
  setAccessTokenCookie(response, gatewayPayload.accessToken);
  syncRefreshCookieFromGateway(response, gatewayResponse);
  clearSsoContextCookie(response);

  return response;
}

function redirectBack(request, { intent, message, nextPath }) {
  const pathname = intent === "register" ? "/sign-up" : "/sign-in";
  const destination = new URL(pathname, request.url);
  destination.searchParams.set("error", message);

  if (pathname === "/sign-in") {
    destination.searchParams.set("next", nextPath);
  }

  const response = NextResponse.redirect(destination);
  clearAccessTokenCookie(response);
  clearRefreshTokenCookie(response);
  clearSsoContextCookie(response);

  return response;
}

function clearSsoContextCookie(response) {
  response.cookies.set(SSO_CONTEXT_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: getAuthConfig().cookieSecure
  });
}

function readSearchParams(request) {
  const url = new URL(request.url);

  return {
    code: url.searchParams.get("code"),
    error: url.searchParams.get("error"),
    errorDescription: url.searchParams.get("error_description"),
    state: url.searchParams.get("state"),
    user: url.searchParams.get("user")
  };
}

function stringValue(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
