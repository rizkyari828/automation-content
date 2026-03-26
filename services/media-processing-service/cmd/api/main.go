package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/creatorflow/automation-content/services/media-processing-service/internal/auth"
)

func main() {
	mux := http.NewServeMux()
	config := loadConfig()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"service": "media-processing-service",
			"status":  "ok",
		})
	})

	mux.HandleFunc("/internal/v1/whoami", auth.RequireInternalServiceAuth(auth.Config{
		Audience: config.InternalServiceAudience,
		Issuer:   config.InternalServiceIssuer,
		Secret:   config.InternalServiceSecret,
	}, func(w http.ResponseWriter, r *http.Request) {
		principal, _ := auth.PrincipalFromContext(r.Context())

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"audience":      config.InternalServiceAudience,
			"callerService": principal.CallerService,
			"scope":         principal.Scope,
			"service":       config.ServiceName,
			"status":        "ok",
		})
	}))

	log.Printf(
		"media-processing-service listening on :%s with internal audience %s",
		config.Port,
		config.InternalServiceAudience,
	)
	log.Fatal(http.ListenAndServe(":"+config.Port, mux))
}

type serviceConfig struct {
	InternalServiceAudience string
	InternalServiceIssuer   string
	InternalServiceSecret   string
	Port                    string
	ServiceName             string
}

func loadConfig() serviceConfig {
	return serviceConfig{
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
