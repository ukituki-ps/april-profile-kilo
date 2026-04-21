// Package httpapi — минимальный HTTP-слой AprilProfile (фаза 1): публичные и защищённые маршруты.
package httpapi

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/ukituki-ps/april-profile/internal/abac"
	"github.com/ukituki-ps/april-profile/internal/auth"
	"github.com/ukituki-ps/april-profile/internal/entitytypes"
	"github.com/ukituki-ps/april-profile/internal/profiles"
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

// ProfileService описывает операции CRUD и версионирования профиля.
type ProfileService interface {
	Create(ctx context.Context, tenantID string, params profiles.CreateParams) (profiles.Snapshot, error)
	Update(ctx context.Context, tenantID, entityID string, params profiles.UpdateParams) (profiles.Snapshot, error)
	GetCurrent(ctx context.Context, tenantID, entityID string) (profiles.Snapshot, error)
	GetByVersion(ctx context.Context, tenantID, entityID string, version int64) (profiles.Snapshot, error)
	GetCurrentByExternalRef(ctx context.Context, tenantID string, ref profiles.ExternalRef) (profiles.Snapshot, error)
	Delete(ctx context.Context, tenantID, entityID string) error
}

// ProfileAdmin — админ-операции: конфликты authority и merge дубликатов (роль Keycloak см. RequireRealmRole).
type ProfileAdmin interface {
	ListOpenConflicts(ctx context.Context, tenantID string) ([]profiles.FieldConflict, error)
	ResolveFieldConflict(ctx context.Context, tenantID, conflictID, actorSub string, resolution any, notes string) (profiles.Snapshot, error)
	MergeEntityProfiles(ctx context.Context, tenantID, sourceEntityID, targetEntityID, actorSub string) (profiles.MergeResult, error)
}

// NewMux регистрирует маршруты. Защищённые обработчики получают tenant_id только из JWT через auth.Validator.
// adminRealmRole: пустая строка — не требовать realm-роль на /v1/admin/* (только для dev/тестов).
// abacPolicy: при Active() GET профиля фильтрует document по сегментам и realm-ролям из JWT; nil — без фильтрации.
func NewMux(v *auth.Validator, readiness ReadinessChecker, catalog EntityTypeCatalog, profileService ProfileService, admin ProfileAdmin, adminRealmRole string, abacPolicy *abac.Policy, logger *slog.Logger) http.Handler {
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
	mux.Handle("POST /v1/entities", v.Middleware(http.HandlerFunc(handleCreateEntity(profileService))))
	mux.Handle("GET /v1/entities/{entityID}", v.Middleware(http.HandlerFunc(handleGetEntityCurrent(profileService, abacPolicy))))
	mux.Handle("PUT /v1/entities/{entityID}", v.Middleware(http.HandlerFunc(handleUpdateEntity(profileService))))
	mux.Handle("DELETE /v1/entities/{entityID}", v.Middleware(http.HandlerFunc(handleDeleteEntity(profileService))))
	mux.Handle("GET /v1/entities/{entityID}/versions/{version}", v.Middleware(http.HandlerFunc(handleGetEntityByVersion(profileService, abacPolicy))))
	mux.Handle("GET /v1/external-mappings/{sourceSystem}/{externalID}/entity", v.Middleware(http.HandlerFunc(handleGetEntityByExternal(profileService, abacPolicy))))
	adminChain := func(h http.Handler) http.Handler {
		return v.Middleware(auth.RequireRealmRole(adminRealmRole)(h))
	}
	mux.Handle("GET /v1/admin/profile-conflicts", adminChain(http.HandlerFunc(handleListProfileConflicts(admin))))
	mux.Handle("POST /v1/admin/profile-conflicts/{conflictID}/resolve", adminChain(http.HandlerFunc(handleResolveProfileConflict(admin))))
	mux.Handle("POST /v1/admin/entities/merge", adminChain(http.HandlerFunc(handleMergeEntities(admin))))
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

func handleCreateEntity(service ProfileService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if service == nil {
			writeServiceUnavailable(w, r)
			return
		}
		var req struct {
			EntityTypeID string                 `json:"entity_type_id"`
			Document     map[string]any         `json:"document"`
			ExternalRefs []profiles.ExternalRef `json:"external_refs"`
			WriteSource  string                 `json:"write_source"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeBadRequest(w, r, "invalid json body")
			return
		}
		result, err := service.Create(r.Context(), auth.TenantIDFromContext(r.Context()), profiles.CreateParams{
			EntityTypeID: req.EntityTypeID,
			Document:     req.Document,
			ExternalRefs: req.ExternalRefs,
			WriteSource:  req.WriteSource,
		})
		if err != nil {
			writeProfileError(w, r, err)
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(result)
	}
}

func handleUpdateEntity(service ProfileService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if service == nil {
			writeServiceUnavailable(w, r)
			return
		}
		var req struct {
			Document     map[string]any         `json:"document"`
			ExternalRefs []profiles.ExternalRef `json:"external_refs"`
			WriteSource  string                 `json:"write_source"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeBadRequest(w, r, "invalid json body")
			return
		}
		result, err := service.Update(
			r.Context(),
			auth.TenantIDFromContext(r.Context()),
			r.PathValue("entityID"),
			profiles.UpdateParams{
				Document:     req.Document,
				ExternalRefs: req.ExternalRefs,
				WriteSource:  req.WriteSource,
			},
		)
		if err != nil {
			writeProfileError(w, r, err)
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(result)
	}
}

func handleGetEntityCurrent(service ProfileService, abacPolicy *abac.Policy) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if service == nil {
			writeServiceUnavailable(w, r)
			return
		}
		result, err := service.GetCurrent(r.Context(), auth.TenantIDFromContext(r.Context()), r.PathValue("entityID"))
		if err != nil {
			writeProfileError(w, r, err)
			return
		}
		result = filterProfileReadIfNeeded(r, abacPolicy, result)
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(result)
	}
}

