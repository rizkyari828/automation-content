package jobs

import (
	"crypto/sha256"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/creatorflow/automation-content/services/media-processing-service/internal/render"
)

var ErrRenderJobNotFound = errors.New("render job not found")
var ErrRenderOutputNotReady = errors.New("render output not ready")
var ErrClipJobNotFound = errors.New("clip job not found")
var ErrClipOutputNotReady = errors.New("clip output not ready")

type Store struct {
	pool *pgxpool.Pool
}

type CreateRenderJobInput struct {
	RenderSpec        render.RequestSpec
	RequestedByUserID string
	ScriptID          string
	SourceAssetID     string
	WorkspaceID       string
}

type RenderJob struct {
	CompletedAt       *string `json:"completedAt,omitempty"`
	JobID             string  `json:"jobId"`
	LastErrorMessage  *string `json:"lastErrorMessage,omitempty"`
	OutputAssetID     *string `json:"outputAssetId,omitempty"`
	PreferredProvider string `json:"preferredProvider,omitempty"`
	ProviderJobID     *string `json:"providerJobId,omitempty"`
	ProviderName      *string `json:"providerName,omitempty"`
	RenderMode        string  `json:"renderMode,omitempty"`
	StartedAt         *string `json:"startedAt,omitempty"`
	Status            string  `json:"status"`
	WorkspaceID       string  `json:"workspaceId"`
}

type RenderJobMetadata struct {
	RenderRequest render.RequestSpec `json:"renderRequest"`
}

type RenderJobOutput struct {
	FilePath       string
	MimeType       string
	PosterFilePath string
	PosterMimeType string
	WorkspaceID    string
}

type DispatchableRenderJob struct {
	JobID             string
	Metadata          RenderJobMetadata
	RequestedByUserID string
	ScriptID          string
	SourceAssetID     string
	WorkspaceID       string
}

type MarkRenderJobDispatchedInput struct {
	JobID         string
	ProviderJobID string
	ProviderName  string
}

type MarkRenderJobFailedInput struct {
	ErrorCode    string
	ErrorMessage string
	JobID        string
}

type MarkRenderJobCompletedInput struct {
	ArtifactMetadata  map[string]any
	AssetType         string
	FilePath          string
	JobID             string
	MimeType          string
	PosterFilePath    string
	PosterMimeType    string
	ProviderJobID     string
	ProviderName      string
	RequestedByUserID string
	StorageBucket     string
	WorkspaceID       string
}

type CreateClipJobInput struct {
	CandidateID       string
	EndSec            float64
	Hook              string
	RequestedByUserID string
	SourceAssetID     string
	StartSec          float64
	Summary           string
	Title             string
	WorkspaceID       string
}

type ClipJob struct {
	CompletedAt      *string `json:"completedAt,omitempty"`
	JobID            string  `json:"jobId"`
	LastErrorMessage *string `json:"lastErrorMessage,omitempty"`
	OutputAssetID    *string `json:"outputAssetId,omitempty"`
	StartedAt        *string `json:"startedAt,omitempty"`
	Status           string  `json:"status"`
	WorkspaceID      string  `json:"workspaceId"`
}

type ClipJobMetadata struct {
	CandidateID string  `json:"candidateId,omitempty"`
	DurationSec float64 `json:"durationSec"`
	EndSec      float64 `json:"endSec"`
	Hook        string  `json:"hook,omitempty"`
	StartSec    float64 `json:"startSec"`
	Summary     string  `json:"summary,omitempty"`
	Title       string  `json:"title,omitempty"`
}

type ClipJobOutput struct {
	FilePath    string
	MimeType    string
	WorkspaceID string
}

type DispatchableClipJob struct {
	JobID             string
	Metadata          ClipJobMetadata
	RequestedByUserID string
	SourceAssetID     string
	SourceMimeType    string
	SourceStorageKey  string
	WorkspaceID       string
}

type MarkClipJobFailedInput struct {
	ErrorCode    string
	ErrorMessage string
	JobID        string
}

