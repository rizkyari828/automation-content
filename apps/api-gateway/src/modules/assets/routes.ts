import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { getConfig } from "../../config.js";
import { authenticateUserRequest, ensureWorkspaceScope } from "../../lib/auth.js";
import { ensureWorkspacePermission } from "../../lib/authorization.js";
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

      const permissionError = await ensureWorkspacePermission(request, reply, {
        feature: "assets",
        permission: "assets.upload"
      });
      if (permissionError) {
        return permissionError;
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

  app.put("/v1/assets/uploads/:uploadToken", async (request, reply) => {
    const params = request.params as {
      uploadToken?: string;
    };

    if (!params.uploadToken?.trim()) {
      return badRequest(reply, "uploadToken is required");
    }

    try {
      const uploadResult = await query<UploadTargetRow>(
        `
          SELECT
            upload.id,
            upload.asset_id,
            upload.expires_at,
            upload.completed_at,
            asset.mime_type,
            asset.storage_key
          FROM asset.uploads AS upload
          INNER JOIN asset.assets AS asset
            ON asset.id = upload.asset_id
          WHERE upload.upload_token = $1
          LIMIT 1
        `,
        [params.uploadToken.trim()]
      );

      const upload = uploadResult.rows[0];
      if (!upload) {
        return reply.code(404).send({
          message: "Upload target not found"
        });
      }

      if (upload.completed_at) {
        return badRequest(reply, "Upload token has already been used");
      }

      if (new Date(upload.expires_at).getTime() <= Date.now()) {
        return badRequest(reply, "Upload token has expired");
      }

      const fileBuffer = await readRequestBodyBuffer(request);
      if (fileBuffer.byteLength === 0) {
        return badRequest(reply, "Upload body is empty");
      }

      const storageRoot = resolveStorageRoot();
      const relativeStorageKey = upload.storage_key.replace(/^\/+/, "");
      const targetPath = path.join(storageRoot, relativeStorageKey);
      await mkdir(path.dirname(targetPath), {
        recursive: true
      });
      await writeFile(targetPath, fileBuffer);

      const storedStat = await stat(targetPath);
      await query(
        `
          UPDATE asset.assets
          SET
            mime_type = COALESCE($2, mime_type),
            file_size_bytes = $3,
            status = 'uploaded',
            updated_at = NOW()
          WHERE id = $1
        `,
        [
          upload.asset_id,
          request.headers["content-type"] ?? upload.mime_type ?? null,
          storedStat.size
        ]
      );

      await query(
        `
          UPDATE asset.uploads
          SET completed_at = NOW()
          WHERE id = $1
        `,
        [upload.id]
      );

      return reply.code(201).send({
        assetId: upload.asset_id,
        fileSizeBytes: storedStat.size,
        status: "uploaded"
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.get("/v1/assets/:assetId/content", async (request, reply) => {
    const params = request.params as {
      assetId?: string;
    };

    if (!params.assetId?.trim()) {
      return badRequest(reply, "assetId is required");
    }

    try {
      const result = await query<AssetContentRow>(
        `
          SELECT
            id,
            mime_type,
            status,
            storage_key
          FROM asset.assets
          WHERE id = $1
          LIMIT 1
        `,
        [params.assetId.trim()]
      );

      const asset = result.rows[0];
      if (!asset) {
        return reply.code(404).send({
          message: "Asset not found"
        });
      }

      if (!["uploaded", "processed"].includes(asset.status)) {
        return badRequest(reply, "Asset is not ready");
      }

      const storageRoot = resolveStorageRoot();
      const relativeStorageKey = asset.storage_key.replace(/^\/+/, "");
      const assetPath = path.join(storageRoot, relativeStorageKey);

      try {
        await stat(assetPath);
      } catch {
        return reply.code(404).send({
          message: "Asset file not found"
        });
      }

      reply.header("cache-control", "public, max-age=3600");
      reply.type(asset.mime_type ?? "application/octet-stream");
      return reply.send(createReadStream(assetPath));
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });
}

type UploadTargetRow = {
  id: string;
  asset_id: string;
  completed_at: string | null;
  expires_at: string;
  mime_type: string | null;
  storage_key: string;
};

type AssetContentRow = {
  id: string;
  mime_type: string | null;
  status: string;
  storage_key: string;
};

function resolveStorageRoot() {
  const storageLocalDir = getConfig().storageLocalDir;

  return path.isAbsolute(storageLocalDir)
    ? storageLocalDir
    : path.resolve(process.cwd(), storageLocalDir);
}

async function readRequestBodyBuffer(request: {
  body?: unknown;
  raw: NodeJS.ReadableStream;
}) {
  if (Buffer.isBuffer(request.body)) {
    return request.body;
  }

  if (typeof request.body === "string") {
    return Buffer.from(request.body);
  }

  const chunks: Buffer[] = [];

  for await (const chunk of request.raw) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}
