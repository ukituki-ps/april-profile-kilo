package auth

import (
	"context"
)

type ctxKey int

const (
	ctxKeySubject ctxKey = iota + 1
	ctxKeyTenantID
)

// ContextWithTenant возвращает контекст с доверенным tenant_id и sub из JWT (не из query/body).
func ContextWithTenant(parent context.Context, subject, tenantID string) context.Context {
	ctx := context.WithValue(parent, ctxKeySubject, subject)
	return context.WithValue(ctx, ctxKeyTenantID, tenantID)
}

// SubjectFromContext возвращает claim sub или пустую строку, если контекст не помечен middleware.
func SubjectFromContext(ctx context.Context) string {
	v, _ := ctx.Value(ctxKeySubject).(string)
	return v
}

// TenantIDFromContext возвращает tenant_id только из доверенного контекста аутентификации.
func TenantIDFromContext(ctx context.Context) string {
	v, _ := ctx.Value(ctxKeyTenantID).(string)
	return v
}
