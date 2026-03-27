import { createJsonResponse } from "../../../../../lib/auth/cookies.js";
import { gatewayFetchWithSession, syncGatewaySessionToResponse } from "../../../../../lib/auth/gateway-session.js";
import { readJson } from "../../../../../lib/auth/gateway.js";

export async function POST(request) {
  const body = await request.json();
  const result = await gatewayFetchWithSession(request, "/v1/auth/email-verification/verify", {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json"
    },
    method: "POST"
  });
  const payload = await readJson(result.gatewayResponse);
  const response = createJsonResponse(payload ?? { message: "Unable to verify email" }, {
    status: result.gatewayResponse.status || 500
  });

  syncGatewaySessionToResponse(response, result);
  return response;
}
