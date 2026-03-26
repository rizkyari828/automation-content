import type { RequestContext } from "@creatorflow/logger";

declare module "fastify" {
  interface FastifyRequest {
    requestContext?: RequestContext;
  }
}
