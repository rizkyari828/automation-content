import { createJsonResponse } from "../../../../lib/auth/cookies.js";
import { gatewayFetchWithSession, syncGatewaySessionToResponse } from "../../../../lib/auth/gateway-session.js";
import { readJson } from "../../../../lib/auth/gateway.js";

export async function GET(request) {
  const url = new URL(request.url);
  const result = await gatewayFetchWithSession(request, `/v1/content/templates${url.search}`);
  const payload = await readJson(result.gatewayResponse);
  const response = createJsonResponse(payload ?? { message: "Unable to load content templates" }, {
    status: result.gatewayResponse.status || 500
  });

  syncGatewaySessionToResponse(response, result);
  return response;
}

export async function POST(request) {
  const body = await request.text();
  const result = await gatewayFetchWithSession(request, "/v1/content/templates", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body
  });
  const payload = await readJson(result.gatewayResponse);
  const response = createJsonResponse(payload ?? { message: "Unable to create content template" }, {
    status: result.gatewayResponse.status || 500
  });

  syncGatewaySessionToResponse(response, result);
  return response;
}
