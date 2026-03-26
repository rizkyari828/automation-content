const DEFAULT_API_GATEWAY_SERVER_BASE_URL = "http://localhost:4000";
const DEFAULT_ACCESS_TOKEN_COOKIE_NAME = "creatorflow_access_token";
const DEFAULT_REFRESH_TOKEN_COOKIE_NAME = "creatorflow_refresh_token";
const DEFAULT_ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS = 15 * 60;

export function getAuthConfig() {
  return {
    accessTokenCookieName:
      process.env.ACCESS_TOKEN_COOKIE_NAME ?? DEFAULT_ACCESS_TOKEN_COOKIE_NAME,
    accessTokenCookieMaxAgeSeconds: Number(
      process.env.ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS ??
        DEFAULT_ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS
    ),
    apiGatewayServerBaseUrl:
      process.env.API_GATEWAY_SERVER_BASE_URL ?? DEFAULT_API_GATEWAY_SERVER_BASE_URL,
    cookieSecure: process.env.AUTH_COOKIE_SECURE === "true",
    refreshTokenCookieName:
      process.env.REFRESH_TOKEN_COOKIE_NAME ?? DEFAULT_REFRESH_TOKEN_COOKIE_NAME
  };
}

export function createApiGatewayUrl(pathname) {
  return new URL(pathname, getAuthConfig().apiGatewayServerBaseUrl).toString();
}
