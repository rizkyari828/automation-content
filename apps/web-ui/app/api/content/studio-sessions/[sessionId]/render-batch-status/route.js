import { createJsonResponse } from "../../../../../../lib/auth/cookies.js";
import { gatewayFetchWithSession, syncGatewaySessionToResponse } from "../../../../../../lib/auth/gateway-session.js";
import { readJson } from "../../../../../../lib/auth/gateway.js";

export async function GET(request, context) {
  const resolvedParams = await context.params;
  const result = await gatewayFetchWithSession(
    request,
    `/v1/content/studio-sessions/${resolvedParams.sessionId}/render-batch-status`
  );
  const payload = await readJson(result.gatewayResponse);
  const response = createJsonResponse(payload ?? { message: "Unable to load render batch status" }, {
    status: result.gatewayResponse.status || 500
  });

  syncGatewaySessionToResponse(response, result);
  return response;
}
