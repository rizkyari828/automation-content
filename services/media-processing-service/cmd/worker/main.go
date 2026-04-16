package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"time"

	"github.com/creatorflow/automation-content/services/media-processing-service/internal/jobs"
	"github.com/creatorflow/automation-content/services/media-processing-service/internal/observability"
	"github.com/creatorflow/automation-content/services/media-processing-service/internal/providers"
)

func main() {
	config := loadWorkerConfig()
	logger := observability.NewLogger("media-processing-service", config.Environment)
	store, err := jobs.NewStore(context.Background(), config.DatabaseURL)
	if err != nil {
		logger.Error("worker database connection failed", map[string]any{
			"component":    "worker",
			"errorMessage": err.Error(),
		})
		os.Exit(1)
	}
	defer store.Close()

	registry := providers.NewRegistry(
		config.DefaultRenderProvider,
		providers.NewDevNoopProvider(),
		providers.NewTemplateProvider(),
		providers.NewFalVeoFastProvider(config.FalConfigured),
		providers.NewFalSoraProvider(config.FalConfigured),
		providers.NewVeoProvider(config.VeoConfigured),
		providers.NewSoraProvider(config.SoraConfigured),
		providers.NewRunwayProvider(config.RunwayConfigured),
		providers.NewLumaProvider(config.LumaConfigured),
	)

	logger.Info("worker started", map[string]any{
		"component":             "worker",
		"defaultRenderProvider": config.DefaultRenderProvider,
		"workerId":              config.WorkerID,
	})

	for {
		job, err := store.ClaimNextRenderJob(context.Background(), config.WorkerID, config.LeaseSeconds)
		if err != nil {
			logger.Error("render job claim failed", map[string]any{
				"component":    "worker",
				"errorMessage": err.Error(),
			})
			time.Sleep(config.PollInterval)
			continue
		}

		if job != nil {
			processRenderJob(context.Background(), store, logger, registry, job)
			continue
		}

		clipJob, err := store.ClaimNextClipJob(context.Background(), config.WorkerID, config.LeaseSeconds)
		if err != nil {
			logger.Error("clip job claim failed", map[string]any{
				"component":    "worker",
				"errorMessage": err.Error(),
			})
			time.Sleep(config.PollInterval)
			continue
		}

		if clipJob == nil {
			time.Sleep(config.PollInterval)
			continue
		}

		processClipJob(context.Background(), store, logger, config, clipJob)
	}
}

type workerConfig struct {
	DatabaseURL                string
	DefaultRenderProvider      string
	Environment                string
	FalConfigured              bool
	LeaseSeconds               int
	LumaConfigured             bool
	PollInterval               time.Duration
	RunwayConfigured           bool
	SoraConfigured             bool
	StorageLocalDir            string
	VeoConfigured              bool
	WorkerID                   string
}

func loadWorkerConfig() workerConfig {
	return workerConfig{
		DatabaseURL:               getEnv("DATABASE_URL", "postgresql://creatorflow:creatorflow@localhost:5433/creatorflow"),
		DefaultRenderProvider:     getEnv("DEFAULT_RENDER_PROVIDER", "dev_noop"),
		Environment:               getEnv("APP_ENV", "development"),
		FalConfigured:             getEnv("FAL_API_KEY", "") != "",
		LeaseSeconds:              getEnvInt("RENDER_JOB_LEASE_SECONDS", 300),
		LumaConfigured:            getEnv("LUMA_API_KEY", "") != "",
		PollInterval:              time.Duration(getEnvInt("RENDER_POLL_INTERVAL_SECONDS", 5)) * time.Second,
		RunwayConfigured:          getEnv("RUNWAY_API_KEY", "") != "",
		SoraConfigured:            getEnv("OPENAI_API_KEY", "") != "",
		StorageLocalDir:           getEnv("STORAGE_LOCAL_DIR", ".creatorflow/uploads"),
		VeoConfigured:             getEnv("GOOGLE_VEO_API_KEY", "") != "",
		WorkerID:                  getEnv("WORKER_ID", "media-worker-1"),
	}
}

