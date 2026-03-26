package observability

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

const (
	RequestIDHeader   = "X-Request-Id"
	CorrelationHeader = "X-Correlation-Id"
)

type contextKey string

const requestContextKey contextKey = "request-context"

type RequestContext struct {
	RequestID     string
	CorrelationID string
}

type Logger struct {
	environment string
	service     string
	writer      io.Writer
}

func NewLogger(service string, environment string) *Logger {
	return &Logger{
		environment: environment,
		service:     service,
		writer:      os.Stdout,
	}
}

func (l *Logger) Info(message string, fields map[string]any) {
	l.write("info", message, fields)
}

func (l *Logger) Error(message string, fields map[string]any) {
	l.write("error", message, fields)
}

func (l *Logger) write(level string, message string, fields map[string]any) {
	entry := map[string]any{
		"timestamp":   time.Now().UTC().Format(time.RFC3339Nano),
		"level":       level,
		"service":     l.service,
		"environment": l.environment,
		"message":     message,
	}

	for key, value := range fields {
		if value == nil {
			continue
		}

		entry[key] = value
	}

	payload, err := json.Marshal(entry)
	if err != nil {
		fallback := map[string]any{
			"timestamp":   time.Now().UTC().Format(time.RFC3339Nano),
			"level":       "error",
			"service":     l.service,
			"environment": l.environment,
			"message":     "failed to marshal log entry",
			"error":       err.Error(),
		}
		payload, _ = json.Marshal(fallback)
	}

	_, _ = l.writer.Write(append(payload, '\n'))
}

func WithHTTPObservability(logger *Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		startedAt := time.Now()
		requestContext := RequestContextFromHeaders(r.Header)
		responseWriter := &statusCapturingResponseWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}

		responseWriter.Header().Set(RequestIDHeader, requestContext.RequestID)
		responseWriter.Header().Set(CorrelationHeader, requestContext.CorrelationID)

		logger.Info("request started", map[string]any{
			"requestId":     requestContext.RequestID,
			"correlationId": requestContext.CorrelationID,
			"httpMethod":    r.Method,
			"httpRoute":     r.URL.Path,
			"remoteIp":      r.RemoteAddr,
			"userAgent":     r.UserAgent(),
		})

		next.ServeHTTP(responseWriter, r.WithContext(WithRequestContext(r.Context(), requestContext)))

		logger.Info("request completed", map[string]any{
			"requestId":      requestContext.RequestID,
			"correlationId":  requestContext.CorrelationID,
			"httpMethod":     r.Method,
			"httpRoute":      r.URL.Path,
			"httpStatusCode": responseWriter.statusCode,
			"durationMs":     time.Since(startedAt).Milliseconds(),
		})
	})
}

func WithRequestContext(ctx context.Context, requestContext RequestContext) context.Context {
	return context.WithValue(ctx, requestContextKey, requestContext)
}

func RequestContextFromContext(ctx context.Context) (RequestContext, bool) {
	requestContext, ok := ctx.Value(requestContextKey).(RequestContext)
	return requestContext, ok
}

func RequestContextFromHeaders(headers http.Header) RequestContext {
	requestID := normalizeHeaderValue(headers.Get(RequestIDHeader))
	if requestID == "" {
		requestID = randomID()
	}

	correlationID := normalizeHeaderValue(headers.Get(CorrelationHeader))
	if correlationID == "" {
		correlationID = requestID
	}

	return RequestContext{
		RequestID:     requestID,
		CorrelationID: correlationID,
	}
}

func normalizeHeaderValue(value string) string {
	normalized := strings.TrimSpace(value)
	if normalized == "" {
		return ""
	}

	return normalized
}

func randomID() string {
	buffer := make([]byte, 16)
	if _, err := rand.Read(buffer); err != nil {
		return time.Now().UTC().Format("20060102150405.000000000")
	}

	return hex.EncodeToString(buffer)
}

type statusCapturingResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (w *statusCapturingResponseWriter) WriteHeader(statusCode int) {
	w.statusCode = statusCode
	w.ResponseWriter.WriteHeader(statusCode)
}
