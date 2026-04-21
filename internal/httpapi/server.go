// Package httpapi — минимальный HTTP-слой AprilProfile (фаза 1): публичные и защищённые маршруты.
package httpapi

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/ukituki-ps/april-profile/internal/auth"
	"github.com/ukituki-ps/april-profile/internal/entitytypes"
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

// EntityTypeCatalog описывает операции каталога типов сущностей.
type EntityTypeCatalog interface {
	CreateDraft(ctx context.Context, tenantID string, params entitytypes.CreateDraftParams) (entitytypes.Record, error)
	List(ctx context.Context, tenantID string) ([]entitytypes.Record, error)
	Publish(ctx context.Context, tenantID, entityTypeID string) (entitytypes.Record, error)
}

// NewMux регистрирует маршруты. Защищённые обработчики получают tenant_id только из JWT через auth.Validator.
func NewMux(v *auth.Validator, readiness ReadinessChecker, catalog EntityTypeCatalog, logger *slog.Logger) http.Handler {
	if logger == nil {
		logger = slog.Default()
	}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", handleHealthz)
	mux.Handle("GET /readyz", handleReadyz(readiness))
	mux.HandleFunc("GET /v1/system/ping", handlePing)
	mux.Handle("GET /v1/auth/whoami", v.Middleware(http.HandlerFunc(handleWhoAmI)))
	mux.Handle("POST /v1/entity-types", v.Middleware(http.HandlerFunc(handleCreateEntityTypeDraft(catalog))))
	mux.Handle("GET /v1/entity-types", v.Middleware(http.HandlerFunc(handleListEntityTypes(catalog))))
	mux.Handle("POST /v1/entity-types/{entityTypeID}/publish", v.Middleware(http.HandlerFunc(handlePublishEntityType(catalog))))
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
		requestID := RequestIDFromContext(r.Context())
		if requestID == "" {
			requestID = rec.Header().Get(requestIDHeader)
		}
		attrs := []any{
			"method", r.Method,
			"path", r.URL.Path,
			"status", rec.status,
			"duration_ms", time.Since(start).Milliseconds(),
			"request_id", requestID,
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

func handleCreateEntityTypeDraft(catalog EntityTypeCatalog) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if catalog == nil {
			ErrorWithRequestID(w, http.StatusServiceUnavailable, map[string]any{
				"code":    "catalog_unavailable",
				"message": "entity type catalog unavailable",
			}, RequestIDFromContext(r.Context()))
			return
		}

		var req struct {
			Namespace   string         `json:"namespace"`
			Code        string         `json:"code"`
			DraftSchema map[string]any `json:"draft_schema"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			ErrorWithRequestID(w, http.StatusBadRequest, map[string]any{
				"code":    "invalid_request",
				"message": "invalid json body",
			}, RequestIDFromContext(r.Context()))
			return
		}
		rec, err := catalog.CreateDraft(r.Context(), auth.TenantIDFromContext(r.Context()), entitytypes.CreateDraftParams{
			Namespace:   req.Namespace,
			Code:        req.Code,
			DraftSchema: req.DraftSchema,
		})
		if err != nil {
			ErrorWithRequestID(w, http.StatusBadRequest, map[string]any{
				"code":    "invalid_request",
				"message": err.Error(),
			}, RequestIDFromContext(r.Context()))
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(rec)
	}
}

func handleListEntityTypes(catalog EntityTypeCatalog) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if catalog == nil {
			ErrorWithRequestID(w, http.StatusServiceUnavailable, map[string]any{
				"code":    "catalog_unavailable",
				"message": "entity type catalog unavailable",
			}, RequestIDFromContext(r.Context()))
			return
		}
		items, err := catalog.List(r.Context(), auth.TenantIDFromContext(r.Context()))
		if err != nil {
			ErrorWithRequestID(w, http.StatusInternalServerError, map[string]any{
				"code":    "internal_error",
				"message": "failed to list entity types",
			}, RequestIDFromContext(r.Context()))
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(map[string]any{"items": items})
	}
}

func handlePublishEntityType(catalog EntityTypeCatalog) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if catalog == nil {
			ErrorWithRequestID(w, http.StatusServiceUnavailable, map[string]any{
				"code":    "catalog_unavailable",
				"message": "entity type catalog unavailable",
			}, RequestIDFromContext(r.Context()))
			return
		}
		rec, err := catalog.Publish(
			r.Context(),
			auth.TenantIDFromContext(r.Context()),
			r.PathValue("entityTypeID"),
		)
		if err != nil {
			status := http.StatusInternalServerError
			code := "internal_error"
			switch {
			case errors.Is(err, entitytypes.ErrNotFound):
				status = http.StatusNotFound
				code = "entity_type_not_found"
			case errors.Is(err, entitytypes.ErrAlreadyPublished):
				status = http.StatusConflict
				code = "already_published"
			case errors.Is(err, entitytypes.ErrInvalidSchema):
				status = http.StatusUnprocessableEntity
				code = "invalid_schema"
			}
			ErrorWithRequestID(w, status, map[string]any{
				"code":    code,
				"message": err.Error(),
			}, RequestIDFromContext(r.Context()))
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(rec)
	}
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
