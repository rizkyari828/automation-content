import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authenticateUserRequest, ensureWorkspaceScope } from "../../lib/auth.js";
import { ensureWorkspacePermission } from "../../lib/authorization.js";
import { query, withTransaction } from "../../lib/database.js";
import { badRequest, internalError } from "../../lib/http.js";
import {
  DownstreamServiceError,
  callInternalService
} from "../../lib/internal-service-client.js";
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
  app.post("/v1/content/studio-sessions", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const body = request.body as {
      draftState?: Record<string, unknown>;
      rawBrief?: Record<string, unknown>;
      sessionId?: string;
      workflowMode?: StudioWorkflowMode;
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

      const workflowMode = body.workflowMode ?? "assisted";
      if (!isStudioWorkflowMode(workflowMode)) {
        return badRequest(reply, "workflowMode must be quick, assisted, or manual");
      }

      const incomingSessionId = body.sessionId?.trim();
      if (incomingSessionId && !isUuid(incomingSessionId)) {
        return badRequest(reply, "sessionId must be a UUID");
      }

      const sessionId = incomingSessionId || randomUUID();
      const draftState = sanitizeObject(body.draftState);
      const rawBrief = sanitizeObject(body.rawBrief);

      const result = await query<StudioSessionRow>(
        `
          INSERT INTO content.studio_sessions (
            id,
            workspace_id,
            created_by_user_id,
            workflow_mode,
            status,
            draft_state,
            raw_brief
          )
          VALUES ($1, $2, $3, $4, 'draft', $5::jsonb, $6::jsonb)
          ON CONFLICT (id)
          DO UPDATE
          SET
            workflow_mode = EXCLUDED.workflow_mode,
            draft_state = CASE
              WHEN EXCLUDED.draft_state = '{}'::jsonb THEN content.studio_sessions.draft_state
              ELSE EXCLUDED.draft_state
            END,
            raw_brief = CASE
              WHEN EXCLUDED.raw_brief = '{}'::jsonb THEN content.studio_sessions.raw_brief
              ELSE EXCLUDED.raw_brief
            END,
            updated_at = NOW()
          WHERE content.studio_sessions.workspace_id = EXCLUDED.workspace_id
          RETURNING
            id,
            workspace_id,
            created_by_user_id,
            workflow_mode,
            status,
            last_layer,
            raw_brief,
            draft_state,
            product_metadata,
            extracted_context,
            director_scripts,
            scene_plan,
            render_specs,
            completeness_score,
            missing_fields,
            warnings,
            ready_to_proceed,
            last_error,
            created_at,
            updated_at
        `,
        [
          sessionId,
          workspaceId,
          request.userAuth.userId,
          workflowMode,
          JSON.stringify(draftState),
          JSON.stringify(rawBrief)
        ]
      );

      const createdSession = result.rows[0];
      if (!createdSession) {
        return badRequest(reply, "sessionId already exists in another workspace");
      }

      return reply.code(201).send({
        item: serializeStudioSession(createdSession)
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.get("/v1/content/studio-sessions/:sessionId", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const params = request.params as {
      sessionId: string;
    };
    const requestQuery = request.query as {
      workspaceId?: string;
    };

    if (!isUuid(params.sessionId)) {
      return badRequest(reply, "sessionId must be a UUID");
    }

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

      const result = await query<StudioSessionRow>(
        `
          SELECT
            id,
            workspace_id,
            created_by_user_id,
            workflow_mode,
            status,
            last_layer,
            raw_brief,
            draft_state,
            product_metadata,
            extracted_context,
            director_scripts,
            scene_plan,
            render_specs,
            completeness_score,
            missing_fields,
            warnings,
            ready_to_proceed,
            last_error,
            created_at,
            updated_at
          FROM content.studio_sessions
          WHERE id = $1
            AND workspace_id = $2
          LIMIT 1
        `,
        [params.sessionId, workspaceId]
      );

      const existingSession = result.rows[0];
      if (!existingSession) {
        return reply.code(404).send({
          message: "Studio session not found"
        });
      }

      return reply.send({
        item: serializeStudioSession(existingSession)
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.patch("/v1/content/studio-sessions/:sessionId", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const params = request.params as {
      sessionId: string;
    };
    const body = request.body as {
      draftState?: Record<string, unknown>;
      lastError?: string | null;
      lastLayer?: string;
      rawBrief?: Record<string, unknown>;
      status?: StudioSessionStatus;
      workflowMode?: StudioWorkflowMode;
      workspaceId?: string;
    };

    if (!isUuid(params.sessionId)) {
      return badRequest(reply, "sessionId must be a UUID");
    }

    if (body.workflowMode && !isStudioWorkflowMode(body.workflowMode)) {
      return badRequest(reply, "workflowMode must be quick, assisted, or manual");
    }

    if (body.status && !isStudioSessionStatus(body.status)) {
      return badRequest(reply, "status must be draft, processing, ready, or archived");
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

      const hasRawBrief = Object.prototype.hasOwnProperty.call(body, "rawBrief");
      const hasDraftState = Object.prototype.hasOwnProperty.call(body, "draftState");
      const hasLastError = Object.prototype.hasOwnProperty.call(body, "lastError");

      if (
        !hasRawBrief &&
        !hasDraftState &&
        !hasLastError &&
        !body.lastLayer &&
        !body.status &&
        !body.workflowMode
      ) {
        return badRequest(reply, "No changes were provided");
      }

      const result = await query<StudioSessionRow>(
        `
          UPDATE content.studio_sessions
          SET
            workflow_mode = COALESCE($3, workflow_mode),
            status = COALESCE($4, status),
            last_layer = COALESCE($5, last_layer),
            last_error = CASE
              WHEN $6::boolean THEN $7::text
              ELSE last_error
            END,
            draft_state = CASE
              WHEN $8::boolean THEN $9::jsonb
              ELSE draft_state
            END,
            raw_brief = CASE
              WHEN $10::boolean THEN $11::jsonb
              ELSE raw_brief
            END,
            updated_at = NOW()
          WHERE id = $1
            AND workspace_id = $2
          RETURNING
            id,
            workspace_id,
            created_by_user_id,
            workflow_mode,
            status,
            last_layer,
            raw_brief,
            draft_state,
            product_metadata,
            extracted_context,
            director_scripts,
            scene_plan,
            render_specs,
            completeness_score,
            missing_fields,
            warnings,
            ready_to_proceed,
            last_error,
            created_at,
            updated_at
        `,
        [
          params.sessionId,
          workspaceId,
          body.workflowMode ?? null,
          body.status ?? null,
          body.lastLayer?.trim() || null,
          hasLastError,
          hasLastError ? body.lastError ?? null : null,
          hasDraftState,
          JSON.stringify(hasDraftState ? sanitizeObject(body.draftState) : {}),
          hasRawBrief,
          JSON.stringify(hasRawBrief ? sanitizeObject(body.rawBrief) : {})
        ]
      );

      const updatedSession = result.rows[0];
      if (!updatedSession) {
        return reply.code(404).send({
          message: "Studio session not found"
        });
      }

      return reply.send({
        item: serializeStudioSession(updatedSession)
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.post("/v1/content/studio-sessions/:sessionId/extract-context", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const params = request.params as {
      sessionId: string;
    };
    const body = request.body as {
      rawBrief?: Record<string, unknown>;
      workspaceId?: string;
    };

    if (!isUuid(params.sessionId)) {
      return badRequest(reply, "sessionId must be a UUID");
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

      const session = await loadStudioSession(params.sessionId, workspaceId);
      if (!session) {
        return reply.code(404).send({
          message: "Studio session not found"
        });
      }

      const rawBrief = sanitizeObject(body.rawBrief ?? session.raw_brief);
      const productMetadata = inferProductMetadata(getStringValue(rawBrief.productUrl));
      const extraction = buildContextExtraction({
        productMetadata,
        rawBrief
      });

      const updatedResult = await query<StudioSessionRow>(
        `
          UPDATE content.studio_sessions
          SET
            status = $3,
            last_layer = 'L1',
            raw_brief = $4::jsonb,
            product_metadata = $5::jsonb,
            extracted_context = $6::jsonb,
            completeness_score = $7,
            missing_fields = $8::text[],
            warnings = $9::text[],
            ready_to_proceed = $10,
            last_error = NULL,
            updated_at = NOW()
          WHERE id = $1
            AND workspace_id = $2
          RETURNING
            id,
            workspace_id,
            created_by_user_id,
            workflow_mode,
            status,
            last_layer,
            raw_brief,
            draft_state,
            product_metadata,
            extracted_context,
            director_scripts,
            scene_plan,
            render_specs,
            completeness_score,
            missing_fields,
            warnings,
            ready_to_proceed,
            last_error,
            created_at,
            updated_at
        `,
        [
          params.sessionId,
          workspaceId,
          extraction.readyToProceed ? "ready" : "draft",
          JSON.stringify(rawBrief),
          JSON.stringify(productMetadata),
          JSON.stringify({
            enrichedContext: extraction.enrichedContext,
            productBrief: extraction.productBrief
          }),
          extraction.completenessScore,
          extraction.missingFields,
          extraction.warnings,
          extraction.readyToProceed
        ]
      );

      const extractedSession = updatedResult.rows[0];
      if (!extractedSession) {
        return reply.code(404).send({
          message: "Studio session not found"
        });
      }

      return reply.send({
        enrichedContext: extraction.enrichedContext,
        item: serializeStudioSession(extractedSession),
        missingFields: extraction.missingFields,
        productBrief: extraction.productBrief,
        readyToProceed: extraction.readyToProceed,
        warnings: extraction.warnings
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.post("/v1/content/studio-sessions/:sessionId/director-scripts", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const params = request.params as {
      sessionId: string;
    };
    const body = request.body as {
      angles?: string[];
      languageCode?: string;
      rawBrief?: Record<string, unknown>;
      workspaceId?: string;
    };

    if (!isUuid(params.sessionId)) {
      return badRequest(reply, "sessionId must be a UUID");
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

      const session = await loadStudioSession(params.sessionId, workspaceId);
      if (!session) {
        return reply.code(404).send({
          message: "Studio session not found"
        });
      }

      const rawBrief = sanitizeObject(body.rawBrief ?? session.raw_brief);
      const productMetadata = inferProductMetadata(getStringValue(rawBrief.productUrl));
      const extraction = buildContextExtraction({
        productMetadata,
        rawBrief
      });
      const directorScripts = buildDirectorScripts({
        angles: sanitizeAngles(body.angles),
        extraction,
        languageCode: body.languageCode,
        workflowMode: session.workflow_mode
      });

      const updatedResult = await query<StudioSessionRow>(
        `
          UPDATE content.studio_sessions
          SET
            status = 'ready',
            last_layer = 'L2',
            raw_brief = $3::jsonb,
            product_metadata = $4::jsonb,
            extracted_context = $5::jsonb,
            director_scripts = $6::jsonb,
            completeness_score = $7,
            missing_fields = $8::text[],
            warnings = $9::text[],
            ready_to_proceed = $10,
            last_error = NULL,
            updated_at = NOW()
          WHERE id = $1
            AND workspace_id = $2
          RETURNING
            id,
            workspace_id,
            created_by_user_id,
            workflow_mode,
            status,
            last_layer,
            raw_brief,
            draft_state,
            product_metadata,
            extracted_context,
            director_scripts,
            scene_plan,
            render_specs,
            completeness_score,
            missing_fields,
            warnings,
            ready_to_proceed,
            last_error,
            created_at,
            updated_at
        `,
        [
          params.sessionId,
          workspaceId,
          JSON.stringify(rawBrief),
          JSON.stringify(productMetadata),
          JSON.stringify({
            enrichedContext: extraction.enrichedContext,
            productBrief: extraction.productBrief
          }),
          JSON.stringify(directorScripts),
          extraction.completenessScore,
          extraction.missingFields,
          extraction.warnings,
          extraction.readyToProceed
        ]
      );

      const directorSession = updatedResult.rows[0];
      if (!directorSession) {
        return reply.code(404).send({
          message: "Studio session not found"
        });
      }

      return reply.send({
        items: directorScripts,
        item: serializeStudioSession(directorSession),
        readyToProceed: extraction.readyToProceed
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.post("/v1/content/studio-sessions/:sessionId/scene-plan", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const params = request.params as {
      sessionId: string;
    };
    const body = request.body as {
      directorScriptId?: string;
      languageCode?: string;
      rawBrief?: Record<string, unknown>;
      workspaceId?: string;
    };

    if (!isUuid(params.sessionId)) {
      return badRequest(reply, "sessionId must be a UUID");
    }

    if (body.directorScriptId && !isUuidLike(body.directorScriptId)) {
      return badRequest(reply, "directorScriptId is invalid");
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

      const session = await loadStudioSession(params.sessionId, workspaceId);
      if (!session) {
        return reply.code(404).send({
          message: "Studio session not found"
        });
      }

      const rawBrief = sanitizeObject(body.rawBrief ?? session.raw_brief);
      const productMetadata = inferProductMetadata(getStringValue(rawBrief.productUrl));
      const resolved = resolveSessionDirectorContext({
        directorScriptsSource: session.director_scripts,
        extractionSource: session.extracted_context,
        languageCode: body.languageCode,
        productMetadata,
        rawBrief,
        workflowMode: session.workflow_mode
      });
      const selectedDirector = selectDirectorScript(resolved.directorScripts, body.directorScriptId);
      const plannerInput = buildTemplatePlannerInput(rawBrief, resolved.extraction, selectedDirector);
      const templatePlan = buildTemplatePlan(plannerInput);
      const sceneSpecs = buildSceneSpecsFromPlan(templatePlan.scenePlan, rawBrief);

      const updatedResult = await query<StudioSessionRow>(
        `
          UPDATE content.studio_sessions
          SET
            status = 'ready',
            last_layer = 'L3',
            raw_brief = $3::jsonb,
            product_metadata = $4::jsonb,
            extracted_context = $5::jsonb,
            director_scripts = $6::jsonb,
            scene_plan = $7::jsonb,
            render_specs = '[]'::jsonb,
            completeness_score = $8,
            missing_fields = $9::text[],
            warnings = $10::text[],
            ready_to_proceed = $11,
            last_error = NULL,
            updated_at = NOW()
          WHERE id = $1
            AND workspace_id = $2
          RETURNING
            id,
            workspace_id,
            created_by_user_id,
            workflow_mode,
            status,
            last_layer,
            raw_brief,
            draft_state,
            product_metadata,
            extracted_context,
            director_scripts,
            scene_plan,
            render_specs,
            completeness_score,
            missing_fields,
            warnings,
            ready_to_proceed,
            last_error,
            created_at,
            updated_at
        `,
        [
          params.sessionId,
          workspaceId,
          JSON.stringify(rawBrief),
          JSON.stringify(productMetadata),
          JSON.stringify({
            enrichedContext: resolved.extraction.enrichedContext,
            productBrief: resolved.extraction.productBrief
          }),
          JSON.stringify(resolved.directorScripts),
          JSON.stringify(templatePlan.scenePlan),
          resolved.extraction.completenessScore,
          resolved.extraction.missingFields,
          resolved.extraction.warnings,
          resolved.extraction.readyToProceed
        ]
      );

      const sceneSession = updatedResult.rows[0];
      if (!sceneSession) {
        return reply.code(404).send({
          message: "Studio session not found"
        });
      }

      return reply.send({
        item: serializeStudioSession(sceneSession),
        scenePlan: templatePlan.scenePlan,
        sceneSpecs,
        selectedDirectorScriptId:
          typeof selectedDirector.id === "string" && selectedDirector.id.trim()
            ? selectedDirector.id.trim()
            : null
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.post("/v1/content/studio-sessions/:sessionId/render-specs", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const params = request.params as {
      sessionId: string;
    };
    const body = request.body as {
      directorScriptId?: string;
      languageCode?: string;
      rawBrief?: Record<string, unknown>;
      scenePlan?: Record<string, unknown>;
      workspaceId?: string;
    };

    if (!isUuid(params.sessionId)) {
      return badRequest(reply, "sessionId must be a UUID");
    }

    if (body.directorScriptId && !isUuidLike(body.directorScriptId)) {
      return badRequest(reply, "directorScriptId is invalid");
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

      const session = await loadStudioSession(params.sessionId, workspaceId);
      if (!session) {
        return reply.code(404).send({
          message: "Studio session not found"
        });
      }

      const rawBrief = sanitizeObject(body.rawBrief ?? session.raw_brief);
      const productMetadata = inferProductMetadata(getStringValue(rawBrief.productUrl));
      const resolved = resolveSessionDirectorContext({
        directorScriptsSource: session.director_scripts,
        extractionSource: session.extracted_context,
        languageCode: body.languageCode,
        productMetadata,
        rawBrief,
        workflowMode: session.workflow_mode
      });
      const selectedDirector = selectDirectorScript(resolved.directorScripts, body.directorScriptId);
      const plannerInput = buildTemplatePlannerInput(rawBrief, resolved.extraction, selectedDirector);
      const templatePlan = buildTemplatePlan(plannerInput);

      const requestedScenePlan = sanitizeObject(body.scenePlan);
      const persistedScenePlan = sanitizeObject(session.scene_plan);
      const scenePlan = hasScenePlanScenes(requestedScenePlan)
        ? requestedScenePlan
        : hasScenePlanScenes(persistedScenePlan)
          ? persistedScenePlan
          : templatePlan.scenePlan;
      const renderSpecs = buildRenderSpecsFromScenePlan(scenePlan, rawBrief, selectedDirector);

      const templateRenderSpec = {
        ...templatePlan.templateRenderSpec,
        scenePlan
      };

      const updatedResult = await query<StudioSessionRow>(
        `
          UPDATE content.studio_sessions
          SET
            status = 'ready',
            last_layer = 'L4',
            raw_brief = $3::jsonb,
            product_metadata = $4::jsonb,
            extracted_context = $5::jsonb,
            director_scripts = $6::jsonb,
            scene_plan = $7::jsonb,
            render_specs = $8::jsonb,
            completeness_score = $9,
            missing_fields = $10::text[],
            warnings = $11::text[],
            ready_to_proceed = $12,
            last_error = NULL,
            updated_at = NOW()
          WHERE id = $1
            AND workspace_id = $2
          RETURNING
            id,
            workspace_id,
            created_by_user_id,
            workflow_mode,
            status,
            last_layer,
            raw_brief,
            draft_state,
            product_metadata,
            extracted_context,
            director_scripts,
            scene_plan,
            render_specs,
            completeness_score,
            missing_fields,
            warnings,
            ready_to_proceed,
            last_error,
            created_at,
            updated_at
        `,
        [
          params.sessionId,
          workspaceId,
          JSON.stringify(rawBrief),
          JSON.stringify(productMetadata),
          JSON.stringify({
            enrichedContext: resolved.extraction.enrichedContext,
            productBrief: resolved.extraction.productBrief
          }),
          JSON.stringify(resolved.directorScripts),
          JSON.stringify(scenePlan),
          JSON.stringify(renderSpecs),
          resolved.extraction.completenessScore,
          resolved.extraction.missingFields,
          resolved.extraction.warnings,
          resolved.extraction.readyToProceed
        ]
      );

      const renderSpecSession = updatedResult.rows[0];
      if (!renderSpecSession) {
        return reply.code(404).send({
          message: "Studio session not found"
        });
      }

      return reply.send({
        item: serializeStudioSession(renderSpecSession),
        renderSpecs,
        scenePlan,
        selectedDirectorScriptId:
          typeof selectedDirector.id === "string" && selectedDirector.id.trim()
            ? selectedDirector.id.trim()
            : null,
        templateRenderSpec
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.post("/v1/content/studio-sessions/:sessionId/render-batch", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const params = request.params as {
      sessionId: string;
    };
    const body = request.body as {
      preferredProvider?: string;
      scriptId?: string;
      workspaceId?: string;
    };

    if (!isUuid(params.sessionId)) {
      return badRequest(reply, "sessionId must be a UUID");
    }

    try {
      const workspaceId = body.workspaceId ?? request.userAuth?.workspaceId;
      const workspaceError = ensureWorkspaceScope(request, reply, workspaceId);
      if (workspaceError) {
        return workspaceError;
      }

      const renderPermissionError = await ensureWorkspacePermission(request, reply, {
        feature: "media",
        permission: "media.render"
      });
      if (renderPermissionError) {
        return renderPermissionError;
      }

      const contentPermissionError = await ensureWorkspacePermission(request, reply, {
        feature: "content",
        permission: "content.generate"
      });
      if (contentPermissionError) {
        return contentPermissionError;
      }

      if (!workspaceId || !request.userAuth?.userId) {
        return badRequest(reply, "workspaceId and user auth context are required");
      }

      const session = await loadStudioSession(params.sessionId, workspaceId);
      if (!session) {
        return reply.code(404).send({
          message: "Studio session not found"
        });
      }

      const rawBrief = sanitizeObject(session.raw_brief);
      const renderBundle = resolveSessionRenderBundle({
        directorScriptId: undefined,
        languageCode: getStringValue(rawBrief.languageCode, "id"),
        productMetadata: inferProductMetadata(getStringValue(rawBrief.productUrl)),
        rawBrief,
        requestedScenePlan: sanitizeObject(session.scene_plan),
        session
      });

      const sceneItems = ensureArrayOfObjects(renderBundle.scenePlan.scenes);
      if (sceneItems.length === 0) {
        return badRequest(reply, "Scene plan is empty. Preview the plan first before rendering.");
      }

      const sceneJobDispatches = await Promise.allSettled(
        sceneItems.map(async (scene) => {
          const singleScenePlan = {
            ...renderBundle.scenePlan,
            scenes: [scene]
          };
          const singleSceneDurationSeconds = Math.max(1, Math.ceil(normalizeDuration(scene.durationFrames, 90) / 30));

          const singleSceneTemplateSpec = {
            ...renderBundle.templateRenderSpec,
            durationSeconds: singleSceneDurationSeconds,
            scenePlan: {
              ...singleScenePlan,
              durationSeconds: singleSceneDurationSeconds
            }
          };

          const result = await callInternalService<RenderJobResponse>(request, {
            body: {
              aspectRatio: getStringValue(renderBundle.templateRenderSpec.aspectRatio, "9:16"),
              durationSeconds: singleSceneDurationSeconds,
              options: {
                templateRenderSpec: singleSceneTemplateSpec
              },
              preferredProvider: body.preferredProvider ?? "template",
              renderMode: "template_promo",
              requestedByUserId: request.userAuth!.userId,
              scriptId: body.scriptId ?? "",
              sourceAssetId: "",
              workspaceId
            },
            method: "POST",
            path: "/internal/v1/render-jobs",
            scope: ["media.render.write"],
            service: "media-processing-service"
          });

          return {
            job: stripWorkspaceRenderJob(result.data),
            scene
          };
        })
      );

      const batchJobs = buildRenderBatchJobs(sceneJobDispatches, renderBundle.renderSpecs);
      const summary = summarizeRenderBatchJobs(batchJobs);
      const batchStatus = deriveRenderBatchStatus(summary);
      const batchId = `rb_${randomUUID().slice(0, 8)}`;
      const primarySceneJob = pickPrimarySceneBatchJob(batchJobs);
      const draftState = sanitizeObject(session.draft_state);
      const renderBatch = {
        batchId,
        jobs: batchJobs,
        mode: "parallel_scene_render",
        startedAt: new Date().toISOString(),
        status: batchStatus,
        summary
      };
      const nextDraftState = {
        ...draftState,
        assemblyResult: null,
        renderBatch
      };

      const updatedResult = await query<StudioSessionRow>(
        `
          UPDATE content.studio_sessions
          SET
            status = $3,
            last_layer = 'L5',
            draft_state = $4::jsonb,
            scene_plan = $5::jsonb,
            render_specs = $6::jsonb,
            last_error = NULL,
            updated_at = NOW()
          WHERE id = $1
            AND workspace_id = $2
          RETURNING
            id,
            workspace_id,
            created_by_user_id,
            workflow_mode,
            status,
            last_layer,
            raw_brief,
            draft_state,
            product_metadata,
            extracted_context,
            director_scripts,
            scene_plan,
            render_specs,
            completeness_score,
            missing_fields,
            warnings,
            ready_to_proceed,
            last_error,
            created_at,
            updated_at
        `,
        [
          params.sessionId,
          workspaceId,
          batchStatus === "completed" ? "ready" : "processing",
          JSON.stringify(nextDraftState),
          JSON.stringify(renderBundle.scenePlan),
          JSON.stringify(renderBundle.renderSpecs)
        ]
      );

      const updatedSession = updatedResult.rows[0];
      if (!updatedSession) {
        return reply.code(404).send({
          message: "Studio session not found"
        });
      }

      return reply.code(202).send({
        item: serializeStudioSession(updatedSession),
        primaryRenderJob: primarySceneJob?.job ?? null,
        renderBatch
      });
    } catch (error) {
      if (error instanceof DownstreamServiceError) {
        return reply.code(error.statusCode).send(error.responseBody);
      }

      request.log.error(error);
      return internalError(reply);
    }
  });

  app.get("/v1/content/studio-sessions/:sessionId/render-batch-status", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const params = request.params as {
      sessionId: string;
    };
    const requestQuery = request.query as {
      workspaceId?: string;
    };

    if (!isUuid(params.sessionId)) {
      return badRequest(reply, "sessionId must be a UUID");
    }

    try {
      const workspaceId = requestQuery.workspaceId ?? request.userAuth?.workspaceId;
      const workspaceError = ensureWorkspaceScope(request, reply, workspaceId);
      if (workspaceError) {
        return workspaceError;
      }

      const mediaReadPermission = await ensureWorkspacePermission(request, reply, {
        feature: "media",
        permission: "media.read"
      });
      if (mediaReadPermission) {
        return mediaReadPermission;
      }

      if (!workspaceId) {
        return badRequest(reply, "workspaceId is required");
      }

      const session = await loadStudioSession(params.sessionId, workspaceId);
      if (!session) {
        return reply.code(404).send({
          message: "Studio session not found"
        });
      }

      const draftState = sanitizeObject(session.draft_state);
      const currentBatch = sanitizeObject(draftState.renderBatch);
      const currentJobs = ensureArrayOfObjects(currentBatch.jobs);

      if (currentJobs.length === 0) {
        return badRequest(reply, "Render batch is not initialized");
      }

      const refreshedJobs = await refreshRenderBatchJobsFromDownstream(request, currentJobs);
      const summary = summarizeRenderBatchJobs(refreshedJobs);
      const batchStatus = deriveRenderBatchStatus(summary);
      const refreshedBatch = {
        ...currentBatch,
        jobs: refreshedJobs,
        status: batchStatus,
        summary,
        updatedAt: new Date().toISOString()
      };
      const nextDraftState = {
        ...draftState,
        renderBatch: refreshedBatch
      };

      const updatedResult = await query<StudioSessionRow>(
        `
          UPDATE content.studio_sessions
          SET
            status = $3,
            draft_state = $4::jsonb,
            updated_at = NOW()
          WHERE id = $1
            AND workspace_id = $2
          RETURNING
            id,
            workspace_id,
            created_by_user_id,
            workflow_mode,
            status,
            last_layer,
            raw_brief,
            draft_state,
            product_metadata,
            extracted_context,
            director_scripts,
            scene_plan,
            render_specs,
            completeness_score,
            missing_fields,
            warnings,
            ready_to_proceed,
            last_error,
            created_at,
            updated_at
        `,
        [
          params.sessionId,
          workspaceId,
          batchStatus === "completed" ? "ready" : batchStatus === "failed" ? "draft" : "processing",
          JSON.stringify(nextDraftState)
        ]
      );

      const updatedSession = updatedResult.rows[0];
      if (!updatedSession) {
        return reply.code(404).send({
          message: "Studio session not found"
        });
      }

      return reply.send({
        item: serializeStudioSession(updatedSession),
        primaryRenderJob: pickPrimarySceneBatchJob(refreshedJobs)?.job ?? null,
        renderBatch: refreshedBatch
      });
    } catch (error) {
      if (error instanceof DownstreamServiceError) {
        return reply.code(error.statusCode).send(error.responseBody);
      }

      request.log.error(error);
      return internalError(reply);
    }
  });

  app.post("/v1/content/studio-sessions/:sessionId/assemble", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const params = request.params as {
      sessionId: string;
    };
    const body = request.body as {
      workspaceId?: string;
    };

    if (!isUuid(params.sessionId)) {
      return badRequest(reply, "sessionId must be a UUID");
    }

    try {
      const workspaceId = body.workspaceId ?? request.userAuth?.workspaceId;
      const workspaceError = ensureWorkspaceScope(request, reply, workspaceId);
      if (workspaceError) {
        return workspaceError;
      }

      const mediaReadPermission = await ensureWorkspacePermission(request, reply, {
        feature: "media",
        permission: "media.read"
      });
      if (mediaReadPermission) {
        return mediaReadPermission;
      }

      const contentPermission = await ensureWorkspacePermission(request, reply, {
        feature: "content",
        permission: "content.generate"
      });
      if (contentPermission) {
        return contentPermission;
      }

      if (!workspaceId) {
        return badRequest(reply, "workspaceId is required");
      }

      const session = await loadStudioSession(params.sessionId, workspaceId);
      if (!session) {
        return reply.code(404).send({
          message: "Studio session not found"
        });
      }

      const draftState = sanitizeObject(session.draft_state);
      const currentBatch = sanitizeObject(draftState.renderBatch);
      const currentJobs = ensureArrayOfObjects(currentBatch.jobs);
      if (currentJobs.length === 0) {
        return badRequest(reply, "Render batch is not initialized");
      }

      const refreshedJobs = await refreshRenderBatchJobsFromDownstream(request, currentJobs);
      const summary = summarizeRenderBatchJobs(refreshedJobs);
      const batchStatus = deriveRenderBatchStatus(summary);
      if (batchStatus !== "completed") {
        return reply.code(409).send({
          message: "Render batch is not completed yet",
          renderBatch: {
            ...currentBatch,
            jobs: refreshedJobs,
            status: batchStatus,
            summary
          }
        });
      }

      const sceneJobs = refreshedJobs
        .filter((job) => getStringValue(job.taskType) === "scene")
        .map((job) => sanitizeObject(job));
      const primaryScene = pickBestCompletedSceneJob(sceneJobs);
      if (!primaryScene?.job || !primaryScene.outputAssetId) {
        return reply.code(409).send({
          message: "No completed render output is available for assembly"
        });
      }

      const rawBrief = sanitizeObject(session.raw_brief);
      const captionPackage = buildCaptionPackage(rawBrief, session);
      const qualityGate = buildAssemblyQualityGate({
        batchSummary: summary,
        outputAssetId: primaryScene.outputAssetId,
        sceneCount: sceneJobs.length
      });
      const assemblyResult = {
        assembledAt: new Date().toISOString(),
        assemblyId: `asm_${randomUUID().slice(0, 8)}`,
        caption: captionPackage.caption,
        hashtags: captionPackage.hashtags,
        primaryRenderJobId: getStringValue(primaryScene.job.jobId),
        qualityGate,
        status: qualityGate.pass ? "completed" : "needs_review",
        videoAssetId: primaryScene.outputAssetId
      };

      const refreshedBatch = {
        ...currentBatch,
        jobs: refreshedJobs,
        status: batchStatus,
        summary,
        updatedAt: new Date().toISOString()
      };
      const nextDraftState = {
        ...draftState,
        assemblyResult,
        renderBatch: refreshedBatch
      };

      const updatedResult = await query<StudioSessionRow>(
        `
          UPDATE content.studio_sessions
          SET
            status = $3,
            last_layer = 'L6',
            draft_state = $4::jsonb,
            updated_at = NOW()
          WHERE id = $1
            AND workspace_id = $2
          RETURNING
            id,
            workspace_id,
            created_by_user_id,
            workflow_mode,
            status,
            last_layer,
            raw_brief,
            draft_state,
            product_metadata,
            extracted_context,
            director_scripts,
            scene_plan,
            render_specs,
            completeness_score,
            missing_fields,
            warnings,
            ready_to_proceed,
            last_error,
            created_at,
            updated_at
        `,
        [
          params.sessionId,
          workspaceId,
          qualityGate.pass ? "ready" : "draft",
          JSON.stringify(nextDraftState)
        ]
      );

      const updatedSession = updatedResult.rows[0];
      if (!updatedSession) {
        return reply.code(404).send({
          message: "Studio session not found"
        });
      }

      return reply.send({
        assemblyResult,
        item: serializeStudioSession(updatedSession),
        primaryRenderJob: primaryScene.job,
        renderBatch: refreshedBatch
      });
    } catch (error) {
      if (error instanceof DownstreamServiceError) {
        return reply.code(error.statusCode).send(error.responseBody);
      }

      request.log.error(error);
      return internalError(reply);
    }
  });

  app.get("/v1/content/product-metadata", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const requestQuery = request.query as {
      url?: string;
      workspaceId?: string;
    };
    const productUrl = requestQuery.url?.trim();

    if (!productUrl) {
      return badRequest(reply, "url is required");
    }

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

      const metadata = inferProductMetadata(productUrl);
      return reply.send({
        item: metadata
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

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
        imageUrl?: string;
        offerText?: string;
        presenterImageUrl?: string;
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
          imageUrl: body.product.imageUrl,
          offerText: body.product.offerText,
          presenterImageUrl: body.product.presenterImageUrl,
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
      languageCode?: string;
      promptHint?: string;
      productUrl?: string;
      sourceType?: string;
      studioSessionId?: string;
      title?: string;
      workflowMode?: StudioWorkflowMode;
      workspaceId?: string;
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
      const workflowMode =
        body.workflowMode && isStudioWorkflowMode(body.workflowMode)
          ? body.workflowMode
          : "assisted";

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

      let scriptDraft = buildDraftScript({
        title,
        productUrl: body.productUrl,
        promptHint: body.promptHint,
        workflowMode
      });

      if (body.studioSessionId) {
        if (!isUuid(body.studioSessionId)) {
          return badRequest(reply, "studioSessionId must be a UUID");
        }

        const session = await loadStudioSession(body.studioSessionId, workspaceId);
        if (session) {
          const directorScripts = ensureArrayOfObjects(session.director_scripts);
          const preferredDirector = directorScripts[0];

          if (preferredDirector) {
            scriptDraft = mergeDraftWithDirectorScript(scriptDraft, preferredDirector);
          } else {
            const extraction = buildContextExtraction({
              productMetadata: inferProductMetadata(body.productUrl),
              rawBrief: sanitizeObject(session.raw_brief)
            });
            const generatedDirectorScripts = buildDirectorScripts({
              angles: [],
              extraction,
              languageCode,
              workflowMode
            });

            if (generatedDirectorScripts[0]) {
              scriptDraft = mergeDraftWithDirectorScript(scriptDraft, generatedDirectorScripts[0]);
            }

            await query(
              `
                UPDATE content.studio_sessions
                SET
                  status = 'ready',
                  last_layer = 'L2',
                  extracted_context = $3::jsonb,
                  director_scripts = $4::jsonb,
                  completeness_score = $5,
                  missing_fields = $6::text[],
                  warnings = $7::text[],
                  ready_to_proceed = $8,
                  last_error = NULL,
                  updated_at = NOW()
                WHERE id = $1
                  AND workspace_id = $2
              `,
              [
                body.studioSessionId,
                workspaceId,
                JSON.stringify({
                  enrichedContext: extraction.enrichedContext,
                  productBrief: extraction.productBrief
                }),
                JSON.stringify(generatedDirectorScripts),
                extraction.completenessScore,
                extraction.missingFields,
                extraction.warnings,
                extraction.readyToProceed
              ]
            );
          }
        }
      }

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
          scriptDraft.hook,
          scriptDraft.body,
          scriptDraft.cta,
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

type RenderJobResponse = {
  completedAt?: string;
  jobId: string;
  lastErrorMessage?: string;
  outputAssetId?: string;
  preferredProvider?: string;
  providerJobId?: string;
  providerName?: string;
  renderMode?: string;
  startedAt?: string;
  status: string;
  workspaceId?: string;
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

type StudioWorkflowMode = "quick" | "assisted" | "manual";
type StudioSessionStatus = "draft" | "processing" | "ready" | "archived";
type StudioSessionRow = {
  id: string;
  workspace_id: string;
  created_by_user_id: string | null;
  workflow_mode: StudioWorkflowMode;
  status: StudioSessionStatus;
  last_layer: string;
  raw_brief: unknown;
  draft_state: unknown;
  product_metadata: unknown;
  extracted_context: unknown;
  director_scripts: unknown;
  scene_plan: unknown;
  render_specs: unknown;
  completeness_score: number;
  missing_fields: string[] | null;
  warnings: string[] | null;
  ready_to_proceed: boolean;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};
type DraftScript = {
  body: string;
  cta: string;
  hook: string;
};
type ProductMetadata = {
  detected_niche: "beauty" | "fashion" | "gadget";
  domain: string;
  name: string;
  price: number | null;
  thumbnail: string | null;
  url: string;
};
type ContextExtraction = {
  completenessScore: number;
  enrichedContext: Record<string, unknown>;
  missingFields: string[];
  productBrief: Record<string, unknown>;
  readyToProceed: boolean;
  warnings: string[];
};
type DirectorScriptInput = {
  angles: string[];
  extraction: ContextExtraction;
  languageCode?: string;
  workflowMode: StudioWorkflowMode;
};

function serializeStudioSession(row: StudioSessionRow) {
  return {
    completenessScore: row.completeness_score,
    createdAt: row.created_at,
    createdByUserId: row.created_by_user_id,
    directorScripts: ensureArrayOfObjects(row.director_scripts),
    draftState: sanitizeObject(row.draft_state),
    extractedContext: sanitizeObject(row.extracted_context),
    id: row.id,
    lastError: row.last_error,
    lastLayer: row.last_layer,
    missingFields: Array.isArray(row.missing_fields) ? row.missing_fields : [],
    productMetadata: sanitizeObject(row.product_metadata),
    rawBrief: sanitizeObject(row.raw_brief),
    scenePlan: sanitizeObject(row.scene_plan),
    renderSpecs: ensureArrayOfObjects(row.render_specs),
    readyToProceed: row.ready_to_proceed,
    status: row.status,
    updatedAt: row.updated_at,
    warnings: Array.isArray(row.warnings) ? row.warnings : [],
    workflowMode: row.workflow_mode,
    workspaceId: row.workspace_id
  };
}

async function loadStudioSession(sessionId: string, workspaceId?: string) {
  if (!workspaceId) {
    return null;
  }

  const result = await query<StudioSessionRow>(
    `
      SELECT
        id,
        workspace_id,
        created_by_user_id,
        workflow_mode,
        status,
        last_layer,
        raw_brief,
        draft_state,
        product_metadata,
        extracted_context,
        director_scripts,
        scene_plan,
        render_specs,
        completeness_score,
        missing_fields,
        warnings,
        ready_to_proceed,
        last_error,
        created_at,
        updated_at
      FROM content.studio_sessions
      WHERE id = $1
        AND workspace_id = $2
      LIMIT 1
    `,
    [sessionId, workspaceId]
  );

  return result.rows[0] ?? null;
}

function buildDraftScript(input: {
  productUrl?: string;
  promptHint?: string;
  title: string;
  workflowMode?: StudioWorkflowMode;
}): DraftScript {
  const ctaByMode: Record<StudioWorkflowMode, string> = {
    assisted: "Klik link produk sekarang dan cek promo yang masih aktif.",
    manual: "Review lagi detail produk kamu, lalu publish kalau sudah yakin.",
    quick: "Cek link produk sekarang sebelum stok promo habis."
  };

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

  const mode = input.workflowMode ?? "assisted";
  return {
    body: lines.join(" "),
    cta: ctaByMode[mode],
    hook: `Hook: ${input.title}`
  };
}

function mergeDraftWithDirectorScript(baseDraft: DraftScript, directorScript: Record<string, unknown>): DraftScript {
  const hook = sanitizeObject(directorScript.hook);
  const cta = sanitizeObject(directorScript.cta);
  const bodyScenes = ensureArrayOfObjects(directorScript.bodyScenes)
    .map((scene) => getStringValue(scene.text))
    .filter(Boolean);

  return {
    body: bodyScenes.length > 0 ? bodyScenes.join(" ") : baseDraft.body,
    cta: getStringValue(cta.text, baseDraft.cta),
    hook: getStringValue(hook.text, baseDraft.hook)
  };
}

function sanitizeObject(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return input as Record<string, unknown>;
}

function ensureArrayOfObjects(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => sanitizeObject(item))
    .filter((item) => Object.keys(item).length > 0);
}

function getStringValue(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized || fallback;
}

function isStudioWorkflowMode(value: string): value is StudioWorkflowMode {
  return ["quick", "assisted", "manual"].includes(value);
}

function isStudioSessionStatus(value: string): value is StudioSessionStatus {
  return ["draft", "processing", "ready", "archived"].includes(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function inferProductMetadata(productUrl?: string): ProductMetadata {
  const fallbackUrl = getStringValue(productUrl);
  const defaultMetadata: ProductMetadata = {
    detected_niche: "beauty",
    domain: "manual-input",
    name: "Produk affiliate",
    price: null,
    thumbnail: null,
    url: fallbackUrl
  };

  if (!fallbackUrl) {
    return defaultMetadata;
  }

  try {
    const parsed = new URL(fallbackUrl);
    const host = parsed.hostname.toLowerCase().replace("www.", "");
    const lastSegment = parsed.pathname.split("/").filter(Boolean).pop() ?? "";
    const productName = decodeURIComponent(lastSegment)
      .replace(/[-_]+/g, " ")
      .trim();

    const name = productName
      ? productName
          .split(" ")
          .filter(Boolean)
          .slice(0, 8)
          .join(" ")
      : "Produk affiliate";

    const detected_niche = inferNicheFromText(`${host} ${name}`);

    return {
      detected_niche,
      domain: host || "manual-input",
      name,
      price: null,
      thumbnail: null,
      url: fallbackUrl
    };
  } catch {
    return defaultMetadata;
  }
}

function inferNicheFromText(input: string): "beauty" | "fashion" | "gadget" {
  const normalized = input.toLowerCase();

  if (/(headset|earbud|gadget|laptop|smartphone|charger|gaming|keyboard|mouse)/.test(normalized)) {
    return "gadget";
  }

  if (/(fashion|hijab|dress|sepatu|tas|outfit|style|jacket|kemeja)/.test(normalized)) {
    return "fashion";
  }

  return "beauty";
}

function sanitizeAngles(input?: string[]) {
  if (!Array.isArray(input)) {
    return [];
  }

  return Array.from(
    new Set(
      input
        .map((item) => getStringValue(item))
        .filter(Boolean)
    )
  ).slice(0, 4);
}

function buildContextExtraction(input: {
  productMetadata: ProductMetadata;
  rawBrief: Record<string, unknown>;
}): ContextExtraction {
  const rawBrief = input.rawBrief;
  const metadata = input.productMetadata;

  const title = getStringValue(rawBrief.title, metadata.name);
  const niche = getStringValue(rawBrief.niche, metadata.detected_niche);
  const objective = getStringValue(rawBrief.objective, "promo_offer");
  const productUrl = getStringValue(rawBrief.productUrl, metadata.url);
  const promptHint = getStringValue(rawBrief.promptHint);
  const ctaText = getStringValue(rawBrief.ctaText);
  const offerText = getStringValue(rawBrief.offerText);
  const productImageUrl = getStringValue(rawBrief.productImageUrl);
  const presenterImageUrl = getStringValue(rawBrief.presenterImageUrl);
  const languageCode = getStringValue(rawBrief.languageCode, "id");

  let score = 0;
  const missingFields: string[] = [];
  const warnings: string[] = [];

  if (title) {
    score += 30;
  } else {
    missingFields.push("title");
  }

  if (niche) {
    score += 20;
  } else {
    missingFields.push("niche");
  }

  if (objective) {
    score += 20;
  } else {
    missingFields.push("objective");
  }

  if (productUrl || productImageUrl) {
    score += 15;
  } else {
    missingFields.push("productUrl_or_productImageUrl");
    warnings.push("Link atau gambar produk belum ada. Visual akan gunakan placeholder.");
  }

  if (promptHint || offerText) {
    score += 10;
  } else {
    missingFields.push("promptHint_or_offerText");
  }

  if (ctaText) {
    score += 5;
  } else {
    warnings.push("CTA belum diisi, sistem akan pakai CTA fallback.");
  }

  if (!presenterImageUrl) {
    warnings.push("Presenter image kosong, frame host fallback tetap dipakai.");
  }

  const normalizedNiche = inferNicheFromText(niche);
  const readinessThreshold = 60;
  const readyToProceed = score >= readinessThreshold;

  const productBrief = {
    cta_text: ctaText || "Klik link produk sekarang",
    key_benefits: defaultBenefitsByNiche(normalizedNiche),
    language_code: languageCode,
    objective,
    offer_text: offerText || "Promo affiliate terbatas",
    price_text: getStringValue(rawBrief.priceText, ""),
    product_name: title || metadata.name || "Produk affiliate",
    product_url: productUrl,
    prompt_hint: promptHint,
    target_pain_point: defaultPainPointByNiche(normalizedNiche)
  };

  const enrichedContext = {
    ctaPatterns: defaultCtaPatternsByNiche(normalizedNiche),
    hookGuardrail:
      "Hook 3 detik pertama harus spesifik, relevan dengan pain point, dan mengandung reason to continue.",
    musicMood: defaultMusicMoodByNiche(normalizedNiche),
    niche: normalizedNiche,
    persona: `Creative Director ${normalizedNiche} untuk commerce Indonesia`,
    visualGuide: defaultVisualGuideByNiche(normalizedNiche)
  };

  return {
    completenessScore: Math.max(0, Math.min(100, score)),
    enrichedContext,
    missingFields,
    productBrief,
    readyToProceed,
    warnings
  };
}

function buildDirectorScripts(input: DirectorScriptInput) {
  const angles = input.angles.length > 0
    ? input.angles
    : defaultAnglesFromObjective(getStringValue(input.extraction.productBrief.objective, "promo_offer"));

  const persona = getStringValue(input.extraction.enrichedContext.persona, "Creative Director commerce Indonesia");
  const productName = getStringValue(input.extraction.productBrief.product_name, "Produk affiliate");
  const ctaText = getStringValue(input.extraction.productBrief.cta_text, "Klik link produk sekarang");
  const painPoint = getStringValue(input.extraction.productBrief.target_pain_point, "masalah utama audiens");
  const languageCode = getStringValue(input.languageCode, "id");

  return angles.map((angle, index) => {
    const angleLabel = angle || `angle-${index + 1}`;
    const hookText =
      languageCode === "id"
        ? `${capitalizeText(angleLabel)}: ${productName} buat kamu yang ${painPoint}?`
        : `${capitalizeText(angleLabel)}: ${productName} for people dealing with ${painPoint}?`;

    const bodyScenes = [
      {
        durationMs: 3200,
        text:
          languageCode === "id"
            ? `Masalah utamanya: ${painPoint}.`
            : `Core pain point: ${painPoint}.`,
        type: "problem"
      },
      {
        durationMs: 4200,
        text:
          languageCode === "id"
            ? `${productName} diposisikan untuk angle ${angleLabel} dengan bukti manfaat yang jelas.`
            : `${productName} is positioned for ${angleLabel} with a clear proof point.`,
        type: "solution"
      },
      {
        durationMs: 2600,
        text:
          languageCode === "id"
            ? "Akhiri dengan urgensi ringan, bukan hard sell."
            : "Close with gentle urgency, not hard sell.",
        type: "trust_signal"
      }
    ];

    return {
      angle: angleLabel,
      backgroundMusic: {
        mood: input.extraction.enrichedContext.musicMood,
        query: `${productName} commerce upbeat`
      },
      bodyScenes,
      cta: {
        durationMs: 2800,
        text: ctaText || "Cek link produk sekarang",
        urgencyLevel: input.workflowMode === "quick" ? "high" : "medium"
      },
      hook: {
        durationMs: 2400,
        text: hookText,
        visual: input.extraction.enrichedContext.visualGuide
      },
      id: `dir_${randomUUID().slice(0, 8)}`,
      persona,
      voiceover: {
        script: [hookText, ...bodyScenes.map((scene) => scene.text), ctaText].join(" "),
        speed: input.workflowMode === "quick" ? 1.08 : 1.0,
        voiceId: languageCode === "id" ? "id-ID-female-warm" : "en-US-female-clear"
      }
    };
  });
}

function resolveSessionDirectorContext(input: {
  directorScriptsSource: unknown;
  extractionSource: unknown;
  languageCode?: string;
  productMetadata: ProductMetadata;
  rawBrief: Record<string, unknown>;
  workflowMode: StudioWorkflowMode;
}) {
  const baselineExtraction = buildContextExtraction({
    productMetadata: input.productMetadata,
    rawBrief: input.rawBrief
  });
  const extractionSource = sanitizeObject(input.extractionSource);
  const sourceProductBrief = sanitizeObject(extractionSource.productBrief);
  const sourceEnrichedContext = sanitizeObject(extractionSource.enrichedContext);

  const mergedExtraction: ContextExtraction = {
    ...baselineExtraction,
    enrichedContext: {
      ...baselineExtraction.enrichedContext,
      ...sourceEnrichedContext
    },
    productBrief: {
      ...baselineExtraction.productBrief,
      ...sourceProductBrief
    }
  };

  const existingDirectorScripts = ensureArrayOfObjects(input.directorScriptsSource);
  const directorScripts = existingDirectorScripts.length > 0
    ? existingDirectorScripts
    : buildDirectorScripts({
        angles: [],
        extraction: mergedExtraction,
        languageCode: input.languageCode,
        workflowMode: input.workflowMode
      });

  return {
    directorScripts,
    extraction: mergedExtraction
  };
}

function resolveSessionRenderBundle(input: {
  directorScriptId?: string;
  languageCode?: string;
  productMetadata: ProductMetadata;
  rawBrief: Record<string, unknown>;
  requestedScenePlan?: Record<string, unknown>;
  session: StudioSessionRow;
}) {
  const resolved = resolveSessionDirectorContext({
    directorScriptsSource: input.session.director_scripts,
    extractionSource: input.session.extracted_context,
    languageCode: input.languageCode,
    productMetadata: input.productMetadata,
    rawBrief: input.rawBrief,
    workflowMode: input.session.workflow_mode
  });
  const selectedDirector = selectDirectorScript(resolved.directorScripts, input.directorScriptId);
  const plannerInput = buildTemplatePlannerInput(input.rawBrief, resolved.extraction, selectedDirector);
  const templatePlan = buildTemplatePlan(plannerInput);
  const requestedScenePlan = sanitizeObject(input.requestedScenePlan);
  const persistedScenePlan = sanitizeObject(input.session.scene_plan);
  const scenePlan = hasScenePlanScenes(requestedScenePlan)
    ? requestedScenePlan
    : hasScenePlanScenes(persistedScenePlan)
      ? persistedScenePlan
      : templatePlan.scenePlan;
  const renderSpecs = buildRenderSpecsFromScenePlan(scenePlan, input.rawBrief, selectedDirector);

  return {
    directorScripts: resolved.directorScripts,
    extraction: resolved.extraction,
    renderSpecs,
    scenePlan,
    selectedDirector,
    templateRenderSpec: {
      ...templatePlan.templateRenderSpec,
      scenePlan
    }
  };
}

function buildRenderBatchJobs(
  dispatchResults: PromiseSettledResult<{ job: Omit<RenderJobResponse, "workspaceId">; scene: Record<string, unknown> }>[],
  renderSpecs: Record<string, unknown>[]
) {
  const sceneJobs = dispatchResults.map((result, index) => {
    if (result.status === "fulfilled") {
      const scene = sanitizeObject(result.value.scene);
      return {
        durationFrames: normalizeDuration(scene.durationFrames, 90),
        job: result.value.job,
        jobId: result.value.job.jobId,
        kind: getStringValue(scene.kind, "scene"),
        sceneId: getStringValue(scene.id, `scene_${index + 1}`),
        status: getStringValue(result.value.job.status, "queued"),
        taskId: `scene_${index + 1}`,
        taskType: "scene"
      };
    }

    const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
    return {
      durationFrames: 90,
      errorMessage: reason,
      job: null,
      jobId: "",
      kind: "scene",
      sceneId: `scene_${index + 1}`,
      status: "failed",
      taskId: `scene_${index + 1}`,
      taskType: "scene"
    };
  });

  const auxiliaryJobs = renderSpecs
    .filter((spec) => {
      const type = getStringValue(spec.renderType);
      return type === "voiceover" || type === "music";
    })
    .map((spec) => {
      const type = getStringValue(spec.renderType);
      return {
        job: null,
        jobId: "",
        status: "completed",
        taskId: `${type}_${randomUUID().slice(0, 6)}`,
        taskType: type
      };
    });

  return [...sceneJobs, ...auxiliaryJobs];
}

function summarizeRenderBatchJobs(jobs: Record<string, unknown>[]) {
  const summary = {
    completed: 0,
    failed: 0,
    processing: 0,
    queued: 0,
    total: jobs.length
  };

  for (const job of jobs) {
    const status = getStringValue(job.status);
    if (status === "completed") {
      summary.completed += 1;
    } else if (status === "failed") {
      summary.failed += 1;
    } else if (status === "processing") {
      summary.processing += 1;
    } else {
      summary.queued += 1;
    }
  }

  return summary;
}

function deriveRenderBatchStatus(summary: {
  completed: number;
  failed: number;
  processing: number;
  queued: number;
  total: number;
}) {
  if (summary.total === 0) {
    return "failed";
  }

  if (summary.completed === summary.total && summary.failed === 0) {
    return "completed";
  }

  if (summary.failed > 0 && summary.completed+ summary.failed === summary.total) {
    return "failed";
  }

  return "processing";
}

function pickPrimarySceneBatchJob(jobs: Record<string, unknown>[]) {
  const sceneJobs = jobs
    .filter((job) => getStringValue(job.taskType) === "scene")
    .map((job) => sanitizeObject(job));
  if (sceneJobs.length === 0) {
    return null;
  }

  const completed = sceneJobs
    .filter((job) => getStringValue(job.status) === "completed")
    .sort((left, right) => normalizeDuration(right.durationFrames, 0) - normalizeDuration(left.durationFrames, 0));

  const preferred = completed[0] ?? sceneJobs[0];
  return {
    job: sanitizeObject(preferred.job)
  };
}

async function refreshRenderBatchJobsFromDownstream(
  request: FastifyRequest,
  jobs: Record<string, unknown>[]
) {
  const refreshed = await Promise.all(
    jobs.map(async (job) => {
      const normalized = sanitizeObject(job);
      const jobId = getStringValue(normalized.jobId);
      const taskType = getStringValue(normalized.taskType);

      if (!jobId || taskType !== "scene") {
        return normalized;
      }

      try {
        const result = await callInternalService<RenderJobResponse>(request, {
          path: `/internal/v1/render-jobs/${jobId}`,
          scope: ["media.render.read"],
          service: "media-processing-service"
        });

        return {
          ...normalized,
          job: stripWorkspaceRenderJob(result.data),
          outputAssetId: result.data.outputAssetId ?? null,
          providerJobId: result.data.providerJobId ?? null,
          providerName: result.data.providerName ?? null,
          status: result.data.status
        };
      } catch (error) {
        if (error instanceof DownstreamServiceError && error.statusCode === 404) {
          return {
            ...normalized,
            errorMessage: "Render job not found",
            status: "failed"
          };
        }

        const message = error instanceof Error ? error.message : String(error);
        return {
          ...normalized,
          errorMessage: message,
          status: "failed"
        };
      }
    })
  );

  return refreshed;
}

function pickBestCompletedSceneJob(sceneJobs: Record<string, unknown>[]) {
  const completed = sceneJobs
    .filter((job) => getStringValue(job.status) === "completed" && Boolean(getStringValue(job.outputAssetId)))
    .sort((left, right) => normalizeDuration(right.durationFrames, 0) - normalizeDuration(left.durationFrames, 0));
  const selected = completed[0];
  if (!selected) {
    return null;
  }

  return {
    job: sanitizeObject(selected.job),
    outputAssetId: getStringValue(selected.outputAssetId)
  };
}

function buildCaptionPackage(rawBrief: Record<string, unknown>, session: StudioSessionRow) {
  const niche = normalizeNiche(getStringValue(rawBrief.niche, "beauty"));
  const title = getStringValue(rawBrief.title, "Produk affiliate");
  const offerText = getStringValue(rawBrief.offerText, "promo terbatas");
  const ctaText = getStringValue(rawBrief.ctaText, "cek link di bio");
  const objective = normalizeObjective(getStringValue(rawBrief.objective, "promo_offer"));

  const caption = `✨ ${title} untuk ${offerText}. Fokus ${objective.replaceAll("_", " ")} dengan gaya ${session.workflow_mode}. ${ctaText}`;
  const baseHashtags = niche === "gadget"
    ? ["#gadget", "#techreview", "#fyp", "#tiktokshop", "#affiliate"]
    : niche === "fashion"
      ? ["#fashion", "#outfit", "#ootd", "#tiktokshop", "#affiliate"]
      : ["#skincare", "#beauty", "#tiktokshop", "#fyp", "#affiliate"];

  return {
    caption,
    hashtags: baseHashtags
  };
}

function buildAssemblyQualityGate(input: {
  batchSummary: {
    completed: number;
    failed: number;
    processing: number;
    queued: number;
    total: number;
  };
  outputAssetId: string;
  sceneCount: number;
}) {
  const minSceneThresholdPassed = input.sceneCount >= 3;
  const outputReady = Boolean(getStringValue(input.outputAssetId));
  const pass =
    input.batchSummary.failed === 0 &&
    input.batchSummary.queued === 0 &&
    input.batchSummary.processing === 0 &&
    minSceneThresholdPassed &&
    outputReady;

  return {
    minSceneThresholdPassed,
    outputReady,
    pass,
    sceneCount: input.sceneCount,
    summary: input.batchSummary
  };
}

function stripWorkspaceRenderJob(job: RenderJobResponse) {
  const { workspaceId: _ignored, ...publicJob } = job;
  return publicJob;
}

function selectDirectorScript(directorScripts: Record<string, unknown>[], requestedId?: string) {
  const requested = getStringValue(requestedId);
  if (requested) {
    const matched = directorScripts.find((item) => getStringValue(item.id) === requested);
    if (matched) {
      return matched;
    }
  }

  return directorScripts[0] ?? {};
}

function buildTemplatePlannerInput(
  rawBrief: Record<string, unknown>,
  extraction: ContextExtraction,
  directorScript: Record<string, unknown>
) {
  const directorHook = sanitizeObject(directorScript.hook);
  const directorCta = sanitizeObject(directorScript.cta);
  const directorBodyLines = ensureArrayOfObjects(directorScript.bodyScenes)
    .map((scene) => getStringValue(scene.text))
    .filter(Boolean);
  const hook = getStringValue(directorHook.text, `Hook: ${getStringValue(rawBrief.title, "Produk affiliate")}`);
  const body = directorBodyLines.join(" ").trim() || getStringValue(rawBrief.promptHint, "Body konten affiliate.");
  const cta = getStringValue(directorCta.text, getStringValue(rawBrief.ctaText, "Klik link produk sekarang"));
  const subtitleLines = [hook, ...directorBodyLines.slice(0, 2), cta].filter(Boolean);

  const productBrief = extraction.productBrief;

  return {
    aspectRatio: getStringValue(rawBrief.aspectRatio, "9:16"),
    brandTone: normalizeBrandTone(getStringValue(rawBrief.brandTone, "direct")),
    durationSeconds: normalizeDuration(getStringValue(rawBrief.durationSeconds), 18),
    musicMode: normalizeMusicMode(getStringValue(rawBrief.musicMode, "clean")),
    niche: normalizeNiche(getStringValue(rawBrief.niche, getStringValue(extraction.enrichedContext.niche, "beauty"))),
    objective: normalizeObjective(getStringValue(rawBrief.objective, getStringValue(productBrief.objective, "promo_offer"))),
    product: {
      ctaText: getStringValue(rawBrief.ctaText, getStringValue(productBrief.cta_text, cta)),
      description: getStringValue(rawBrief.promptHint, getStringValue(productBrief.prompt_hint, "")),
      imageUrl: getStringValue(rawBrief.productImageUrl),
      offerText: getStringValue(rawBrief.offerText, getStringValue(productBrief.offer_text, "")),
      presenterImageUrl: getStringValue(rawBrief.presenterImageUrl),
      priceText: getStringValue(rawBrief.priceText, getStringValue(productBrief.price_text, "")),
      subtitle: subtitleLines[1] ?? getStringValue(rawBrief.promptHint, ""),
      title: getStringValue(rawBrief.title, getStringValue(productBrief.product_name, "Produk affiliate"))
    },
    script: {
      body,
      cta,
      hook,
      subtitleLines
    }
  } as Parameters<typeof buildTemplatePlan>[0];
}

function hasScenePlanScenes(scenePlan: Record<string, unknown>) {
  return Array.isArray(scenePlan.scenes) && scenePlan.scenes.length > 0;
}

function buildSceneSpecsFromPlan(scenePlan: Record<string, unknown>, rawBrief: Record<string, unknown>) {
  const scenes = ensureArrayOfObjects(scenePlan.scenes);
  const hasProductImage = Boolean(getStringValue(rawBrief.productImageUrl));
  const hasPresenterImage = Boolean(getStringValue(rawBrief.presenterImageUrl));
  const videoEngine = getStringValue(rawBrief.videoEngine, "template_local");

  return scenes.map((scene, index) => {
    const layout = getStringValue(scene.layout, "hero");
    const kind = getStringValue(scene.kind, "hook");
    const renderType = inferSceneRenderType({
      hasPresenterImage,
      kind,
      layout,
      videoEngine
    });

    return {
      durationFrames: normalizeDuration(scene.durationFrames, 90),
      id: getStringValue(scene.id, `scene_${index + 1}`),
      kind,
      layout,
      renderType,
      requiresAsset: layout.includes("product") ? (hasProductImage ? "product_image" : "placeholder_image") : null,
      templateComponent: pickSceneComponentName(kind, layout)
    };
  });
}

function buildRenderSpecsFromScenePlan(
  scenePlan: Record<string, unknown>,
  rawBrief: Record<string, unknown>,
  directorScript: Record<string, unknown>
) {
  const scenes = buildSceneSpecsFromPlan(scenePlan, rawBrief);
  const sceneEntries = ensureArrayOfObjects(scenePlan.scenes);
  const directorVoiceover = sanitizeObject(directorScript.voiceover);
  const directorMusic = sanitizeObject(directorScript.backgroundMusic);

  const sceneRenderSpecs = scenes.map((scene) => {
    if (scene.renderType === "ai_prompt") {
      return {
        durationFrames: scene.durationFrames,
        provider: getStringValue(rawBrief.videoEngine, "fal_veo31_fast"),
        prompt: buildGenerativePrompt(rawBrief, scene),
        renderType: "ai_prompt",
        sceneId: scene.id
      };
    }

    return {
      component: scene.templateComponent,
      durationFrames: scene.durationFrames,
      props: {
        accentColor: pickAccentColor(normalizeNiche(getStringValue(rawBrief.niche, "beauty"))),
        priceText: getStringValue(rawBrief.priceText),
        productImageUrl: getStringValue(rawBrief.productImageUrl),
        presenterImageUrl: getStringValue(rawBrief.presenterImageUrl),
        sceneKind: scene.kind,
        textBlocks: ensureArrayOfObjects(
          sceneEntries.find((entry) => getStringValue(entry.id) === scene.id)?.textBlocks
        )
      },
      provider: "template",
      renderType: "remotion",
      sceneId: scene.id
    };
  });

  const audioSpecs = [
    {
      renderType: "voiceover",
      script: getStringValue(
        directorVoiceover.script,
        [getStringValue(rawBrief.title), getStringValue(rawBrief.promptHint), getStringValue(rawBrief.ctaText)]
          .filter(Boolean)
          .join(" ")
      ),
      speed: typeof directorVoiceover.speed === "number" ? directorVoiceover.speed : 1,
      voiceId: getStringValue(directorVoiceover.voiceId, "id-ID-female-warm")
    },
    {
      mood: getStringValue(directorMusic.mood, "soft upbeat trendy pop"),
      query: getStringValue(directorMusic.query, "trendy affiliate upbeat"),
      renderType: "music"
    }
  ];

  return [...sceneRenderSpecs, ...audioSpecs];
}

function inferSceneRenderType(input: {
  hasPresenterImage: boolean;
  kind: string;
  layout: string;
  videoEngine: string;
}) {
  if (input.videoEngine.startsWith("fal_") && (input.kind === "hook" || input.layout.includes("host"))) {
    return input.hasPresenterImage ? "remotion" : "ai_prompt";
  }

  return "remotion";
}

function pickSceneComponentName(kind: string, layout: string) {
  if (kind === "cta") {
    return "CTAScene";
  }

  if (kind === "offer") {
    return "OfferScene";
  }

  if (layout.includes("host")) {
    return "HostFrameScene";
  }

  if (kind === "benefit" || kind === "proof") {
    return "BenefitListScene";
  }

  return "TextHookScene";
}

function buildGenerativePrompt(rawBrief: Record<string, unknown>, scene: {
  durationFrames: number;
  id: string;
  kind: string;
  layout: string;
}) {
  return [
    `Create a ${scene.kind} scene for Indonesian commerce short video.`,
    `Layout intent: ${scene.layout}.`,
    `Product: ${getStringValue(rawBrief.title, "affiliate product")}.`,
    `Tone: ${getStringValue(rawBrief.brandTone, "direct")}.`,
    `Duration frames: ${scene.durationFrames}.`,
    "Camera: stable handheld, clean background, modern premium lighting.",
    "Avoid logos, avoid watermark, avoid text artifacts."
  ].join(" ");
}

function normalizeNiche(value: string): "beauty" | "fashion" | "gadget" {
  if (value === "fashion" || value === "gadget" || value === "beauty") {
    return value;
  }

  return inferNicheFromText(value);
}

function normalizeObjective(value: string): "comparison" | "problem_solution" | "promo_offer" | "testimonial_style" {
  if (value === "comparison" || value === "problem_solution" || value === "promo_offer" || value === "testimonial_style") {
    return value;
  }

  return "promo_offer";
}

function normalizeBrandTone(value: string): "soft" | "confident" | "direct" | "playful" | "premium" {
  if (value === "soft" || value === "confident" || value === "direct" || value === "playful" || value === "premium") {
    return value;
  }

  return "direct";
}

function normalizeMusicMode(value: string): "none" | "clean" | "upbeat" | "dramatic" {
  if (value === "none" || value === "clean" || value === "upbeat" || value === "dramatic") {
    return value;
  }

  return "clean";
}

function normalizeDuration(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(1, Math.floor(numeric));
}

function pickAccentColor(niche: "beauty" | "fashion" | "gadget") {
  if (niche === "gadget") {
    return "#0ea5e9";
  }

  if (niche === "fashion") {
    return "#ec4899";
  }

  return "#f97316";
}

function isUuidLike(value: string) {
  return /^[a-zA-Z0-9_-]{6,64}$/.test(value);
}

function capitalizeText(input: string) {
  if (!input) {
    return "";
  }

  return input.charAt(0).toUpperCase() + input.slice(1);
}

function defaultAnglesFromObjective(objective: string) {
  const mapping: Record<string, string[]> = {
    comparison: ["value_comparison", "best_pick"],
    problem_solution: ["pain_solution", "benefit_proof"],
    promo_offer: ["urgency_offer", "daily_benefit"],
    testimonial_style: ["trusted_review", "daily_routine"]
  };

  return mapping[objective] ?? ["daily_benefit"];
}

function defaultBenefitsByNiche(niche: "beauty" | "fashion" | "gadget") {
  if (niche === "gadget") {
    return ["pemakaian praktis", "fitur relevan harian", "harga kompetitif"];
  }

  if (niche === "fashion") {
    return ["mudah dipadu padan", "nyaman dipakai", "look lebih rapi"];
  }

  return ["kulit tampak lebih sehat", "pemakaian simpel", "aman untuk harian"];
}

function defaultPainPointByNiche(niche: "beauty" | "fashion" | "gadget") {
  if (niche === "gadget") {
    return "alat lama kurang efisien untuk aktivitas harian";
  }

  if (niche === "fashion") {
    return "susah cari outfit yang tetap rapi tapi nyaman";
  }

  return "kulit terlihat kusam dan butuh perawatan yang praktis";
}

function defaultVisualGuideByNiche(niche: "beauty" | "fashion" | "gadget") {
  if (niche === "gadget") {
    return "clean dark background, spec callout, quick zoom transition";
  }

  if (niche === "fashion") {
    return "bright editorial frame, full-body crop, fabric close-up";
  }

  return "clean white background, close-up product, soft pastel accent";
}

function defaultMusicMoodByNiche(niche: "beauty" | "fashion" | "gadget") {
  if (niche === "gadget") {
    return "energetic tech groove";
  }

  if (niche === "fashion") {
    return "stylish upbeat pop";
  }

  return "soft upbeat trendy pop";
}

function defaultCtaPatternsByNiche(niche: "beauty" | "fashion" | "gadget") {
  if (niche === "gadget") {
    return ["cek spek lengkap", "bandingkan sekarang", "stok promo terbatas"];
  }

  if (niche === "fashion") {
    return ["cek ukuran sekarang", "lihat warna favoritmu", "promo hari ini saja"];
  }

  return ["link di bio", "stok terbatas", "cek promo sekarang"];
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
