package main

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/creatorflow/automation-content/services/publishing-service/internal/jobs"
	"github.com/creatorflow/automation-content/services/publishing-service/internal/observability"
)

func main() {
	config := loadWorkerConfig()
	logger := observability.NewLogger("publishing-service", config.Environment)
	store, err := jobs.NewStore(context.Background(), config.DatabaseURL)
	if err != nil {
		logger.Error("worker database connection failed", map[string]any{
			"component":    "worker",
			"errorMessage": err.Error(),
		})
		os.Exit(1)
	}
	defer store.Close()

	logger.Info("worker started", map[string]any{
		"component":    "worker",
		"deliveryMode": config.DeliveryMode,
		"workerId":     config.WorkerID,
	})

	for {
		job, err := store.ClaimNextPublishJob(context.Background(), config.WorkerID, config.LeaseSeconds)
		if err != nil {
			logger.Error("publish job claim failed", map[string]any{
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

		if err := dispatchPublishJob(context.Background(), store, logger, config, *job); err != nil {
			logger.Error("publish job delivery failed", map[string]any{
				"component":    "worker",
				"errorMessage": err.Error(),
				"jobId":        job.JobID,
				"platformCode": job.PlatformCode,
			})
			_ = store.MarkPublishJobFailed(context.Background(), job.JobID, "publish_delivery_failed", err.Error())
		}
	}
}

type workerConfig struct {
	DatabaseURL   string
	DeliveryMode  string
	Environment   string
	LeaseSeconds  int
	PollInterval  time.Duration
	PublishDelay  time.Duration
	RequireLinked bool
	WorkerID      string
}

func loadWorkerConfig() workerConfig {
	return workerConfig{
		DatabaseURL:   getEnv("DATABASE_URL", "postgresql://creatorflow:creatorflow@localhost:5433/creatorflow"),
		DeliveryMode:  getEnv("PUBLISHING_DELIVERY_MODE", "dev_simulated"),
		Environment:   getEnv("APP_ENV", "development"),
		LeaseSeconds:  getEnvInt("PUBLISH_JOB_LEASE_SECONDS", 300),
		PollInterval:  time.Duration(getEnvInt("PUBLISH_POLL_INTERVAL_SECONDS", 5)) * time.Second,
		PublishDelay:  time.Duration(getEnvInt("PUBLISH_SIMULATED_DELAY_MS", 1200)) * time.Millisecond,
		RequireLinked: getEnv("PUBLISH_REQUIRE_CONNECTED_ACCOUNT", "false") == "true",
		WorkerID:      getEnv("WORKER_ID", "publishing-worker-1"),
	}
}

func dispatchPublishJob(
	ctx context.Context,
	store *jobs.Store,
	logger *observability.Logger,
	config workerConfig,
	job jobs.DispatchablePublishJob,
) error {
	if job.PlatformCode != "tiktok" {
		return fmt.Errorf("platform %s is not supported by the current delivery worker", job.PlatformCode)
	}

	if config.RequireLinked && job.ConnectedAccountID == "" {
		return fmt.Errorf("connected account is required before this publish job can be delivered")
	}

	switch config.DeliveryMode {
	case "dev_simulated", "":
		if config.PublishDelay > 0 {
			time.Sleep(config.PublishDelay)
		}
		logger.Info("publish job delivered in simulated mode", map[string]any{
			"component":          "worker",
			"connectedAccountId": job.ConnectedAccountID,
			"jobId":              job.JobID,
			"platformCode":       job.PlatformCode,
			"workspaceId":        job.WorkspaceID,
		})
		return store.MarkPublishJobPublished(ctx, job.JobID)
	default:
		return fmt.Errorf("publishing delivery mode %s is not implemented", config.DeliveryMode)
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
