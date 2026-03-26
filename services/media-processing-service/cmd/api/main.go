package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strings"

	"github.com/creatorflow/automation-content/services/media-processing-service/internal/auth"
	"github.com/creatorflow/automation-content/services/media-processing-service/internal/jobs"
	"github.com/creatorflow/automation-content/services/media-processing-service/internal/observability"
)

func main() {
	mux := http.NewServeMux()
	config := loadConfig()
	logger := observability.NewLogger(config.ServiceName, config.Environment)
	store, err := jobs.NewStore(context.Background(), config.DatabaseURL)
	if err != nil {
		logger.Error("database connection failed", map[string]any{
			"component":    "api",
			"errorMessage": err.Error(),
		})
		os.Exit(1)
	}
	defer store.Close()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		requestContext, _ := observability.RequestContextFromContext(r.Context())
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"correlationId": requestContext.CorrelationID,
			"requestId":     requestContext.RequestID,
			"service":       "media-processing-service",
			"status":        "ok",
		})
	})

	mux.HandleFunc("/internal/v1/whoami", auth.RequireInternalServiceAuth(auth.Config{
		Audience: config.InternalServiceAudience,
		Issuer:   config.InternalServiceIssuer,
		Secret:   config.InternalServiceSecret,
	}, func(w http.ResponseWriter, r *http.Request) {
		principal, _ := auth.PrincipalFromContext(r.Context())
		requestContext, _ := observability.RequestContextFromContext(r.Context())

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"audience":      config.InternalServiceAudience,
			"callerService": principal.CallerService,
			"correlationId": requestContext.CorrelationID,
			"requestId":     requestContext.RequestID,
			"scope":         principal.Scope,
			"service":       config.ServiceName,
			"status":        "ok",
		})
	}))

	mux.HandleFunc("/internal/v1/render-jobs", auth.RequireInternalServiceAuth(auth.Config{
		Audience: config.InternalServiceAudience,
		Issuer:   config.InternalServiceIssuer,
		Secret:   config.InternalServiceSecret,
	}, func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var body struct {
			RequestedByUserID string `json:"requestedByUserId"`
			ScriptID          string `json:"scriptId"`
			SourceAssetID     string `json:"sourceAssetId"`
			WorkspaceID       string `json:"workspaceId"`
		}

		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error":   "invalid_request",
				"message": "Request body must be valid JSON",
			})
			return
		}

		if body.WorkspaceID == "" || body.SourceAssetID == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error":   "invalid_request",
				"message": "workspaceId and sourceAssetId are required",
			})
			return
		}

		job, err := store.CreateRenderJob(r.Context(), jobs.CreateRenderJobInput{
			RequestedByUserID: body.RequestedByUserID,
			ScriptID:          body.ScriptID,
			SourceAssetID:     body.SourceAssetID,
			WorkspaceID:       body.WorkspaceID,
		})
		if err != nil {
			logger.Error("render job create failed", map[string]any{
				"correlationId": requestCorrelationID(r.Context()),
				"errorMessage":  err.Error(),
				"workspaceId":   body.WorkspaceID,
			})
			writeJSON(w, http.StatusInternalServerError, map[string]string{
				"error":   "render_job_create_failed",
				"message": "Failed to create render job",
			})
			return
		}

		writeJSON(w, http.StatusAccepted, job)
	}))

	mux.HandleFunc("/internal/v1/render-jobs/", auth.RequireInternalServiceAuth(auth.Config{
		Audience: config.InternalServiceAudience,
		Issuer:   config.InternalServiceIssuer,
		Secret:   config.InternalServiceSecret,
	}, func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		jobID := strings.TrimPrefix(r.URL.Path, "/internal/v1/render-jobs/")
		if jobID == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error":   "invalid_request",
				"message": "jobId is required",
			})
			return
		}

		job, err := store.GetRenderJob(r.Context(), jobID)
		if errors.Is(err, jobs.ErrRenderJobNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{
				"error":   "render_job_not_found",
				"message": "Render job was not found",
			})
			return
		}
		if err != nil {
			logger.Error("render job lookup failed", map[string]any{
				"correlationId": requestCorrelationID(r.Context()),
				"errorMessage":  err.Error(),
				"jobId":         jobID,
			})
			writeJSON(w, http.StatusInternalServerError, map[string]string{
				"error":   "render_job_lookup_failed",
				"message": "Failed to load render job",
			})
			return
		}

		writeJSON(w, http.StatusOK, job)
	}))

	logger.Info("service starting", map[string]any{
		"component":               "api",
		"databaseUrlConfigured":   config.DatabaseURL != "",
		"internalServiceAudience": config.InternalServiceAudience,
		"port":                    config.Port,
	})

	if err := http.ListenAndServe(":"+config.Port, observability.WithHTTPObservability(logger, mux)); err != nil {
		logger.Error("service stopped", map[string]any{
			"component":    "api",
			"errorMessage": err.Error(),
		})
		os.Exit(1)
	}
}

type serviceConfig struct {
	Environment             string
	DatabaseURL             string
	InternalServiceAudience string
	InternalServiceIssuer   string
	InternalServiceSecret   string
	Port                    string
	ServiceName             string
}

func loadConfig() serviceConfig {
	return serviceConfig{
		Environment:             getEnv("APP_ENV", "development"),
		DatabaseURL:             getEnv("DATABASE_URL", "postgresql://creatorflow:creatorflow@localhost:5433/creatorflow"),
		InternalServiceAudience: getEnv("INTERNAL_SERVICE_AUDIENCE", "creatorflow-media-processing-service"),
		InternalServiceIssuer:   getEnv("INTERNAL_SERVICE_ISSUER", "creatorflow-api-gateway"),
		InternalServiceSecret:   getEnv("INTERNAL_SERVICE_SECRET", "creatorflow-internal-dev-secret"),
		Port:                    getEnv("PORT", "4100"),
		ServiceName:             getEnv("SERVICE_NAME", "media-processing-service"),
	}
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}

func requestCorrelationID(ctx context.Context) string {
	requestContext, ok := observability.RequestContextFromContext(ctx)
	if !ok {
		return ""
	}

	return requestContext.CorrelationID
}
