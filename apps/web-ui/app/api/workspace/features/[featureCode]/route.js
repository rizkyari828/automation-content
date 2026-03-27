import { createJsonResponse } from "../../../../../lib/auth/cookies.js";
import { gatewayFetchWithSession, syncGatewaySessionToResponse } from "../../../../../lib/auth/gateway-session.js";
import { readJson } from "../../../../../lib/auth/gateway.js";

export async function PATCH(request, context) {
  const body = await request.json();
  const featureCode = context?.params?.featureCode;
  const result = await gatewayFetchWithSession(request, `/v1/workspace/features/${featureCode}`, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json"
    },
    method: "PATCH"
  });
  const payload = await readJson(result.gatewayResponse);
  const response = createJsonResponse(payload ?? { message: "Unable to update workspace feature" }, {
    status: result.gatewayResponse.status || 500
  });

  syncGatewaySessionToResponse(response, result);
  return response;
}
