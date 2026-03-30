import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authenticateUserRequest, ensureWorkspaceScope } from "../../lib/auth.js";
import { ensureWorkspacePermission } from "../../lib/authorization.js";
import { query, withTransaction } from "../../lib/database.js";
import { badRequest, internalError } from "../../lib/http.js";
import { buildTemplatePlan } from "./template-planner.js";
import {
  cloneTemplateToWorkspace,
  createTemplate,
  duplicateWorkspaceTemplate,
  ensureTemplateFound,
  findTemplateById,
  listTemplates,
  type TemplateNiche,
  type TemplateObjective,
  type TemplateScope,
  type TemplateStatus,
  type TemplateVariables,
  updateTemplate
} from "./template-store.js";

export function registerContentRoutes(app: FastifyInstance) {
  app.get("/v1/content/templates", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const requestQuery = request.query as {
      includeUnpublished?: string | boolean;
      scope?: TemplateScope;
      workspaceId?: string;
    };

    try {
      const workspaceId = requestQuery.workspaceId ?? request.userAuth?.workspaceId;
      const workspaceError = ensureWorkspaceScope(request, reply, workspaceId);
      if (workspaceError) {
        return workspaceError;
      }

      const permissionError = await ensureWorkspacePermission(request, reply, {
        feature: "content",
        permission: "content.read"
      });
      if (permissionError) {
        return permissionError;
      }

      if (requestQuery.scope && !isTemplateScope(requestQuery.scope)) {
        return badRequest(reply, "scope must be official or workspace");
      }

      const includeUnpublished =
        requestQuery.includeUnpublished === true ||
        requestQuery.includeUnpublished === "true";

      if (includeUnpublished) {
        const unpublishedPermissionError = await ensureWorkspacePermission(request, reply, requestQuery.scope === "workspace"
          ? {
              feature: "content",
              permission: "content.generate"
            }
          : {
              permission: "platform.admin"
            });
        if (unpublishedPermissionError) {
          return unpublishedPermissionError;
        }
      }

      return reply.send({
        items: await withTransaction((client) =>
          listTemplates(client, {
            includeUnpublished,
            scope: requestQuery.scope,
            workspaceId
          })
        )
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.post("/v1/content/templates", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const body = request.body as {
      body?: string;
      key?: string;
      niche?: TemplateNiche;
      objective?: TemplateObjective;
      scope?: TemplateScope;
      status?: TemplateStatus;
      title?: string;
      useCaseBadge?: string;
      variables?: TemplateVariables;
      workspaceId?: string;
    };

    if (!request.userAuth?.userId) {
      return badRequest(reply, "user auth context is required");
    }

    if (!body.scope || !isTemplateScope(body.scope)) {
      return badRequest(reply, "scope must be official or workspace");
    }

    if (!body.key || !body.title || !body.niche || !body.objective) {
      return badRequest(reply, "key, title, niche, and objective are required");
    }

    if (!isTemplateNiche(body.niche) || !isTemplateObjective(body.objective)) {
      return badRequest(reply, "niche or objective is invalid");
    }

    if (body.status && !isTemplateStatus(body.status)) {
      return badRequest(reply, "status must be draft, published, or archived");
    }

    try {
      const workspaceId = body.workspaceId ?? request.userAuth.workspaceId;
      const workspaceError = ensureWorkspaceScope(request, reply, workspaceId);
      if (workspaceError) {
        return workspaceError;
      }

      const permissionError = await ensureWorkspacePermission(request, reply, {
        permission: body.scope === "official" ? "platform.admin" : "content.generate",
        feature: body.scope === "workspace" ? "content" : undefined
      });
      if (permissionError) {
        return permissionError;
      }

      const scope = body.scope;
      const key = body.key.trim();
      const niche = body.niche;
      const objective = body.objective;
      const title = body.title.trim();

      const created = await withTransaction((client) =>
        createTemplate(client, {
          body: body.body?.trim() ?? "",
          createdByUserId: request.userAuth!.userId,
          key,
          niche,
          objective,
          scope,
          status: body.status ?? "draft",
          title,
          useCaseBadge: body.useCaseBadge?.trim() ?? "",
          variables: sanitizeTemplateVariables(body.variables),
          workspaceId
        })
      );

      return reply.code(201).send({
        item: created
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.patch("/v1/content/templates/:templateId", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const params = request.params as {
      templateId: string;
    };
    const body = request.body as {
      body?: string;
      key?: string;
      niche?: TemplateNiche;
      objective?: TemplateObjective;
      status?: TemplateStatus;
      title?: string;
      useCaseBadge?: string;
      variables?: TemplateVariables;
      workspaceId?: string;
    };

    if (!request.userAuth?.userId) {
      return badRequest(reply, "user auth context is required");
    }

    if (body.niche && !isTemplateNiche(body.niche)) {
      return badRequest(reply, "niche is invalid");
    }

    if (body.objective && !isTemplateObjective(body.objective)) {
      return badRequest(reply, "objective is invalid");
    }

    if (body.status && !isTemplateStatus(body.status)) {
      return badRequest(reply, "status must be draft, published, or archived");
    }

    try {
      const workspaceId = body.workspaceId ?? request.userAuth.workspaceId;
      const workspaceError = ensureWorkspaceScope(request, reply, workspaceId);
      if (workspaceError) {
        return workspaceError;
      }

      const existing = await withTransaction((client) =>
        findTemplateById(client, {
          id: params.templateId,
          workspaceId
        })
      );
      if (!existing) {
        return ensureTemplateFound(existing, reply);
      }

      const permissionError = await ensureWorkspacePermission(request, reply, {
        permission: existing.scope === "official" ? "platform.admin" : "content.generate",
        feature: existing.scope === "workspace" ? "content" : undefined
      });
      if (permissionError) {
        return permissionError;
      }

      const updated = await withTransaction((client) =>
        updateTemplate(client, {
          body: body.body?.trim(),
          id: params.templateId,
          key: body.key?.trim(),
          niche: body.niche,
          objective: body.objective,
          status: body.status,
          title: body.title?.trim(),
          updatedByUserId: request.userAuth!.userId,
          useCaseBadge: body.useCaseBadge?.trim(),
          variables: body.variables ? sanitizeTemplateVariables(body.variables) : undefined,
          workspaceId
        })
      );

      const updatedMissingError = ensureTemplateFound(updated, reply);
      if (updatedMissingError) {
        return updatedMissingError;
      }

      return reply.send({
        item: updated
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.post("/v1/content/templates/:templateId/publish", { preHandler: authenticateUserRequest }, async (request, reply) => {
    return changeTemplateStatus(app, request, reply, "published");
  });

  app.post("/v1/content/templates/:templateId/archive", { preHandler: authenticateUserRequest }, async (request, reply) => {
    return changeTemplateStatus(app, request, reply, "archived");
  });

  app.post("/v1/content/templates/:templateId/clone", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const params = request.params as {
      templateId: string;
    };
    const body = request.body as {
      workspaceId?: string;
    };

    if (!request.userAuth?.userId) {
      return badRequest(reply, "user auth context is required");
    }

    try {
      const workspaceId = body.workspaceId ?? request.userAuth.workspaceId;
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

      const cloned = await withTransaction((client) =>
        cloneTemplateToWorkspace(client, {
          sourceTemplateId: params.templateId,
          userId: request.userAuth!.userId,
          workspaceId
        })
      );

      if (!cloned) {
        return badRequest(reply, "Only official templates can be cloned into a workspace");
      }

      return reply.code(201).send({
        item: cloned
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.post("/v1/content/templates/:templateId/duplicate", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const params = request.params as {
      templateId: string;
    };
    const body = request.body as {
      workspaceId?: string;
    };

    if (!request.userAuth?.userId) {
      return badRequest(reply, "user auth context is required");
    }

    try {
      const workspaceId = body.workspaceId ?? request.userAuth.workspaceId;
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

      const duplicated = await withTransaction((client) =>
        duplicateWorkspaceTemplate(client, {
          sourceTemplateId: params.templateId,
          userId: request.userAuth!.userId,
          workspaceId
        })
      );

      if (!duplicated) {
        return badRequest(reply, "Only workspace templates can be duplicated");
      }

      return reply.code(201).send({
        item: duplicated
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.post("/v1/content/template-plans:preview", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const body = request.body as {
      workspaceId?: string;
      niche?: "beauty" | "gadget" | "fashion";
      objective?: "comparison" | "problem_solution" | "promo_offer" | "testimonial_style";
      variant?: string;
      aspectRatio?: string;
      durationSeconds?: number;
      musicMode?: string;
      brandTone?: string;
      imageAssetIds?: string[];
      product?: {
        ctaText?: string;
        description?: string;
        offerText?: string;
        priceText?: string;
        subtitle?: string;
        title?: string;
      };
      script?: {
        body?: string;
        cta?: string;
        hook?: string;
        subtitleLines?: string[];
      };
    };

    if (!body.niche || !body.objective || !body.product?.title || !body.script?.hook || !body.script?.body || !body.script?.cta) {
      return badRequest(reply, "niche, objective, product.title, script.hook, script.body, and script.cta are required");
    }

    try {
      const workspaceId = body.workspaceId ?? request.userAuth?.workspaceId;
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

      return reply.send(buildTemplatePlan({
        aspectRatio: body.aspectRatio,
        brandTone: body.brandTone,
        durationSeconds: body.durationSeconds,
        imageAssetIds: body.imageAssetIds,
        musicMode: body.musicMode,
        niche: body.niche,
        objective: body.objective,
        product: {
          ctaText: body.product.ctaText,
          description: body.product.description,
          offerText: body.product.offerText,
          priceText: body.product.priceText,
          subtitle: body.product.subtitle,
          title: body.product.title
        },
        script: {
          body: body.script.body,
          cta: body.script.cta,
          hook: body.script.hook,
          subtitleLines: body.script.subtitleLines
        },
        variant: body.variant
      }));
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.get("/v1/content/scripts", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const requestQuery = request.query as {
      workspaceId?: string;
      status?: string;
      limit?: string | number;
    };

    try {
      const workspaceId = requestQuery.workspaceId ?? request.userAuth?.workspaceId;
      const workspaceError = ensureWorkspaceScope(request, reply, workspaceId);
      if (workspaceError) {
        return workspaceError;
      }

      const permissionError = await ensureWorkspacePermission(request, reply, {
        feature: "content",
        permission: "content.read"
      });
      if (permissionError) {
        return permissionError;
      }

      if (!workspaceId) {
        return badRequest(reply, "workspaceId is required");
      }

      const status = requestQuery.status;
      if (status && !["draft", "ready", "archived"].includes(status)) {
        return badRequest(reply, "status must be draft, ready, or archived");
      }

      const parsedLimit = Number(requestQuery.limit ?? 6);
      const limit = Number.isFinite(parsedLimit)
        ? Math.min(Math.max(Math.floor(parsedLimit), 1), 24)
        : 6;

      const result = await query<ContentScriptRow>(
        `
          SELECT
            id,
            source_type,
            title,
            hook,
            body,
            cta,
            language_code,
            status,
            created_at
          FROM content.scripts
          WHERE workspace_id = $1
            AND ($2::text IS NULL OR status = $2)
          ORDER BY created_at DESC
          LIMIT $3
        `,
        [workspaceId, status ?? null, limit]
      );

      return reply.send({
        items: result.rows.map(serializeScript)
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

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

    if (!["manual", "product", "long_video", "ai_generate"].includes(body.sourceType)) {
      return badRequest(reply, "sourceType must be manual, product, long_video, or ai_generate");
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

      const result = await query<ContentScriptRow>(
        `
          INSERT INTO content.scripts (
            workspace_id,
            created_by_user_id,
            source_type,
            title,
            hook,
            body,
            cta,
            language_code,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ready')
          RETURNING
            id,
            source_type,
            title,
            hook,
            body,
            cta,
            language_code,
            status,
            created_at
        `,
        [
          workspaceId,
          request.userAuth?.userId ?? null,
          sourceType,
          title,
          `Hook: ${title}`,
          scriptBody,
          "Coba sekarang dan cek link di bio.",
          languageCode
        ]
      );

      const createdScript = serializeScript(result.rows[0]);

      return reply.code(202).send({
        scriptId: createdScript.id,
        script: createdScript,
        status: createdScript.status
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });
}

type ContentScriptRow = {
  id: string;
  source_type: string;
  title: string;
  hook: string | null;
  body: string;
  cta: string | null;
  language_code: string;
  status: string;
  created_at: string;
};

function serializeScript(row: ContentScriptRow) {
  return {
    id: row.id,
    sourceType: row.source_type,
    title: row.title,
    hook: row.hook,
    body: row.body,
    cta: row.cta,
    languageCode: row.language_code,
    status: row.status,
    createdAt: row.created_at
  };
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

async function changeTemplateStatus(
  _app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  status: Extract<TemplateStatus, "archived" | "published">
) {
  const params = request.params as {
    templateId: string;
  };
  const body = request.body as {
    workspaceId?: string;
  };

  if (!request.userAuth?.userId) {
    return badRequest(reply, "user auth context is required");
  }

  try {
    const workspaceId = body?.workspaceId ?? request.userAuth.workspaceId;
    const workspaceError = ensureWorkspaceScope(request, reply, workspaceId);
    if (workspaceError) {
      return workspaceError;
    }

    const existing = await withTransaction((client) =>
      findTemplateById(client, {
        id: params.templateId,
        workspaceId
      })
    );
    if (!existing) {
      return ensureTemplateFound(existing, reply);
    }

    const permissionError = await ensureWorkspacePermission(request, reply, {
      permission: existing.scope === "official" ? "platform.admin" : "content.generate",
      feature: existing.scope === "workspace" ? "content" : undefined
    });
    if (permissionError) {
      return permissionError;
    }

    const updated = await withTransaction((client) =>
      updateTemplate(client, {
        id: params.templateId,
        status,
        updatedByUserId: request.userAuth!.userId,
        workspaceId
      })
    );
    const updatedMissingError = ensureTemplateFound(updated, reply);
    if (updatedMissingError) {
      return updatedMissingError;
    }

    return reply.send({
      item: updated
    });
  } catch (error) {
    request.log.error(error);
    return internalError(reply);
  }
}

function isTemplateNiche(value: string): value is TemplateNiche {
  return ["beauty", "fashion", "gadget"].includes(value);
}

function isTemplateObjective(value: string): value is TemplateObjective {
  return ["comparison", "problem_solution", "promo_offer", "testimonial_style"].includes(value);
}

function isTemplateScope(value: string): value is TemplateScope {
  return ["official", "workspace"].includes(value);
}

function isTemplateStatus(value: string): value is TemplateStatus {
  return ["archived", "draft", "published"].includes(value);
}

function sanitizeTemplateVariables(input: TemplateVariables | undefined) {
  if (!input) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => typeof value === "string")
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value.length > 0)
  ) as TemplateVariables;
}