func handleGetEntityByVersion(service ProfileService, abacPolicy *abac.Policy) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if service == nil {
			writeServiceUnavailable(w, r)
			return
		}
		version, err := strconv.ParseInt(r.PathValue("version"), 10, 64)
		if err != nil {
			writeBadRequest(w, r, "version must be positive integer")
			return
		}
		result, err := service.GetByVersion(
			r.Context(),
			auth.TenantIDFromContext(r.Context()),
			r.PathValue("entityID"),
			version,
		)
		if err != nil {
			writeProfileError(w, r, err)
			return
		}
		result = filterProfileReadIfNeeded(r, abacPolicy, result)
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(result)
	}
}

func handleGetEntityByExternal(service ProfileService, abacPolicy *abac.Policy) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if service == nil {
			writeServiceUnavailable(w, r)
			return
		}
		result, err := service.GetCurrentByExternalRef(
			r.Context(),
			auth.TenantIDFromContext(r.Context()),
			profiles.ExternalRef{
				SourceSystem: r.PathValue("sourceSystem"),
				ExternalID:   r.PathValue("externalID"),
			},
		)
		if err != nil {
			writeProfileError(w, r, err)
			return
		}
		result = filterProfileReadIfNeeded(r, abacPolicy, result)
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(result)
	}
}

