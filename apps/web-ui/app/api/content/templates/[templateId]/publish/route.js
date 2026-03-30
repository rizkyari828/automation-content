import { createJsonResponse } from "../../../../../../lib/auth/cookies.js";
import { gatewayFetchWithSession, syncGatewaySessionToResponse } from "../../../../../../lib/auth/gateway-session.js";
import { readJson } from "../../../../../../lib/auth/gateway.js";

export async function POST(request, { params }) {
  const resolvedParams = await params;
  const result = await gatewayFetchWithSession(request, `/v1/content/templates/${resolvedParams.templateId}/publish`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: await request.text()
  });
  const payload = await readJson(result.gatewayResponse);
  const response = createJsonResponse(payload ?? { message: "Unable to publish content template" }, {
    status: result.gatewayResponse.status || 500
  });

  syncGatewaySessionToResponse(response, result);
  return response;
}