func processRenderJob(
	ctx context.Context,
	store *jobs.Store,
	logger *observability.Logger,
	registry *providers.Registry,
	job *jobs.DispatchableRenderJob,
) {
	provider, err := registry.Resolve(job.Metadata.RenderRequest)
	if err != nil {
		logger.Error("render provider resolution failed", map[string]any{
			"component":         "worker",
			"errorMessage":      err.Error(),
			"jobId":             job.JobID,
			"preferredProvider": job.Metadata.RenderRequest.PreferredProvider,
			"renderMode":        job.Metadata.RenderRequest.Mode,
		})
		_ = store.MarkRenderJobFailed(ctx, jobs.MarkRenderJobFailedInput{
			ErrorCode:    "provider_resolution_failed",
			ErrorMessage: err.Error(),
			JobID:        job.JobID,
		})
		return
	}

	result, err := provider.StartRender(ctx, providers.StartRenderInput{
		JobID:         job.JobID,
		ScriptID:      job.ScriptID,
		SourceAssetID: job.SourceAssetID,
		Spec:          job.Metadata.RenderRequest,
		WorkspaceID:   job.WorkspaceID,
	})
	if err != nil {
		logger.Error("render provider dispatch failed", map[string]any{
			"component":    "worker",
			"errorMessage": err.Error(),
			"jobId":        job.JobID,
			"provider":     provider.Name(),
		})
		_ = store.MarkRenderJobFailed(ctx, jobs.MarkRenderJobFailedInput{
			ErrorCode:    "provider_dispatch_failed",
			ErrorMessage: err.Error(),
			JobID:        job.JobID,
		})
		return
	}

	if result.LocalArtifact != nil {
		if err := store.MarkRenderJobCompleted(ctx, jobs.MarkRenderJobCompletedInput{
			ArtifactMetadata:  result.LocalArtifact.Metadata,
			AssetType:         "video",
			FilePath:          result.LocalArtifact.FilePath,
			JobID:             job.JobID,
			MimeType:          result.LocalArtifact.MimeType,
			PosterFilePath:    result.LocalArtifact.PosterFilePath,
			PosterMimeType:    result.LocalArtifact.PosterMimeType,
			ProviderJobID:     result.ExternalJobID,
			ProviderName:      result.ProviderName,
			RequestedByUserID: job.RequestedByUserID,
			StorageBucket:     "local-renderer",
			WorkspaceID:       job.WorkspaceID,
		}); err != nil {
			logger.Error("render job completion persist failed", map[string]any{
				"component":    "worker",
				"errorMessage": err.Error(),
				"jobId":        job.JobID,
				"provider":     result.ProviderName,
			})
			_ = store.MarkRenderJobFailed(ctx, jobs.MarkRenderJobFailedInput{
				ErrorCode:    "render_completion_failed",
				ErrorMessage: err.Error(),
				JobID:        job.JobID,
			})
		}
		return
	}

	if err := store.MarkRenderJobDispatched(ctx, jobs.MarkRenderJobDispatchedInput{
		JobID:         job.JobID,
		ProviderJobID: result.ExternalJobID,
		ProviderName:  result.ProviderName,
	}); err != nil {
		logger.Error("render job dispatch persist failed", map[string]any{
			"component":    "worker",
			"errorMessage": err.Error(),
			"jobId":        job.JobID,
			"provider":     result.ProviderName,
		})
	}
}

