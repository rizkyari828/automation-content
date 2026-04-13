import { createJsonResponse } from "../../../../../lib/auth/cookies.js";
import { gatewayFetchWithSession, syncGatewaySessionToResponse } from "../../../../../lib/auth/gateway-session.js";
import { readJson } from "../../../../../lib/auth/gateway.js";

export async function GET(request, context) {
  const resolvedParams = await context.params;
  const result = await gatewayFetchWithSession(request, `/v1/content/studio-sessions/${resolvedParams.sessionId}`);
  const payload = await readJson(result.gatewayResponse);
  const response = createJsonResponse(payload ?? { message: "Unable to load studio session" }, {
    status: result.gatewayResponse.status || 500
  });

  syncGatewaySessionToResponse(response, result);
  return response;
}

export async function PATCH(request, context) {
  const resolvedParams = await context.params;
  const body = await request.text();
  const result = await gatewayFetchWithSession(request, `/v1/content/studio-sessions/${resolvedParams.sessionId}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json"
    },
    body
  });
  const payload = await readJson(result.gatewayResponse);
  const response = createJsonResponse(payload ?? { message: "Unable to update studio session" }, {
    status: result.gatewayResponse.status || 500
  });

  syncGatewaySessionToResponse(response, result);
  return response;
}
