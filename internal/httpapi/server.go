// Package httpapi — минимальный HTTP-слой AprilProfile (фаза 1): публичные и защищённые маршруты.
package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/ukituki-ps/april-profile/internal/auth"
)

// NewMux регистрирует маршруты. Защищённые обработчики получают tenant_id только из JWT через auth.Validator.
func NewMux(v *auth.Validator) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", handleHealthz)
	mux.HandleFunc("GET /readyz", handleReadyz)
	mux.HandleFunc("GET /v1/system/ping", handlePing)
	mux.Handle("GET /v1/auth/whoami", v.Middleware(http.HandlerFunc(handleWhoAmI)))
	return mux
}

func handleHealthz(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func handleReadyz(w http.ResponseWriter, r *http.Request) {
	// Временный упрощенный readiness: детальные проверки зависимостей добавятся в задаче 008.
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ready"})
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
