// Package httpapi — минимальный HTTP-слой AprilProfile (фаза 1): публичные и защищённые маршруты.
package httpapi

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/ukituki-ps/april-profile/internal/auth"
)

const requestIDHeader = "X-Request-Id"

type ctxKeyRequestID struct{}

// ReadinessChecker проверяет доступность внешних зависимостей.
type ReadinessChecker interface {
	Check(ctx context.Context) ReadinessResult
}

// ReadinessResult описывает состояние readiness-зависимостей.
type ReadinessResult struct {
	Ready        bool
	DatabaseOK   bool
	RedisOK      bool
	RedisSkipped bool
}

// NewMux регистрирует маршруты. Защищённые обработчики получают tenant_id только из JWT через auth.Validator.
func NewMux(v *auth.Validator, readiness ReadinessChecker, logger *slog.Logger) http.Handler {
	if logger == nil {
		logger = slog.Default()
	}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", handleHealthz)
	mux.Handle("GET /readyz", handleReadyz(readiness))
	mux.HandleFunc("GET /v1/system/ping", handlePing)
	mux.Handle("GET /v1/auth/whoami", v.Middleware(http.HandlerFunc(handleWhoAmI)))
	return withRequestLogging(logger, withRequestID(mux))
}

func handleHealthz(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func handleReadyz(checker ReadinessChecker) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		result := checker.Check(r.Context())
		status := http.StatusOK
		body := map[string]any{
			"status":   "ready",
			"database": "ok",
			"redis":    "ok",
		}
		if result.RedisSkipped {
			body["redis"] = "skipped"
		}
		if !result.Ready {
			status = http.StatusServiceUnavailable
			body["status"] = "not_ready"
			if !result.DatabaseOK {
				body["database"] = "unavailable"
			}
			if !result.RedisOK && !result.RedisSkipped {
				body["redis"] = "unavailable"
			}
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(status)
		_ = json.NewEncoder(w).Encode(body)
	})
}

func withRequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := r.Header.Get(requestIDHeader)
		if requestID == "" {
			requestID = newRequestID()
		}
		w.Header().Set(requestIDHeader, requestID)
		ctx := context.WithValue(r.Context(), ctxKeyRequestID{}, requestID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func withRequestLogging(logger *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)
		attrs := []any{
			"method", r.Method,
			"path", r.URL.Path,
			"status", rec.status,
			"duration_ms", time.Since(start).Milliseconds(),
			"request_id", RequestIDFromContext(r.Context()),
		}
		if tenantID := auth.TenantIDFromContext(r.Context()); tenantID != "" {
			attrs = append(attrs, "tenant_id", tenantID)
		}
		logger.Info("http request", attrs...)
	})
}

// RequestIDFromContext возвращает request_id из контекста запроса.
func RequestIDFromContext(ctx context.Context) string {
	value, _ := ctx.Value(ctxKeyRequestID{}).(string)
	return value
}

func newRequestID() string {
	var raw [16]byte
	if _, err := rand.Read(raw[:]); err != nil {
		return ""
	}
	return hex.EncodeToString(raw[:])
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(statusCode int) {
	r.status = statusCode
	r.ResponseWriter.WriteHeader(statusCode)
}

func (r *statusRecorder) Write(data []byte) (int, error) {
	if r.status == 0 {
		r.status = http.StatusOK
	}
	return r.ResponseWriter.Write(data)
}

func ErrorWithRequestID(w http.ResponseWriter, status int, payload map[string]any, requestID string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	payload["request_id"] = requestID
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func handlePing(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func handleWhoAmI(w http.ResponseWriter, r *http.Request) {
	// Намеренно не читаем tenant_id из query/body — только из контекста после JWT.
	sub := auth.SubjectFromContext(r.Context())
	tenant := auth.TenantIDFromContext(r.Context())
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"sub":       sub,
		"tenant_id": tenant,
	})
}
