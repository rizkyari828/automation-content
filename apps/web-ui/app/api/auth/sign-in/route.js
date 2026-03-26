import { createJsonResponse, setAccessTokenCookie, syncRefreshCookieFromGateway } from "../../../../lib/auth/cookies.js";
import { gatewayFetch, readJson } from "../../../../lib/auth/gateway.js";

export async function POST(request) {
  const body = await request.json();

  const gatewayResponse = await gatewayFetch("/v1/auth/login", {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json"
    },
    method: "POST"
  });

  const payload = await readJson(gatewayResponse);

  if (!gatewayResponse.ok || !payload?.accessToken) {
    return createJsonResponse(
      payload ?? { message: "Unable to sign in" },
      { status: gatewayResponse.status || 500 }
    );
  }

  const response = createJsonResponse(
    {
      authenticated: true,
      userId: payload.userId,
      workspaceId: payload.workspaceId
    },
    { status: gatewayResponse.status }
  );

  setAccessTokenCookie(response, payload.accessToken);
  syncRefreshCookieFromGateway(response, gatewayResponse);

  return response;
}
