import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { getConfig } from "../../config.js";
import { authenticateUserRequest, ensureWorkspaceScope } from "../../lib/auth.js";
import { query, withTransaction } from "../../lib/database.js";
import { badRequest, internalError } from "../../lib/http.js";
import { sanitizeFileName } from "../../lib/slug.js";

export function registerAssetRoutes(app: FastifyInstance) {
  app.post("/v1/assets/upload-url", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const body = request.body as {
      workspaceId?: string;
      assetType?: string;
      fileName?: string;
      mimeType?: string;
      fileSizeBytes?: number;
    };

    if (!body.assetType || !body.fileName) {
      return badRequest(reply, "assetType and fileName are required");
    }

    try {
      const workspaceId = body.workspaceId ?? request.userAuth?.workspaceId;
      const workspaceError = ensureWorkspaceScope(request, reply, workspaceId);
      if (workspaceError) {
        return workspaceError;
      }

      if (!workspaceId) {
        return badRequest(reply, "workspaceId is required");
      }

      const result = await withTransaction(async (client) => {
        const assetId = randomUUID();
        const uploadId = randomUUID();
        const uploadToken = randomUUID();
        const cleanFileName = sanitizeFileName(body.fileName!);
        const storageKey = `${workspaceId}/${assetId}/${cleanFileName || "upload.bin"}`;
        const uploadUrl = `${getConfig().uploadUrlBase}/${uploadToken}`;

        await client.query(
          `
            INSERT INTO asset.assets (
              id,
              workspace_id,
              asset_type,
              storage_bucket,
              storage_key,
              mime_type,
              file_size_bytes,
              status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
          `,
          [
            assetId,
            workspaceId,
            body.assetType,
            getConfig().storageBucket,
            storageKey,
            body.mimeType ?? null,
            body.fileSizeBytes ?? null
          ]
        );

        await client.query(
          `
            INSERT INTO asset.uploads (
              id,
              asset_id,
              upload_token,
              upload_url,
              expires_at
            )
            VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 hour')
          `,
          [uploadId, assetId, uploadToken, uploadUrl]
        );

        const expiresResult = await client.query<{ expires_at: string }>(
          "SELECT expires_at FROM asset.uploads WHERE id = $1",
          [uploadId]
        );

        return {
          assetId,
          uploadId,
          uploadToken,
          uploadUrl,
          expiresAt: expiresResult.rows[0].expires_at
        };
      });

      return reply.code(201).send(result);
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });
}
