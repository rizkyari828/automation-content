package main

import (
	"context"
	"os"
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

		if job == nil {
			time.Sleep(config.PollInterval)
			continue
		}

		provider, err := registry.Resolve(job.Metadata.RenderRequest)
		if err != nil {
			logger.Error("render provider resolution failed", map[string]any{
				"component":         "worker",
				"errorMessage":      err.Error(),
				"jobId":             job.JobID,
				"preferredProvider": job.Metadata.RenderRequest.PreferredProvider,
				"renderMode":        job.Metadata.RenderRequest.Mode,
			})
			_ = store.MarkRenderJobFailed(context.Background(), jobs.MarkRenderJobFailedInput{
				ErrorCode:    "provider_resolution_failed",
				ErrorMessage: err.Error(),
				JobID:        job.JobID,
			})
			continue
		}

		result, err := provider.StartRender(context.Background(), providers.StartRenderInput{
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
			_ = store.MarkRenderJobFailed(context.Background(), jobs.MarkRenderJobFailedInput{
				ErrorCode:    "provider_dispatch_failed",
				ErrorMessage: err.Error(),
				JobID:        job.JobID,
			})
			continue
		}

		if result.LocalArtifact != nil {
			if err := store.MarkRenderJobCompleted(context.Background(), jobs.MarkRenderJobCompletedInput{
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
				_ = store.MarkRenderJobFailed(context.Background(), jobs.MarkRenderJobFailedInput{
					ErrorCode:    "render_completion_failed",
					ErrorMessage: err.Error(),
					JobID:        job.JobID,
				})
			}
			continue
		}

		if err := store.MarkRenderJobDispatched(context.Background(), jobs.MarkRenderJobDispatchedInput{
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
		VeoConfigured:             getEnv("GOOGLE_VEO_API_KEY", "") != "",
		WorkerID:                  getEnv("WORKER_ID", "media-worker-1"),
	}
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