func handleDeleteEntity(service ProfileService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if service == nil {
			writeServiceUnavailable(w, r)
			return
		}
		if err := service.Delete(r.Context(), auth.TenantIDFromContext(r.Context()), r.PathValue("entityID")); err != nil {
			writeProfileError(w, r, err)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}

func filterProfileReadIfNeeded(r *http.Request, policy *abac.Policy, snap profiles.Snapshot) profiles.Snapshot {
	if policy == nil || !policy.Active() {
		return snap
	}
	roles := auth.RealmRolesFromContext(r.Context())
	return policy.FilterSnapshot(snap, roles)
}

func writeBadRequest(w http.ResponseWriter, r *http.Request, message string) {
	ErrorWithRequestID(w, http.StatusBadRequest, map[string]any{
		"code":    "invalid_request",
		"message": message,
	}, RequestIDFromContext(r.Context()))
}

func writeServiceUnavailable(w http.ResponseWriter, r *http.Request) {
	ErrorWithRequestID(w, http.StatusServiceUnavailable, map[string]any{
		"code":    "profile_service_unavailable",
		"message": "profile service unavailable",
	}, RequestIDFromContext(r.Context()))
}

func writeProfileError(w http.ResponseWriter, r *http.Request, err error) {
	status := http.StatusBadRequest
	code := "invalid_request"
	switch {
	case errors.Is(err, profiles.ErrNotFound):
		status = http.StatusNotFound
		code = "entity_not_found"
	case errors.Is(err, profiles.ErrVersionNotFound):
		status = http.StatusNotFound
		code = "version_not_found"
	case errors.Is(err, profiles.ErrEntityTypeNotFound):
		status = http.StatusNotFound
		code = "entity_type_not_found"
	case errors.Is(err, profiles.ErrEntityTypeNotPublished):
		status = http.StatusConflict
		code = "entity_type_not_published"
	case errors.Is(err, profiles.ErrExternalMappingConflict):
		status = http.StatusConflict
		code = "external_mapping_conflict"
	case errors.Is(err, profiles.ErrAuthorityAllBlocked):
		status = http.StatusConflict
		code = "authority_all_blocked"
	}
	ErrorWithRequestID(w, status, map[string]any{
		"code":    code,
		"message": fmt.Sprintf("%v", err),
	}, RequestIDFromContext(r.Context()))
}

func handleListProfileConflicts(admin ProfileAdmin) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if admin == nil {
			writeServiceUnavailable(w, r)
			return
		}
		items, err := admin.ListOpenConflicts(r.Context(), auth.TenantIDFromContext(r.Context()))
		if err != nil {
			ErrorWithRequestID(w, http.StatusInternalServerError, map[string]any{
				"code": "internal_error", "message": err.Error(),
			}, RequestIDFromContext(r.Context()))
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(map[string]any{"items": items})
	}
}

func handleResolveProfileConflict(admin ProfileAdmin) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if admin == nil {
			writeServiceUnavailable(w, r)
			return
		}
		var req struct {
			Resolution any    `json:"resolution"`
			Notes      string `json:"notes"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeBadRequest(w, r, "invalid json body")
			return
		}
		snap, err := admin.ResolveFieldConflict(
			r.Context(),
			auth.TenantIDFromContext(r.Context()),
			r.PathValue("conflictID"),
			auth.SubjectFromContext(r.Context()),
			req.Resolution,
			req.Notes,
		)
		if err != nil {
			writeAdminProfileError(w, r, err)
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(snap)
	}
}

func handleMergeEntities(admin ProfileAdmin) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if admin == nil {
			writeServiceUnavailable(w, r)
			return
		}
		var req struct {
			SourceEntityID string `json:"source_entity_id"`
			TargetEntityID string `json:"target_entity_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeBadRequest(w, r, "invalid json body")
			return
		}
		res, err := admin.MergeEntityProfiles(
			r.Context(),
			auth.TenantIDFromContext(r.Context()),
			req.SourceEntityID,
			req.TargetEntityID,
			auth.SubjectFromContext(r.Context()),
		)
		if err != nil {
			writeAdminProfileError(w, r, err)
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(res)
	}
}

func writeAdminProfileError(w http.ResponseWriter, r *http.Request, err error) {
	status := http.StatusBadRequest
	code := "invalid_request"
	switch {
	case errors.Is(err, profiles.ErrNotFound):
		status = http.StatusNotFound
		code = "entity_not_found"
	case errors.Is(err, profiles.ErrConflictNotFound):
		status = http.StatusNotFound
		code = "conflict_not_found"
	case errors.Is(err, profiles.ErrMergeInvalid):
		status = http.StatusBadRequest
		code = "merge_invalid"
	case errors.Is(err, profiles.ErrMergeExternalCollision):
		status = http.StatusConflict
		code = "merge_external_collision"
	}
	ErrorWithRequestID(w, status, map[string]any{
		"code":    code,
		"message": fmt.Sprintf("%v", err),
	}, RequestIDFromContext(r.Context()))
}
