type AppConfig = {
  accessTokenSecret: string;
  accessTokenIssuer: string;
  accessTokenAudience: string;
  accessTokenExpiresIn: string;
  databaseUrl: string;
  mediaProcessingServiceAudience: string;
  mediaProcessingServiceBaseUrl: string;
  internalServiceAudience: string;
  internalTokenBootstrapSecret: string;
  internalServiceExpiresIn: string;
  internalServiceIssuer: string;
  internalServiceSecret: string;
  publishingServiceAudience: string;
  publishingServiceBaseUrl: string;
  refreshTokenCookieName: string;
  refreshTokenMaxAgeSeconds: number;
  refreshTokenSecure: boolean;
  serviceName: string;
  uploadUrlBase: string;
  storageBucket: string;
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
    databaseUrl:
      process.env.DATABASE_URL ?? "postgresql://creatorflow:creatorflow@localhost:5433/creatorflow",
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
    publishingServiceAudience:
      process.env.PUBLISHING_SERVICE_AUDIENCE ?? "creatorflow-publishing-service",
    publishingServiceBaseUrl:
      process.env.PUBLISHING_SERVICE_BASE_URL ?? "http://127.0.0.1:4200",
    refreshTokenCookieName: process.env.REFRESH_TOKEN_COOKIE_NAME ?? "creatorflow_refresh_token",
    refreshTokenMaxAgeSeconds: Number(process.env.REFRESH_TOKEN_MAX_AGE_SECONDS ?? "2592000"),
    refreshTokenSecure: process.env.REFRESH_TOKEN_SECURE === "true",
    serviceName: process.env.SERVICE_NAME ?? "api-gateway",
    uploadUrlBase: process.env.UPLOAD_URL_BASE ?? "https://storage.creatorflow.local/upload",
    storageBucket: process.env.STORAGE_BUCKET ?? "creatorflow-local"
  };

  return cachedConfig;
}