type MarkClipJobCompletedInput struct {
	ArtifactMetadata  map[string]any
	FilePath          string
	JobID             string
	MimeType          string
	RequestedByUserID string
	StorageBucket     string
	WorkspaceID       string
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
	metadataJSON, err := json.Marshal(RenderJobMetadata{
		RenderRequest: render.NormalizeSpec(input.RenderSpec),
	})
	if err != nil {
		return RenderJob{}, fmt.Errorf("marshal render metadata: %w", err)
	}

	row := s.pool.QueryRow(
		ctx,
		`
      INSERT INTO media.render_jobs (
        metadata,
        workspace_id,
        source_asset_id,
        script_id,
        requested_by_user_id,
        status
      )
      VALUES ($1::jsonb, $2, NULLIF($3, '')::uuid, NULLIF($4, '')::uuid, NULLIF($5, '')::uuid, 'queued')
      RETURNING
        id,
        status,
        workspace_id,
        NULL::text,
        provider_name,
        provider_job_id,
        metadata,
        started_at::text,
        completed_at::text,
        last_error_message
    `,
		string(metadataJSON),
		input.WorkspaceID,
		input.SourceAssetID,
		input.ScriptID,
		input.RequestedByUserID,
	)

	return scanRenderJob(row)
}

func (s *Store) CreateClipJob(ctx context.Context, input CreateClipJobInput) (ClipJob, error) {
	durationSec := input.EndSec - input.StartSec
	if durationSec < 0 {
		durationSec = 0
	}

	metadataJSON, err := json.Marshal(ClipJobMetadata{
		CandidateID: input.CandidateID,
		DurationSec: durationSec,
		EndSec:      input.EndSec,
		Hook:        input.Hook,
		StartSec:    input.StartSec,
		Summary:     input.Summary,
		Title:       input.Title,
	})
	if err != nil {
		return ClipJob{}, fmt.Errorf("marshal clip metadata: %w", err)
	}

	row := s.pool.QueryRow(
		ctx,
		`
      INSERT INTO media.clip_jobs (
        metadata,
        workspace_id,
        source_asset_id,
        requested_by_user_id,
        status
      )
      VALUES ($1::jsonb, $2, $3::uuid, NULLIF($4, '')::uuid, 'queued')
      RETURNING
        id,
        status,
        workspace_id,
        output_asset_id::text,
        started_at::text,
        completed_at::text,
        last_error_message
    `,
		string(metadataJSON),
		input.WorkspaceID,
		input.SourceAssetID,
		input.RequestedByUserID,
	)

	return scanClipJob(row)
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
        provider_name,
        provider_job_id,
        metadata,
        started_at::text,
        completed_at::text,
        last_error_message
      FROM media.render_jobs
      WHERE id = $1
      LIMIT 1
    `,
		jobID,
	)

	job, err := scanRenderJob(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return RenderJob{}, ErrRenderJobNotFound
	}

	return job, err
}

func (s *Store) GetClipJob(ctx context.Context, jobID string) (ClipJob, error) {
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
      FROM media.clip_jobs
      WHERE id = $1
      LIMIT 1
    `,
		jobID,
	)

	job, err := scanClipJob(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return ClipJob{}, ErrClipJobNotFound
	}

	return job, err
}

func (s *Store) GetRenderJobOutput(ctx context.Context, jobID string) (RenderJobOutput, error) {
	row := s.pool.QueryRow(
		ctx,
		`
      SELECT
        job.status,
        job.workspace_id,
        COALESCE(asset.storage_key, ''),
        COALESCE(asset.mime_type, 'application/octet-stream'),
        COALESCE(asset.metadata ->> 'posterPath', ''),
        COALESCE(asset.metadata ->> 'posterMimeType', '')
      FROM media.render_jobs AS job
      LEFT JOIN asset.assets AS asset
        ON asset.id = job.output_asset_id
      WHERE job.id = $1
      LIMIT 1
    `,
		jobID,
	)

	var (
		status string
		output RenderJobOutput
	)

	if err := row.Scan(
		&status,
		&output.WorkspaceID,
		&output.FilePath,
		&output.MimeType,
		&output.PosterFilePath,
		&output.PosterMimeType,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return RenderJobOutput{}, ErrRenderJobNotFound
		}

		return RenderJobOutput{}, err
	}

	if status != "completed" || output.FilePath == "" {
		return RenderJobOutput{}, ErrRenderOutputNotReady
	}

	return output, nil
}

