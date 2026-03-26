import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { authenticateUserRequest, ensureWorkspaceScope } from "../../lib/auth.js";
import { query, withTransaction } from "../../lib/database.js";
import { badRequest, internalError } from "../../lib/http.js";

type TrendWatchlistRow = {
  id: string;
  period: "daily" | "weekly";
  recommendation_text: string;
  score: number | string | null;
  signal_type: "topic" | "product" | "angle" | "keyword" | null;
  title: string;
};

type TrendDigestRow = {
  generated_at: string;
  id: string;
  period: "daily" | "weekly";
  summary: string;
};

type TrendRecommendationRow = {
  recommendation_text: string;
  title: string;
};

export function registerTrendRoutes(app: FastifyInstance) {
  app.post("/v1/trend/collect", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const body = request.body as {
      period?: "daily" | "weekly";
      recommendationText?: string;
      recommendationType?: "topic" | "product" | "angle" | "cta";
      score?: number;
      signalType?: "topic" | "product" | "angle" | "keyword";
      sourceCode?: string;
      sourceName?: string;
      summary?: string;
      title?: string;
      workspaceId?: string;
    };

    try {
      const workspaceId = body.workspaceId ?? request.userAuth?.workspaceId;
      const workspaceError = ensureWorkspaceScope(request, reply, workspaceId);
      if (workspaceError) {
        return workspaceError;
      }

      if (!workspaceId) {
        return badRequest(reply, "workspaceId is required");
      }

      const score = normalizeScore(body.score);
      const sourceCode = body.sourceCode ?? "manual_input";
      const sourceName = body.sourceName ?? "Manual Input";
      const signalType = body.signalType ?? "topic";
      const recommendationType = body.recommendationType ?? "topic";
      const title = body.title ?? "Konten yang sedang naik minggu ini";
      const recommendationText =
        body.recommendationText ??
        "Gunakan angle ini untuk konten pendek dengan hook cepat, manfaat utama, dan CTA yang jelas.";
      const period = body.period ?? "daily";
      const summary = body.summary ?? `Watchlist ${period} untuk ${title}.`;

      const result = await withTransaction(async (client) => {
        const sourceId = await upsertTrendSource(client, {
          sourceCode,
          sourceName
        });

        const collectionRunId = randomUUID();
        await client.query(
          `
            INSERT INTO trend.trend_collection_runs (
              id,
              workspace_id,
              source_id,
              trigger_mode,
              status,
              started_at,
              completed_at,
              summary
            )
            VALUES ($1, $2, $3, 'manual', 'completed', NOW(), NOW(), $4)
          `,
          [collectionRunId, workspaceId, sourceId, summary]
        );

        const snapshotId = randomUUID();
        await client.query(
          `
            INSERT INTO trend.trend_signal_snapshots (
              id,
              workspace_id,
              source_id,
              collection_run_id,
              signal_type,
              title,
              metrics_json
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
          `,
          [
            snapshotId,
            workspaceId,
            sourceId,
            collectionRunId,
            signalType,
            title,
            JSON.stringify({ totalScore: score })
          ]
        );

        const scoreId = randomUUID();
        await client.query(
          `
            INSERT INTO trend.trend_scores (
              id,
              workspace_id,
              signal_snapshot_id,
              momentum_score,
              acceleration_score,
              saturation_score,
              seasonality_score,
              total_score
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `,
          [
            scoreId,
            workspaceId,
            snapshotId,
            score,
            Math.max(score - 8, 0),
            Math.min(score + 5, 100),
            Math.max(score - 12, 0),
            score
          ]
        );

        const recommendationId = randomUUID();
        await client.query(
          `
            INSERT INTO trend.trend_recommendations (
              id,
              workspace_id,
              signal_snapshot_id,
              score_id,
              collection_run_id,
              recommendation_type,
              title,
              recommendation_text,
              period,
              status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
          `,
          [
            recommendationId,
            workspaceId,
            snapshotId,
            scoreId,
            collectionRunId,
            recommendationType,
            title,
            recommendationText,
            period
          ]
        );

        const digestId = randomUUID();
        await client.query(
          `
            INSERT INTO trend.trend_digests (
              id,
              workspace_id,
              collection_run_id,
              period,
              summary
            )
            VALUES ($1, $2, $3, $4, $5)
          `,
          [digestId, workspaceId, collectionRunId, period, summary]
        );

        await client.query(
          `
            INSERT INTO trend.trend_digest_items (
              digest_id,
              recommendation_id,
              position
            )
            VALUES ($1, $2, 1)
          `,
          [digestId, recommendationId]
        );

        return {
          collectionRunId,
          digestId,
          recommendationId,
          snapshotId,
          status: "completed"
        };
      });

      return reply.code(201).send(result);
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.get("/v1/trend/watchlist", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const workspaceId = request.userAuth?.workspaceId;
    const workspaceError = ensureWorkspaceScope(request, reply, workspaceId);
    if (workspaceError) {
      return workspaceError;
    }

    if (!workspaceId) {
      return badRequest(reply, "workspaceId is required");
    }

    try {
      const result = await query<TrendWatchlistRow>(
        `
          SELECT
            r.id,
            r.title,
            r.recommendation_text,
            r.period,
            ss.signal_type,
            COALESCE(ts.total_score, 0) AS score
          FROM trend.trend_recommendations r
          LEFT JOIN trend.trend_signal_snapshots ss ON ss.id = r.signal_snapshot_id
          LEFT JOIN trend.trend_scores ts ON ts.id = r.score_id
          WHERE r.workspace_id = $1
            AND r.status = 'active'
          ORDER BY r.created_at DESC, ts.total_score DESC NULLS LAST
          LIMIT 25
        `,
        [workspaceId]
      );

      return reply.send({
        items: result.rows.map((row) => ({
          id: row.id,
          period: row.period,
          recommendationText: row.recommendation_text,
          score: Number(row.score ?? 0),
          signalType: row.signal_type ?? "topic",
          title: row.title
        }))
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.get("/v1/trend/digests/latest", { preHandler: authenticateUserRequest }, async (request, reply) => {
    const workspaceId = request.userAuth?.workspaceId;
    const workspaceError = ensureWorkspaceScope(request, reply, workspaceId);
    if (workspaceError) {
      return workspaceError;
    }

    if (!workspaceId) {
      return badRequest(reply, "workspaceId is required");
    }

    const periodParam = (request.query as { period?: "daily" | "weekly" }).period;
    const period = periodParam === "weekly" ? "weekly" : "daily";

    try {
      const digestResult = await query<TrendDigestRow>(
        `
          SELECT
            id,
            period,
            summary,
            generated_at
          FROM trend.trend_digests
          WHERE workspace_id = $1
            AND period = $2
          ORDER BY generated_at DESC
          LIMIT 1
        `,
        [workspaceId, period]
      );

      const digest = digestResult.rows[0];
      if (!digest) {
        return reply.code(404).send({ error: "No trend digest available yet" });
      }

      const itemsResult = await query<TrendWatchlistRow>(
        `
          SELECT
            r.id,
            r.title,
            r.recommendation_text,
            r.period,
            ss.signal_type,
            COALESCE(ts.total_score, 0) AS score
          FROM trend.trend_digest_items di
          INNER JOIN trend.trend_recommendations r ON r.id = di.recommendation_id
          LEFT JOIN trend.trend_signal_snapshots ss ON ss.id = r.signal_snapshot_id
          LEFT JOIN trend.trend_scores ts ON ts.id = r.score_id
          WHERE di.digest_id = $1
          ORDER BY di.position ASC, r.created_at DESC
        `,
        [digest.id]
      );

      return reply.send({
        digestId: digest.id,
        generatedAt: digest.generated_at,
        items: itemsResult.rows.map((row) => ({
          id: row.id,
          period: row.period,
          recommendationText: row.recommendation_text,
          score: Number(row.score ?? 0),
          signalType: row.signal_type ?? "topic",
          title: row.title
        })),
        period: digest.period,
        summary: digest.summary
      });
    } catch (error) {
      request.log.error(error);
      return internalError(reply);
    }
  });

  app.post(
    "/v1/trend/recommendations/:recommendationId/content-request",
    { preHandler: authenticateUserRequest },
    async (request, reply) => {
      const workspaceId = request.userAuth?.workspaceId;
      const workspaceError = ensureWorkspaceScope(request, reply, workspaceId);
      if (workspaceError) {
        return workspaceError;
      }

      if (!workspaceId || !request.userAuth?.userId) {
        return badRequest(reply, "workspaceId and user context are required");
      }

      const params = request.params as { recommendationId?: string };
      const body = request.body as {
        promptHint?: string;
        titleOverride?: string;
      } | undefined;

      if (!params.recommendationId) {
        return badRequest(reply, "recommendationId is required");
      }

      try {
        const recommendationResult = await query<TrendRecommendationRow>(
          `
            SELECT
              title,
              recommendation_text
            FROM trend.trend_recommendations
            WHERE id = $1
              AND workspace_id = $2
            LIMIT 1
          `,
          [params.recommendationId, workspaceId]
        );

        const recommendation = recommendationResult.rows[0];
        if (!recommendation) {
          return reply.code(404).send({ error: "Trend recommendation not found" });
        }

        const title = body?.titleOverride?.trim() || recommendation.title;
        const scriptBody = buildTrendScript({
          promptHint: body?.promptHint,
          recommendationText: recommendation.recommendation_text,
          title
        });

        const scriptResult = await withTransaction(async (client) => {
          const result = await client.query<{ id: string }>(
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
              VALUES ($1, $2, 'ai_generate', $3, $4, $5, $6, 'id', 'draft')
              RETURNING id
            `,
            [
              workspaceId,
              request.userAuth!.userId,
              title,
              `Hook: ${title}`,
              scriptBody,
              "Uji angle ini sekarang dan lihat respon audiens."
            ]
          );

          await client.query(
            `
              UPDATE trend.trend_recommendations
              SET
                status = 'converted',
                updated_at = NOW()
              WHERE id = $1
                AND workspace_id = $2
            `,
            [params.recommendationId, workspaceId]
          );

          return result.rows[0].id;
        });

        return reply.code(202).send({
          contentRequestId: scriptResult,
          status: "queued"
        });
      } catch (error) {
        request.log.error(error);
        return internalError(reply);
      }
    }
  );
}

async function upsertTrendSource(
  client: {
    query: (text: string, values?: unknown[]) => Promise<{ rows: Array<{ id: string }> }>;
  },
  input: { sourceCode: string; sourceName: string }
) {
  const result = await client.query(
    `
      INSERT INTO trend.trend_sources (
        source_code,
        name,
        source_type
      )
      VALUES ($1, $2, 'manual')
      ON CONFLICT (source_code)
      DO UPDATE
      SET
        name = EXCLUDED.name,
        updated_at = NOW()
      RETURNING id
    `,
    [input.sourceCode, input.sourceName]
  );

  return result.rows[0].id;
}

function normalizeScore(input?: number) {
  if (typeof input !== "number" || Number.isNaN(input)) {
    return 72;
  }

  return Math.max(0, Math.min(100, Number(input.toFixed(2))));
}

function buildTrendScript(input: {
  promptHint?: string;
  recommendationText: string;
  title: string;
}) {
  const lines = [
    `Judul konten: ${input.title}.`,
    `Insight trend: ${input.recommendationText}.`,
    "Opening: sebutkan kenapa topik ini relevan sekarang.",
    "Body: jelaskan manfaat atau angle paling tajam untuk audiens.",
    "CTA: ajak user untuk cek produk, follow, atau save kontennya."
  ];

  if (input.promptHint) {
    lines.push(`Hint tambahan: ${input.promptHint}.`);
  }

  return lines.join(" ");
}
