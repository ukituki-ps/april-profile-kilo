package auth

import "context"

type ctxKey int

const ctxKeyPrincipal ctxKey = iota + 1

// Principal — доверенные данные из валидированного access token Keycloak.
type Principal struct {
	Subject    string
	TenantID   string
	RealmRoles []string
}

// ContextWithPrincipal помещает Principal в контекст (после успешной валидации JWT).
func ContextWithPrincipal(parent context.Context, p Principal) context.Context {
	return context.WithValue(parent, ctxKeyPrincipal, p)
}

// PrincipalFromContext возвращает Principal, если middleware уже отработал.
func PrincipalFromContext(ctx context.Context) (Principal, bool) {
	p, ok := ctx.Value(ctxKeyPrincipal).(Principal)
	return p, ok
}

// SubjectFromContext возвращает claim sub или пустую строку.
func SubjectFromContext(ctx context.Context) string {
	if p, ok := PrincipalFromContext(ctx); ok {
		return p.Subject
	}
	return ""
}

// TenantIDFromContext возвращает tenant_id только из доверенного контекста аутентификации.
func TenantIDFromContext(ctx context.Context) string {
	if p, ok := PrincipalFromContext(ctx); ok {
		return p.TenantID
	}
	return ""
}

// RealmRolesFromContext возвращает роли realm из JWT (realm_access.roles), если есть.
func RealmRolesFromContext(ctx context.Context) []string {
	if p, ok := PrincipalFromContext(ctx); ok {
		return append([]string(nil), p.RealmRoles...)
	}
	return nil
}
