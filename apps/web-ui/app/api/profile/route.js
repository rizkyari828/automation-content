import { createJsonResponse } from "../../../lib/auth/cookies.js";
import { gatewayFetchWithSession, syncGatewaySessionToResponse } from "../../../lib/auth/gateway-session.js";
import { readJson } from "../../../lib/auth/gateway.js";

export async function GET(request) {
  const result = await gatewayFetchWithSession(request, "/v1/profile");
  const payload = await readJson(result.gatewayResponse);
  const response = createJsonResponse(payload ?? { message: "Unable to load profile" }, {
    status: result.gatewayResponse.status || 500
  });

  syncGatewaySessionToResponse(response, result);
  return response;
}

export async function PATCH(request) {
  const body = await request.json();
  const result = await gatewayFetchWithSession(request, "/v1/profile", {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json"
    },
    method: "PATCH"
  });
  const payload = await readJson(result.gatewayResponse);
  const response = createJsonResponse(payload ?? { message: "Unable to update profile" }, {
    status: result.gatewayResponse.status || 500
  });

  syncGatewaySessionToResponse(response, result);
  return response;
}
