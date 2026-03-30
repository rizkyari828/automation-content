import { NextResponse } from "next/server";

import { gatewayFetchWithSession, syncGatewaySessionToResponse } from "../../../../lib/auth/gateway-session.js";

export async function GET(request) {
  const url = new URL(request.url);
  const result = await gatewayFetchWithSession(request, `/v1/publishing/connected-accounts${url.search}`);
  const body = await result.gatewayResponse.json().catch(() => ({
    message: "Unable to load connected accounts"
  }));

  const response = NextResponse.json(body, {
    status: result.gatewayResponse.status || 500
  });
  syncGatewaySessionToResponse(response, result);
  return response;
}

export async function POST(request) {
  const payload = await request.json().catch(() => null);
  const result = await gatewayFetchWithSession(request, "/v1/publishing/connected-accounts", {
    body: payload ? JSON.stringify(payload) : undefined,
    headers: {
      "content-type": "application/json"
    },
    method: "POST"
  });

  const body = await result.gatewayResponse.json().catch(() => ({
    message: "Unable to create connected account"
  }));

  const response = NextResponse.json(body, {
    status: result.gatewayResponse.status || 500
  });
  syncGatewaySessionToResponse(response, result);
  return response;
}
