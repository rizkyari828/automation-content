import { createJsonResponse } from "../../../../lib/auth/cookies.js";
import { gatewayFetchWithSession, syncGatewaySessionToResponse } from "../../../../lib/auth/gateway-session.js";
import { readJson } from "../../../../lib/auth/gateway.js";

export async function GET(request) {
  const result = await gatewayFetchWithSession(request, "/v1/workspace/members");
  const payload = await readJson(result.gatewayResponse);
  const response = createJsonResponse(payload ?? { message: "Unable to load workspace members" }, {
    status: result.gatewayResponse.status || 500
  });

  syncGatewaySessionToResponse(response, result);
  return response;
}
