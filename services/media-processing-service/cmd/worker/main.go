package main

import (
	"os"
	"time"

	"github.com/creatorflow/automation-content/services/media-processing-service/internal/observability"
)

func main() {
	environment := os.Getenv("APP_ENV")
	if environment == "" {
		environment = "development"
	}

	logger := observability.NewLogger("media-processing-service", environment)
	logger.Info("worker started", map[string]any{
		"component": "worker",
	})

	for {
		time.Sleep(1 * time.Hour)
	}
}
