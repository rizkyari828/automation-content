import { createJsonResponse } from "../../../../lib/auth/cookies.js";
import { gatewayFetchWithSession, syncGatewaySessionToResponse } from "../../../../lib/auth/gateway-session.js";
import { readJson } from "../../../../lib/auth/gateway.js";

export async function POST(request) {
  const body = await request.text();
  const result = await gatewayFetchWithSession(request, "/v1/assets/upload-url", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body
  });
  const payload = await readJson(result.gatewayResponse);
  const response = createJsonResponse(payload ?? { message: "Unable to prepare upload" }, {
    status: result.gatewayResponse.status || 500
  });

  syncGatewaySessionToResponse(response, result);
  return response;
}
