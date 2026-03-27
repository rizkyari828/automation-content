type AppConfig = {
  accessTokenSecret: string;
  accessTokenIssuer: string;
  accessTokenAudience: string;
  accessTokenExpiresIn: string;
  appWebBaseUrl: string;
  appleOAuthClientId: string;
  appleOAuthClientSecret: string;
  authEmailFrom: string;
  authOtpMaxAgeSeconds: number;
  databaseUrl: string;
  facebookOAuthClientId: string;
  facebookOAuthClientSecret: string;
  googleOAuthClientId: string;
  googleOAuthClientSecret: string;
  mediaProcessingServiceAudience: string;
  mediaProcessingServiceBaseUrl: string;
  internalServiceAudience: string;
  internalTokenBootstrapSecret: string;
  internalServiceExpiresIn: string;
  internalServiceIssuer: string;
  internalServiceSecret: string;
  oauthFlowMaxAgeSeconds: number;
  passwordResetOtpMaxAgeSeconds: number;
  publishingServiceAudience: string;
  publishingServiceBaseUrl: string;
  refreshTokenCookieName: string;
  refreshTokenMaxAgeSeconds: number;
  refreshTokenSecure: boolean;
  resendApiKey: string;
  serviceName: string;
  ssoPlaceholderEmailDomain: string;
  uploadUrlBase: string;
  storageBucket: string;
  twitterOAuthClientId: string;
  twitterOAuthClientSecret: string;
};

let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET ?? "creatorflow-dev-secret",
    accessTokenIssuer: process.env.ACCESS_TOKEN_ISSUER ?? "creatorflow-api-gateway",
    accessTokenAudience: process.env.ACCESS_TOKEN_AUDIENCE ?? "creatorflow-clients",
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m",
    appWebBaseUrl: process.env.APP_WEB_BASE_URL ?? "http://localhost:3000",
    appleOAuthClientId: process.env.APPLE_OAUTH_CLIENT_ID ?? "",
    appleOAuthClientSecret: process.env.APPLE_OAUTH_CLIENT_SECRET ?? "",
    authEmailFrom: process.env.AUTH_EMAIL_FROM ?? "auth@notify.creatorflow.local",
    authOtpMaxAgeSeconds: Number(process.env.AUTH_OTP_MAX_AGE_SECONDS ?? "900"),
    databaseUrl:
      process.env.DATABASE_URL ?? "postgresql://creatorflow:creatorflow@localhost:5433/creatorflow",
    facebookOAuthClientId: process.env.FACEBOOK_OAUTH_CLIENT_ID ?? "",
    facebookOAuthClientSecret: process.env.FACEBOOK_OAUTH_CLIENT_SECRET ?? "",
    googleOAuthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
    googleOAuthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
    mediaProcessingServiceAudience:
      process.env.MEDIA_PROCESSING_SERVICE_AUDIENCE ?? "creatorflow-media-processing-service",
    mediaProcessingServiceBaseUrl:
      process.env.MEDIA_PROCESSING_SERVICE_BASE_URL ?? "http://127.0.0.1:4100",
    internalServiceAudience: process.env.INTERNAL_SERVICE_AUDIENCE ?? "creatorflow-internal",
    internalTokenBootstrapSecret:
      process.env.INTERNAL_TOKEN_BOOTSTRAP_SECRET ?? "creatorflow-internal-bootstrap-secret",
    internalServiceExpiresIn: process.env.INTERNAL_SERVICE_EXPIRES_IN ?? "5m",
    internalServiceIssuer: process.env.INTERNAL_SERVICE_ISSUER ?? "creatorflow-api-gateway",
    internalServiceSecret: process.env.INTERNAL_SERVICE_SECRET ?? "creatorflow-internal-dev-secret",
    oauthFlowMaxAgeSeconds: Number(process.env.OAUTH_FLOW_MAX_AGE_SECONDS ?? "600"),
    passwordResetOtpMaxAgeSeconds: Number(
      process.env.PASSWORD_RESET_OTP_MAX_AGE_SECONDS ?? "900"
    ),
    publishingServiceAudience:
      process.env.PUBLISHING_SERVICE_AUDIENCE ?? "creatorflow-publishing-service",
    publishingServiceBaseUrl:
      process.env.PUBLISHING_SERVICE_BASE_URL ?? "http://127.0.0.1:4200",
    refreshTokenCookieName: process.env.REFRESH_TOKEN_COOKIE_NAME ?? "creatorflow_refresh_token",
    refreshTokenMaxAgeSeconds: Number(process.env.REFRESH_TOKEN_MAX_AGE_SECONDS ?? "2592000"),
    refreshTokenSecure: process.env.REFRESH_TOKEN_SECURE === "true",
    resendApiKey: process.env.RESEND_API_KEY ?? "",
    serviceName: process.env.SERVICE_NAME ?? "api-gateway",
    ssoPlaceholderEmailDomain:
      process.env.SSO_PLACEHOLDER_EMAIL_DOMAIN ?? "sso.creatorflow.local",
    uploadUrlBase: process.env.UPLOAD_URL_BASE ?? "https://storage.creatorflow.local/upload",
    storageBucket: process.env.STORAGE_BUCKET ?? "creatorflow-local",
    twitterOAuthClientId: process.env.TWITTER_OAUTH_CLIENT_ID ?? "",
    twitterOAuthClientSecret: process.env.TWITTER_OAUTH_CLIENT_SECRET ?? ""
  };

  return cachedConfig;
}
