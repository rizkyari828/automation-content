import { createJsonResponse } from "../../../../../lib/auth/cookies.js";
import { gatewayFetchWithSession, syncGatewaySessionToResponse } from "../../../../../lib/auth/gateway-session.js";
import { readJson } from "../../../../../lib/auth/gateway.js";

export async function POST(request) {
  const result = await gatewayFetchWithSession(request, "/v1/auth/email-verification/request", {
    method: "POST"
  });
  const payload = await readJson(result.gatewayResponse);
  const response = createJsonResponse(payload ?? { message: "Unable to send verification code" }, {
    status: result.gatewayResponse.status || 500
  });

  syncGatewaySessionToResponse(response, result);
  return response;
}
