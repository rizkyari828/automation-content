import {
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  createJsonResponse,
  syncRefreshCookieFromGateway
} from "../../../../lib/auth/cookies.js";
import { gatewayFetch } from "../../../../lib/auth/gateway.js";

export async function POST(request) {
  const gatewayResponse = await gatewayFetch("/v1/auth/logout", {
    headers: {
      cookie: request.headers.get("cookie") ?? ""
    },
    method: "POST"
  });

  const response = createJsonResponse(null, {
    status: gatewayResponse.ok ? 204 : gatewayResponse.status || 204
  });

  syncRefreshCookieFromGateway(response, gatewayResponse);
  clearAccessTokenCookie(response);
  clearRefreshTokenCookie(response);

  return response;
}
