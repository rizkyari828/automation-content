import { createJsonResponse } from "../../../../../lib/auth/cookies.js";
import { gatewayFetch, readJson } from "../../../../../lib/auth/gateway.js";

export async function POST(request) {
  const body = await request.json();
  const gatewayResponse = await gatewayFetch("/v1/auth/forgot-password/reset", {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json"
    },
    method: "POST"
  });
  const payload = await readJson(gatewayResponse);

  return createJsonResponse(payload ?? { message: "Unable to reset password" }, {
    status: gatewayResponse.status || 500
  });
}
