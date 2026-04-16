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
	"github.com/creatorflow/automation-content/services/media-processing-service/internal/render"
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
			AspectRatio       string         `json:"aspectRatio"`
			DurationSeconds   int            `json:"durationSeconds"`
			Mode              string         `json:"renderMode"`
			Options           map[string]any `json:"options"`
			PreferredProvider string         `json:"preferredProvider"`
			Prompt            string         `json:"prompt"`
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

		if body.WorkspaceID == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error":   "invalid_request",
				"message": "workspaceId is required",
			})
			return
		}

		spec := render.NormalizeSpec(render.RequestSpec{
			AspectRatio:       body.AspectRatio,
			DurationSeconds:   body.DurationSeconds,
			Mode:              body.Mode,
			Options:           body.Options,
			PreferredProvider: body.PreferredProvider,
			Prompt:            body.Prompt,
		})

			templateSpecPresent := false
			if spec.Options != nil {
				_, templateSpecPresent = spec.Options["templateRenderSpec"]
			}

			if body.SourceAssetID == "" && spec.Prompt == "" && !(spec.Mode == render.ModeTemplatePromo && templateSpecPresent) {
				writeJSON(w, http.StatusBadRequest, map[string]string{
					"error":   "invalid_request",
					"message": render.ErrMissingPromptOrSource.Error(),
			})
			return
		}

		if err := render.ValidateSpec(spec, body.SourceAssetID); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error":   "invalid_request",
				"message": err.Error(),
			})
			return
		}

		job, err := store.CreateRenderJob(r.Context(), jobs.CreateRenderJobInput{
			RenderSpec:         spec,
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

	mux.HandleFunc("/internal/v1/clip-jobs", auth.RequireInternalServiceAuth(auth.Config{
		Audience: config.InternalServiceAudience,
		Issuer:   config.InternalServiceIssuer,
		Secret:   config.InternalServiceSecret,
	}, func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var body struct {
			CandidateID       string  `json:"candidateId"`
			EndSec            float64 `json:"endSec"`
			Hook              string  `json:"hook"`
			RequestedByUserID string  `json:"requestedByUserId"`
			SourceAssetID     string  `json:"sourceAssetId"`
			StartSec          float64 `json:"startSec"`
			Summary           string  `json:"summary"`
			Title             string  `json:"title"`
			WorkspaceID       string  `json:"workspaceId"`
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

		if body.EndSec <= body.StartSec {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error":   "invalid_request",
				"message": "endSec must be greater than startSec",
			})
			return
		}

		job, err := store.CreateClipJob(r.Context(), jobs.CreateClipJobInput{
			CandidateID:       body.CandidateID,
			EndSec:            body.EndSec,
			Hook:              body.Hook,
			RequestedByUserID: body.RequestedByUserID,
			SourceAssetID:     body.SourceAssetID,
			StartSec:          body.StartSec,
			Summary:           body.Summary,
			Title:             body.Title,
			WorkspaceID:       body.WorkspaceID,
		})
		if err != nil {
			logger.Error("clip job create failed", map[string]any{
				"correlationId": requestCorrelationID(r.Context()),
				"errorMessage":  err.Error(),
				"workspaceId":   body.WorkspaceID,
			})
			writeJSON(w, http.StatusInternalServerError, map[string]string{
				"error":   "clip_job_create_failed",
				"message": "Failed to create clip job",
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

	mux.HandleFunc("/internal/v1/render-jobs-output/", auth.RequireInternalServiceAuth(auth.Config{
		Audience: config.InternalServiceAudience,
		Issuer:   config.InternalServiceIssuer,
		Secret:   config.InternalServiceSecret,
	}, func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		jobID := strings.TrimPrefix(r.URL.Path, "/internal/v1/render-jobs-output/")
		if jobID == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error":   "invalid_request",
				"message": "jobId is required",
			})
			return
		}

		output, err := store.GetRenderJobOutput(r.Context(), jobID)
		if errors.Is(err, jobs.ErrRenderJobNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{
				"error":   "render_job_not_found",
				"message": "Render job was not found",
			})
			return
		}
		if errors.Is(err, jobs.ErrRenderOutputNotReady) {
			writeJSON(w, http.StatusConflict, map[string]string{
				"error":   "render_output_not_ready",
				"message": "Rendered output is not ready yet",
			})
			return
		}
		if err != nil {
			logger.Error("render job output lookup failed", map[string]any{
				"correlationId": requestCorrelationID(r.Context()),
				"errorMessage":  err.Error(),
				"jobId":         jobID,
			})
			writeJSON(w, http.StatusInternalServerError, map[string]string{
				"error":   "render_output_lookup_failed",
				"message": "Failed to load render output",
			})
			return
		}

		serveRenderArtifact(w, r, logger, renderArtifactResponse{
			filePath:      output.FilePath,
			jobID:         jobID,
			mimeType:      output.MimeType,
			openErrorCode: "render_output_open_failed",
			openLabel:     "render output",
			statErrorCode: "render_output_stat_failed",
		})
	}))

	mux.HandleFunc("/internal/v1/clip-jobs/", auth.RequireInternalServiceAuth(auth.Config{
		Audience: config.InternalServiceAudience,
		Issuer:   config.InternalServiceIssuer,
		Secret:   config.InternalServiceSecret,
	}, func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		jobID := strings.TrimPrefix(r.URL.Path, "/internal/v1/clip-jobs/")
		if jobID == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error":   "invalid_request",
				"message": "jobId is required",
			})
			return
		}

		job, err := store.GetClipJob(r.Context(), jobID)
		if errors.Is(err, jobs.ErrClipJobNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{
				"error":   "clip_job_not_found",
				"message": "Clip job was not found",
			})
			return
		}
		if err != nil {
			logger.Error("clip job lookup failed", map[string]any{
				"correlationId": requestCorrelationID(r.Context()),
				"errorMessage":  err.Error(),
				"jobId":         jobID,
			})
			writeJSON(w, http.StatusInternalServerError, map[string]string{
				"error":   "clip_job_lookup_failed",
				"message": "Failed to load clip job",
			})
			return
		}

		writeJSON(w, http.StatusOK, job)
	}))

	mux.HandleFunc("/internal/v1/clip-jobs-output/", auth.RequireInternalServiceAuth(auth.Config{
		Audience: config.InternalServiceAudience,
		Issuer:   config.InternalServiceIssuer,
		Secret:   config.InternalServiceSecret,
	}, func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		jobID := strings.TrimPrefix(r.URL.Path, "/internal/v1/clip-jobs-output/")
		if jobID == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error":   "invalid_request",
				"message": "jobId is required",
			})
			return
		}

		output, err := store.GetClipJobOutput(r.Context(), jobID)
		if errors.Is(err, jobs.ErrClipJobNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{
				"error":   "clip_job_not_found",
				"message": "Clip job was not found",
			})
			return
		}
		if errors.Is(err, jobs.ErrClipOutputNotReady) {
			writeJSON(w, http.StatusConflict, map[string]string{
				"error":   "clip_output_not_ready",
				"message": "Clipped output is not ready yet",
			})
			return
		}
		if err != nil {
			logger.Error("clip job output lookup failed", map[string]any{
				"correlationId": requestCorrelationID(r.Context()),
				"errorMessage":  err.Error(),
				"jobId":         jobID,
			})
			writeJSON(w, http.StatusInternalServerError, map[string]string{
				"error":   "clip_output_lookup_failed",
				"message": "Failed to load clip output",
			})
			return
		}

		serveRenderArtifact(w, r, logger, renderArtifactResponse{
			filePath:      output.FilePath,
			jobID:         jobID,
			mimeType:      output.MimeType,
			openErrorCode: "clip_output_open_failed",
			openLabel:     "clip output",
			statErrorCode: "clip_output_stat_failed",
		})
	}))

	mux.HandleFunc("/internal/v1/render-jobs-poster/", auth.RequireInternalServiceAuth(auth.Config{
		Audience: config.InternalServiceAudience,
		Issuer:   config.InternalServiceIssuer,
		Secret:   config.InternalServiceSecret,
	}, func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		jobID := strings.TrimPrefix(r.URL.Path, "/internal/v1/render-jobs-poster/")
		if jobID == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error":   "invalid_request",
				"message": "jobId is required",
			})
			return
		}

		output, err := store.GetRenderJobOutput(r.Context(), jobID)
		if errors.Is(err, jobs.ErrRenderJobNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{
				"error":   "render_job_not_found",
				"message": "Render job was not found",
			})
			return
		}
		if errors.Is(err, jobs.ErrRenderOutputNotReady) || output.PosterFilePath == "" {
			writeJSON(w, http.StatusConflict, map[string]string{
				"error":   "render_poster_not_ready",
				"message": "Render poster is not ready yet",
			})
			return
		}
		if err != nil {
			logger.Error("render poster lookup failed", map[string]any{
				"correlationId": requestCorrelationID(r.Context()),
				"errorMessage":  err.Error(),
				"jobId":         jobID,
			})
			writeJSON(w, http.StatusInternalServerError, map[string]string{
				"error":   "render_poster_lookup_failed",
				"message": "Failed to load render poster",
			})
			return
		}

		mimeType := output.PosterMimeType
		if mimeType == "" {
			mimeType = "image/jpeg"
		}

		serveRenderArtifact(w, r, logger, renderArtifactResponse{
			filePath:      output.PosterFilePath,
			jobID:         jobID,
			mimeType:      mimeType,
			openErrorCode: "render_poster_open_failed",
			openLabel:     "render poster",
			statErrorCode: "render_poster_stat_failed",
		})
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

type renderArtifactResponse struct {
	filePath      string
	jobID         string
	mimeType      string
	openErrorCode string
	openLabel     string
	statErrorCode string
}

func serveRenderArtifact(w http.ResponseWriter, r *http.Request, logger *observability.Logger, input renderArtifactResponse) {
	file, err := os.Open(input.filePath)
	if err != nil {
		logger.Error(input.openLabel+" open failed", map[string]any{
			"correlationId": requestCorrelationID(r.Context()),
			"errorMessage":  err.Error(),
			"filePath":      input.filePath,
			"jobId":         input.jobID,
		})
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error":   input.openErrorCode,
			"message": "Failed to open " + input.openLabel,
		})
		return
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		logger.Error(input.openLabel+" stat failed", map[string]any{
			"correlationId": requestCorrelationID(r.Context()),
			"errorMessage":  err.Error(),
			"filePath":      input.filePath,
			"jobId":         input.jobID,
		})
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error":   input.statErrorCode,
			"message": "Failed to read " + input.openLabel,
		})
		return
	}

	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Cache-Control", "private, max-age=300")
	w.Header().Set("Content-Type", input.mimeType)
	http.ServeContent(w, r, fileInfo.Name(), fileInfo.ModTime(), file)
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
