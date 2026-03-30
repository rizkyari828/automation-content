import { NextResponse } from "next/server";

import { gatewayFetchWithSession, syncGatewaySessionToResponse } from "../../../../lib/auth/gateway-session.js";

export async function POST(request) {
  const payload = await request.json().catch(() => null);
  const result = await gatewayFetchWithSession(request, "/v1/publishing/publish-jobs", {
    body: payload ? JSON.stringify(payload) : undefined,
    headers: {
      "content-type": "application/json"
    },
    method: "POST"
  });

  const body = await result.gatewayResponse.json().catch(() => ({
    message: "Unable to submit publish job"
  }));

  const response = NextResponse.json(body, {
    status: result.gatewayResponse.status || 500
  });
  syncGatewaySessionToResponse(response, result);
  return response;
}
