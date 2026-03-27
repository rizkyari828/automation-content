import type { FastifyInstance } from "fastify";
import { authenticateUserRequest, ensureWorkspaceScope } from "../../lib/auth.js";
import { ensureWorkspacePermission } from "../../lib/authorization.js";
import { badRequest, internalError } from "../../lib/http.js";
import { query } from "../../lib/database.js";

export function registerContentRoutes(app: FastifyInstance) {
  app.post("/v1/content/scripts:generate", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const body = request.body as {
      workspaceId?: string;
      sourceType?: string;
      title?: string;
      productUrl?: string;
      languageCode?: string;
      promptHint?: string;
    };

    if (!body.sourceType || !body.title) {
      return badRequest(reply, "sourceType and title are required");
    }

    try {
      const workspaceId = body.workspaceId ?? request.userAuth?.workspaceId;
      const sourceType = body.sourceType;
      const title = body.title;
      const languageCode = body.languageCode ?? "id";

      const workspaceError = ensureWorkspaceScope(request, reply, workspaceId);
      if (workspaceError) {
        return workspaceError;
      }

      const permissionError = await ensureWorkspacePermission(request, reply, {
        feature: "content",
        permission: "content.generate"
      });
      if (permissionError) {
        return permissionError;
      }

      if (!workspaceId) {
        return badRequest(reply, "workspaceId is required");
      }

      const scriptBody = buildDraftScript({
        title,
        productUrl: body.productUrl,
        promptHint: body.promptHint
      });

      const result = await query<{ id: string }>(
        `
          INSERT INTO content.scripts (
            workspace_id,
            source_type,
            title,
            hook,
            body,
            cta,
            language_code,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'ready')
          RETURNING id
        `,
        [
          workspaceId,
          sourceType,
          title,
          `Hook: ${title}`,
          scriptBody,
          "Coba sekarang dan cek link di bio.",
          languageCode
        ]
      );

      return reply.code(202).send({
        scriptId: result.rows[0].id,
        status: "ready"
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });
}

function buildDraftScript(input: {
  title: string;
  productUrl?: string;
  promptHint?: string;
}) {
  const lines = [
    `Judul konten: ${input.title}.`,
    "Opening: mulai dengan pain point yang paling dekat dengan user.",
    "Body: jelaskan manfaat utama secara singkat dan konkret.",
    "CTA: arahkan user untuk klik link atau cek produk sekarang."
  ];

  if (input.productUrl) {
    lines.push(`Referensi produk: ${input.productUrl}.`);
  }

  if (input.promptHint) {
    lines.push(`Hint tambahan: ${input.promptHint}.`);
  }

  return lines.join(" ");
}
