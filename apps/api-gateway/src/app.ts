import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { getConfig } from "./config.js";
import { registerAssetRoutes } from "./modules/assets/routes.js";
import { registerContentRoutes } from "./modules/content/routes.js";
import { registerIdentityRoutes } from "./modules/identity/routes.js";
import { registerTrendRoutes } from "./modules/trend/routes.js";

export function buildApp() {
  const config = getConfig();
  const app = Fastify({ logger: true });

  app.register(cookie);

  app.get("/health", async () => {
    return {
      service: "api-gateway",
      status: "ok",
      databaseUrlConfigured: Boolean(config.databaseUrl),
      refreshCookieName: config.refreshTokenCookieName
    };
  });

  app.get("/", async () => {
    return {
      name: "CreatorFlow API Gateway",
      modules: [
        "identity",
        "content",
        "asset",
        "trend-intelligence",
        "affiliate-lite",
        "billing-lite",
        "notification-lite",
        "analytics-lite"
      ]
    };
  });

  registerIdentityRoutes(app);
  registerContentRoutes(app);
  registerAssetRoutes(app);
  registerTrendRoutes(app);

  return app;
}