func processClipJob(
	ctx context.Context,
	store *jobs.Store,
	logger *observability.Logger,
	config workerConfig,
	job *jobs.DispatchableClipJob,
) {
	sourcePath := resolveStoragePath(config.StorageLocalDir, job.SourceStorageKey)
	if sourcePath == "" {
		_ = store.MarkClipJobFailed(ctx, jobs.MarkClipJobFailedInput{
			ErrorCode:    "clip_source_missing",
			ErrorMessage: "source asset path is not available",
			JobID:        job.JobID,
		})
		return
	}

	if _, err := os.Stat(sourcePath); err != nil {
		_ = store.MarkClipJobFailed(ctx, jobs.MarkClipJobFailedInput{
			ErrorCode:    "clip_source_not_found",
			ErrorMessage: err.Error(),
			JobID:        job.JobID,
		})
		return
	}

	repoRoot, err := resolveRepoRoot()
	if err != nil {
		_ = store.MarkClipJobFailed(ctx, jobs.MarkClipJobFailedInput{
			ErrorCode:    "clip_repo_root_failed",
			ErrorMessage: err.Error(),
			JobID:        job.JobID,
		})
		return
	}

	outputDir := filepath.Join(repoRoot, ".creatorflow", "clips", job.WorkspaceID, job.JobID)
	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		_ = store.MarkClipJobFailed(ctx, jobs.MarkClipJobFailedInput{
			ErrorCode:    "clip_output_dir_failed",
			ErrorMessage: err.Error(),
			JobID:        job.JobID,
		})
		return
	}

	outputPath := filepath.Join(outputDir, "clip.mp4")
	command := exec.Command(
		"ffmpeg",
		"-y",
		"-i", sourcePath,
		"-ss", formatFFmpegSeconds(job.Metadata.StartSec),
		"-to", formatFFmpegSeconds(job.Metadata.EndSec),
		"-c:v", "libx264",
		"-preset", "veryfast",
		"-crf", "20",
		"-c:a", "aac",
		"-movflags", "+faststart",
		outputPath,
	)
	output, err := command.CombinedOutput()
	if err != nil {
		logger.Error("clip job ffmpeg failed", map[string]any{
			"component":    "worker",
			"errorMessage": err.Error(),
			"ffmpegOutput": string(output),
			"jobId":        job.JobID,
			"sourcePath":   sourcePath,
		})
		_ = store.MarkClipJobFailed(ctx, jobs.MarkClipJobFailedInput{
			ErrorCode:    "clip_ffmpeg_failed",
			ErrorMessage: string(output),
			JobID:        job.JobID,
		})
		return
	}

	if err := store.MarkClipJobCompleted(ctx, jobs.MarkClipJobCompletedInput{
		ArtifactMetadata: map[string]any{
			"candidateId":  job.Metadata.CandidateID,
			"durationSec":  job.Metadata.DurationSec,
			"endSec":       job.Metadata.EndSec,
			"hook":         job.Metadata.Hook,
			"sourceAssetId": job.SourceAssetID,
			"startSec":     job.Metadata.StartSec,
			"summary":      job.Metadata.Summary,
			"title":        job.Metadata.Title,
		},
		FilePath:          outputPath,
		JobID:             job.JobID,
		MimeType:          "video/mp4",
		RequestedByUserID: job.RequestedByUserID,
		StorageBucket:     "local-renderer",
		WorkspaceID:       job.WorkspaceID,
	}); err != nil {
		logger.Error("clip job completion persist failed", map[string]any{
			"component":    "worker",
			"errorMessage": err.Error(),
			"jobId":        job.JobID,
		})
		_ = store.MarkClipJobFailed(ctx, jobs.MarkClipJobFailedInput{
			ErrorCode:    "clip_completion_failed",
			ErrorMessage: err.Error(),
			JobID:        job.JobID,
		})
	}
}

func resolveStoragePath(storageRoot string, storageKey string) string {
	if storageKey == "" {
		return ""
	}

	if filepath.IsAbs(storageKey) {
		return storageKey
	}

	cleanStorageKey := filepath.Clean(storageKey)
	if filepath.IsAbs(storageRoot) {
		return filepath.Join(storageRoot, cleanStorageKey)
	}

	current, err := os.Getwd()
	if err != nil {
		return filepath.Join(storageRoot, cleanStorageKey)
	}

	return filepath.Join(current, storageRoot, cleanStorageKey)
}

func resolveRepoRoot() (string, error) {
	current, err := os.Getwd()
	if err != nil {
		return "", err
	}

	for {
		if _, err := os.Stat(filepath.Join(current, "package.json")); err == nil {
			if _, err := os.Stat(filepath.Join(current, "packages", "template-video-renderer")); err == nil {
				return current, nil
			}
		}

		parent := filepath.Dir(current)
		if parent == current {
			return "", fmt.Errorf("repository root not found")
		}

		current = parent
	}
}

func formatFFmpegSeconds(value float64) string {
	if value < 0 {
		value = 0
	}

	return fmt.Sprintf("%.3f", value)
}

func getEnvInt(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}

	return parsed
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}
