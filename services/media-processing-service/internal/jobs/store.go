package jobs

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrRenderJobNotFound = errors.New("render job not found")

type Store struct {
	pool *pgxpool.Pool
}

type CreateRenderJobInput struct {
	RequestedByUserID string
	ScriptID          string
	SourceAssetID     string
	WorkspaceID       string
}

type RenderJob struct {
	CompletedAt      *string `json:"completedAt,omitempty"`
	JobID            string  `json:"jobId"`
	LastErrorMessage *string `json:"lastErrorMessage,omitempty"`
	OutputAssetID    *string `json:"outputAssetId,omitempty"`
	StartedAt        *string `json:"startedAt,omitempty"`
	Status           string  `json:"status"`
	WorkspaceID      string  `json:"workspaceId"`
}

func NewStore(ctx context.Context, databaseURL string) (*Store, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, err
	}

	return &Store{pool: pool}, nil
}

func (s *Store) Close() {
	if s == nil || s.pool == nil {
		return
	}

	s.pool.Close()
}

func (s *Store) CreateRenderJob(ctx context.Context, input CreateRenderJobInput) (RenderJob, error) {
	row := s.pool.QueryRow(
		ctx,
		`
      INSERT INTO media.render_jobs (
        workspace_id,
        source_asset_id,
        script_id,
        requested_by_user_id,
        status
      )
      VALUES ($1, $2, NULLIF($3, '')::uuid, NULLIF($4, '')::uuid, 'queued')
      RETURNING id, status, workspace_id
    `,
		input.WorkspaceID,
		input.SourceAssetID,
		input.ScriptID,
		input.RequestedByUserID,
	)

	var job RenderJob
	err := row.Scan(&job.JobID, &job.Status, &job.WorkspaceID)
	return job, err
}

func (s *Store) GetRenderJob(ctx context.Context, jobID string) (RenderJob, error) {
	row := s.pool.QueryRow(
		ctx,
		`
      SELECT
        id,
        status,
        workspace_id,
        output_asset_id::text,
        started_at::text,
        completed_at::text,
        last_error_message
      FROM media.render_jobs
      WHERE id = $1
      LIMIT 1
    `,
		jobID,
	)

	var job RenderJob
	err := row.Scan(
		&job.JobID,
		&job.Status,
		&job.WorkspaceID,
		&job.OutputAssetID,
		&job.StartedAt,
		&job.CompletedAt,
		&job.LastErrorMessage,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return RenderJob{}, ErrRenderJobNotFound
	}

	return job, err
}
