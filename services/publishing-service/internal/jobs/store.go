package jobs

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrPublishJobNotFound = errors.New("publish job not found")

type Store struct {
	pool *pgxpool.Pool
}

type CreatePublishJobInput struct {
	AssetID            string
	CaptionID          string
	ConnectedAccountID string
	IdempotencyKey     string
	PlatformCode       string
	ScheduledFor       string
	WorkspaceID        string
}

type DispatchablePublishJob struct {
	AssetID            string
	CaptionID          string
	ConnectedAccountID string
	JobID              string
	PlatformCode       string
	WorkspaceID        string
}

type PublishJob struct {
	JobID            string  `json:"jobId"`
	LastErrorMessage *string `json:"lastErrorMessage,omitempty"`
	PlatformCode     string  `json:"platformCode"`
	PublishedAt      *string `json:"publishedAt,omitempty"`
	ScheduledFor     string  `json:"scheduledFor"`
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

func (s *Store) CreatePublishJob(ctx context.Context, input CreatePublishJobInput) (PublishJob, error) {
	row := s.pool.QueryRow(
		ctx,
		`
      INSERT INTO publishing.publish_jobs (
        workspace_id,
        connected_account_id,
        asset_id,
        caption_id,
        platform_code,
        status,
        scheduled_for,
        idempotency_key
      )
      VALUES (
        $1,
        NULLIF($2, '')::uuid,
        NULLIF($3, '')::uuid,
        NULLIF($4, '')::uuid,
        $5,
        'scheduled',
        $6::timestamptz,
        $7
      )
      ON CONFLICT (idempotency_key) DO UPDATE
      SET updated_at = publishing.publish_jobs.updated_at
      RETURNING id, status, platform_code, scheduled_for::text, workspace_id, published_at::text, last_error_message
    `,
		input.WorkspaceID,
		input.ConnectedAccountID,
		input.AssetID,
		input.CaptionID,
		input.PlatformCode,
		input.ScheduledFor,
		input.IdempotencyKey,
	)

	var job PublishJob
	err := row.Scan(
		&job.JobID,
		&job.Status,
		&job.PlatformCode,
		&job.ScheduledFor,
		&job.WorkspaceID,
		&job.PublishedAt,
		&job.LastErrorMessage,
	)
	return job, err
}

func (s *Store) GetPublishJob(ctx context.Context, jobID string) (PublishJob, error) {
	row := s.pool.QueryRow(
		ctx,
		`
      SELECT
        id,
        status,
        platform_code,
        scheduled_for::text,
        workspace_id,
        published_at::text,
        last_error_message
      FROM publishing.publish_jobs
      WHERE id = $1
      LIMIT 1
    `,
		jobID,
	)

	var job PublishJob
	err := row.Scan(
		&job.JobID,
		&job.Status,
		&job.PlatformCode,
		&job.ScheduledFor,
		&job.WorkspaceID,
		&job.PublishedAt,
		&job.LastErrorMessage,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return PublishJob{}, ErrPublishJobNotFound
	}

	return job, err
}

func (s *Store) ClaimNextPublishJob(ctx context.Context, workerID string, leaseSeconds int) (*DispatchablePublishJob, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	row := tx.QueryRow(
		ctx,
		`
      WITH candidate AS (
        SELECT id
        FROM publishing.publish_jobs
        WHERE status IN ('scheduled', 'queued')
          AND scheduled_for <= NOW()
        ORDER BY scheduled_for ASC, created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE publishing.publish_jobs AS job
      SET
        status = 'processing',
        attempts = attempts + 1,
        lease_owner = $1,
        leased_until = NOW() + make_interval(secs => $2),
        updated_at = NOW()
      FROM candidate
      WHERE job.id = candidate.id
      RETURNING
        job.id,
        COALESCE(job.asset_id::text, ''),
        COALESCE(job.caption_id::text, ''),
        COALESCE(job.connected_account_id::text, ''),
        job.platform_code,
        job.workspace_id
    `,
		workerID,
		leaseSeconds,
	)

	var job DispatchablePublishJob
	if err := row.Scan(
		&job.JobID,
		&job.AssetID,
		&job.CaptionID,
		&job.ConnectedAccountID,
		&job.PlatformCode,
		&job.WorkspaceID,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &job, nil
}

func (s *Store) MarkPublishJobPublished(ctx context.Context, jobID string) error {
	_, err := s.pool.Exec(
		ctx,
		`
      UPDATE publishing.publish_jobs
      SET
        status = 'published',
        published_at = NOW(),
        lease_owner = NULL,
        leased_until = NULL,
        last_error_code = NULL,
        last_error_message = NULL,
        updated_at = NOW()
      WHERE id = $1
    `,
		jobID,
	)

	return err
}

func (s *Store) MarkPublishJobFailed(ctx context.Context, jobID string, errorCode string, errorMessage string) error {
	_, err := s.pool.Exec(
		ctx,
		`
      UPDATE publishing.publish_jobs
      SET
        status = 'failed',
        lease_owner = NULL,
        leased_until = NULL,
        last_error_code = NULLIF($2, ''),
        last_error_message = NULLIF($3, ''),
        updated_at = NOW()
      WHERE id = $1
    `,
		jobID,
		errorCode,
		errorMessage,
	)

	return err
}