func (s *Store) GetClipJobOutput(ctx context.Context, jobID string) (ClipJobOutput, error) {
	row := s.pool.QueryRow(
		ctx,
		`
      SELECT
        job.status,
        job.workspace_id,
        COALESCE(asset.storage_key, ''),
        COALESCE(asset.mime_type, 'application/octet-stream')
      FROM media.clip_jobs AS job
      LEFT JOIN asset.assets AS asset
        ON asset.id = job.output_asset_id
      WHERE job.id = $1
      LIMIT 1
    `,
		jobID,
	)

	var (
		status string
		output ClipJobOutput
	)

	if err := row.Scan(
		&status,
		&output.WorkspaceID,
		&output.FilePath,
		&output.MimeType,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ClipJobOutput{}, ErrClipJobNotFound
		}

		return ClipJobOutput{}, err
	}

	if status != "completed" || output.FilePath == "" {
		return ClipJobOutput{}, ErrClipOutputNotReady
	}

	return output, nil
}

func (s *Store) ClaimNextRenderJob(ctx context.Context, workerID string, leaseSeconds int) (*DispatchableRenderJob, error) {
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
        FROM media.render_jobs
        WHERE status = 'queued'
          AND scheduled_for <= NOW()
        ORDER BY scheduled_for ASC, created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE media.render_jobs AS job
      SET
        status = 'processing',
        attempts = attempts + 1,
        lease_owner = $1,
        leased_until = NOW() + make_interval(secs => $2),
        started_at = COALESCE(started_at, NOW()),
        updated_at = NOW()
      FROM candidate
	      WHERE job.id = candidate.id
	      RETURNING
	        job.id,
	        job.workspace_id,
	        COALESCE(job.source_asset_id::text, ''),
	        COALESCE(job.script_id::text, ''),
	        COALESCE(job.requested_by_user_id::text, ''),
	        job.metadata
	    `,
		workerID,
		leaseSeconds,
	)

	var (
		job          DispatchableRenderJob
		metadataJSON []byte
	)

	if err := row.Scan(&job.JobID, &job.WorkspaceID, &job.SourceAssetID, &job.ScriptID, &job.RequestedByUserID, &metadataJSON); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	if len(metadataJSON) > 0 {
		if err := json.Unmarshal(metadataJSON, &job.Metadata); err != nil {
			return nil, fmt.Errorf("decode render metadata: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &job, nil
}

func (s *Store) ClaimNextClipJob(ctx context.Context, workerID string, leaseSeconds int) (*DispatchableClipJob, error) {
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
        FROM media.clip_jobs
        WHERE status = 'queued'
          AND scheduled_for <= NOW()
        ORDER BY scheduled_for ASC, created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE media.clip_jobs AS job
      SET
        status = 'processing',
        attempts = attempts + 1,
        lease_owner = $1,
        leased_until = NOW() + make_interval(secs => $2),
        started_at = COALESCE(started_at, NOW()),
        updated_at = NOW()
      FROM candidate
      WHERE job.id = candidate.id
      RETURNING
        job.id,
        job.workspace_id,
        job.source_asset_id::text,
        COALESCE(job.requested_by_user_id::text, ''),
        job.metadata
    `,
		workerID,
		leaseSeconds,
	)

	var (
		job          DispatchableClipJob
		metadataJSON []byte
	)

	if err := row.Scan(&job.JobID, &job.WorkspaceID, &job.SourceAssetID, &job.RequestedByUserID, &metadataJSON); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	if len(metadataJSON) > 0 {
		if err := json.Unmarshal(metadataJSON, &job.Metadata); err != nil {
			return nil, fmt.Errorf("decode clip metadata: %w", err)
		}
	}

	if err := tx.QueryRow(
		ctx,
		`
      SELECT
        COALESCE(storage_key, ''),
        COALESCE(mime_type, 'application/octet-stream')
      FROM asset.assets
      WHERE id = $1::uuid
      LIMIT 1
    `,
		job.SourceAssetID,
	).Scan(&job.SourceStorageKey, &job.SourceMimeType); err != nil {
		return nil, fmt.Errorf("load clip source asset: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &job, nil
}

func (s *Store) MarkRenderJobDispatched(ctx context.Context, input MarkRenderJobDispatchedInput) error {
	_, err := s.pool.Exec(
		ctx,
		`
      UPDATE media.render_jobs
      SET
        provider_name = NULLIF($2, ''),
        provider_job_id = NULLIF($3, ''),
        lease_owner = NULL,
        leased_until = NULL,
        updated_at = NOW()
      WHERE id = $1
    `,
		input.JobID,
		input.ProviderName,
		input.ProviderJobID,
	)

	return err
}

func (s *Store) MarkRenderJobFailed(ctx context.Context, input MarkRenderJobFailedInput) error {
	_, err := s.pool.Exec(
		ctx,
		`
      UPDATE media.render_jobs
      SET
        status = 'failed',
        lease_owner = NULL,
        leased_until = NULL,
        completed_at = NOW(),
        last_error_code = NULLIF($2, ''),
        last_error_message = NULLIF($3, ''),
        updated_at = NOW()
      WHERE id = $1
    `,
		input.JobID,
		input.ErrorCode,
		input.ErrorMessage,
	)

	return err
}

func (s *Store) MarkClipJobFailed(ctx context.Context, input MarkClipJobFailedInput) error {
	_, err := s.pool.Exec(
		ctx,
		`
      UPDATE media.clip_jobs
      SET
        status = 'failed',
        lease_owner = NULL,
        leased_until = NULL,
        completed_at = NOW(),
        last_error_code = NULLIF($2, ''),
        last_error_message = NULLIF($3, ''),
        updated_at = NOW()
      WHERE id = $1
    `,
		input.JobID,
		input.ErrorCode,
		input.ErrorMessage,
	)

	return err
}

func (s *Store) MarkRenderJobCompleted(ctx context.Context, input MarkRenderJobCompletedInput) error {
	file, err := os.ReadFile(input.FilePath)
	if err != nil {
		return fmt.Errorf("read rendered file: %w", err)
	}

	checksum := sha256.Sum256(file)
	relativeStorageKey := filepath.ToSlash(input.FilePath)
	artifactMetadata := input.ArtifactMetadata
	if artifactMetadata == nil {
		artifactMetadata = map[string]any{}
	}
	if input.PosterFilePath != "" {
		artifactMetadata["posterPath"] = filepath.ToSlash(input.PosterFilePath)
	}
	if input.PosterMimeType != "" {
		artifactMetadata["posterMimeType"] = input.PosterMimeType
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	var assetID string
	if err := tx.QueryRow(
		ctx,
		`
	      INSERT INTO asset.assets (
	        workspace_id,
	        created_by_user_id,
	        asset_type,
	        storage_bucket,
	        storage_key,
	        mime_type,
	        file_size_bytes,
	        checksum_sha256,
	        status,
	        metadata
	      )
	      VALUES (
	        $1::uuid,
	        NULLIF($2, '')::uuid,
	        $3,
	        $4,
	        $5,
	        $6,
	        $7,
	        $8,
	        'processed',
	        $9::jsonb
	      )
	      RETURNING id::text
	    `,
		input.WorkspaceID,
		input.RequestedByUserID,
		input.AssetType,
		input.StorageBucket,
		relativeStorageKey,
		input.MimeType,
		int64(len(file)),
		fmt.Sprintf("%x", checksum),
		string(mustJSONMarshal(artifactMetadata)),
	).Scan(&assetID); err != nil {
		return fmt.Errorf("create output asset: %w", err)
	}

	if _, err := tx.Exec(
		ctx,
		`
	      UPDATE media.render_jobs
	      SET
	        status = 'completed',
	        output_asset_id = $2::uuid,
	        provider_name = NULLIF($3, ''),
	        provider_job_id = NULLIF($4, ''),
	        lease_owner = NULL,
	        leased_until = NULL,
	        completed_at = NOW(),
	        last_error_code = NULL,
	        last_error_message = NULL,
	        updated_at = NOW()
	      WHERE id = $1
	    `,
		input.JobID,
		assetID,
		input.ProviderName,
		input.ProviderJobID,
	); err != nil {
		return fmt.Errorf("complete render job: %w", err)
	}

	return tx.Commit(ctx)
}

func (s *Store) MarkClipJobCompleted(ctx context.Context, input MarkClipJobCompletedInput) error {
	file, err := os.ReadFile(input.FilePath)
	if err != nil {
		return fmt.Errorf("read clipped file: %w", err)
	}

	checksum := sha256.Sum256(file)
	relativeStorageKey := filepath.ToSlash(input.FilePath)
	artifactMetadata := input.ArtifactMetadata
	if artifactMetadata == nil {
		artifactMetadata = map[string]any{}
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	var assetID string
	if err := tx.QueryRow(
		ctx,
		`
	      INSERT INTO asset.assets (
	        workspace_id,
	        created_by_user_id,
	        asset_type,
	        storage_bucket,
	        storage_key,
	        mime_type,
	        file_size_bytes,
	        checksum_sha256,
	        status,
	        metadata
	      )
	      VALUES (
	        $1::uuid,
	        NULLIF($2, '')::uuid,
	        'video',
	        $3,
	        $4,
	        $5,
	        $6,
	        $7,
	        'processed',
	        $8::jsonb
	      )
	      RETURNING id::text
	    `,
		input.WorkspaceID,
		input.RequestedByUserID,
		input.StorageBucket,
		relativeStorageKey,
		input.MimeType,
		int64(len(file)),
		fmt.Sprintf("%x", checksum),
		string(mustJSONMarshal(artifactMetadata)),
	).Scan(&assetID); err != nil {
		return fmt.Errorf("create clipped asset: %w", err)
	}

	if _, err := tx.Exec(
		ctx,
		`
	      UPDATE media.clip_jobs
	      SET
	        status = 'completed',
	        output_asset_id = $2::uuid,
	        lease_owner = NULL,
	        leased_until = NULL,
	        completed_at = NOW(),
	        last_error_code = NULL,
	        last_error_message = NULL,
	        updated_at = NOW()
	      WHERE id = $1
	    `,
		input.JobID,
		assetID,
	); err != nil {
		return fmt.Errorf("complete clip job: %w", err)
	}

	return tx.Commit(ctx)
}

func mustJSONMarshal(value any) []byte {
	encoded, err := json.Marshal(value)
	if err != nil {
		return []byte("{}")
	}

	return encoded
}

func scanRenderJob(row pgx.Row) (RenderJob, error) {
	var (
		job          RenderJob
		metadataJSON []byte
		metadata     RenderJobMetadata
	)

	err := row.Scan(
		&job.JobID,
		&job.Status,
		&job.WorkspaceID,
		&job.OutputAssetID,
		&job.ProviderName,
		&job.ProviderJobID,
		&metadataJSON,
		&job.StartedAt,
		&job.CompletedAt,
		&job.LastErrorMessage,
	)
	if err != nil {
		return RenderJob{}, err
	}

	if len(metadataJSON) > 0 {
		if err := json.Unmarshal(metadataJSON, &metadata); err != nil {
			return RenderJob{}, fmt.Errorf("decode render metadata: %w", err)
		}
	}

	job.RenderMode = metadata.RenderRequest.Mode
	job.PreferredProvider = metadata.RenderRequest.PreferredProvider

	return job, nil
}

func scanClipJob(row pgx.Row) (ClipJob, error) {
	var job ClipJob

	err := row.Scan(
		&job.JobID,
		&job.Status,
		&job.WorkspaceID,
		&job.OutputAssetID,
		&job.StartedAt,
		&job.CompletedAt,
		&job.LastErrorMessage,
	)
	if err != nil {
		return ClipJob{}, err
	}

	return job, nil
}
