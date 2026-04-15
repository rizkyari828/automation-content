import { createJsonResponse } from "../../../../../../../../lib/auth/cookies.js";
import { gatewayFetchWithSession, syncGatewaySessionToResponse } from "../../../../../../../../lib/auth/gateway-session.js";
import { readJson } from "../../../../../../../../lib/auth/gateway.js";

export async function POST(request, context) {
  const resolvedParams = await context.params;
  const body = await request.text();
  const result = await gatewayFetchWithSession(
    request,
    `/v1/content/studio-sessions/${resolvedParams.sessionId}/render-batch-jobs/${resolvedParams.taskId}/retry`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body
    }
  );
  const payload = await readJson(result.gatewayResponse);
  const response = createJsonResponse(payload ?? { message: "Unable to retry render batch job" }, {
    status: result.gatewayResponse.status || 500
  });

  syncGatewaySessionToResponse(response, result);
  return response;
}
