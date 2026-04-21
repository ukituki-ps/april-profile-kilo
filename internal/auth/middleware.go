package auth

import (
	"errors"
	"net/http"
)

// Middleware проверяет Bearer JWT и помещает sub и tenant_id в контекст запроса.
func (v *Validator) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sub, tenantID, err := v.ValidateBearer(r.Context(), r.Header.Get("Authorization"))
		if err != nil {
			writeAuthError(w, err)
			return
		}
		next.ServeHTTP(w, r.WithContext(ContextWithTenant(r.Context(), sub, tenantID)))
	})
}

func writeAuthError(w http.ResponseWriter, err error) {
	status := http.StatusUnauthorized
	code := "unauthorized"
	switch {
	case errors.Is(err, ErrMissingTenantClaim):
		status = http.StatusForbidden
		code = "tenant_required"
	case errors.Is(err, ErrMissingBearer):
		status = http.StatusUnauthorized
		code = "missing_bearer"
	default:
		status = http.StatusUnauthorized
		code = "invalid_token"
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_, _ = w.Write([]byte(`{"code":"` + code + `","message":"authentication failed"}`))
}

