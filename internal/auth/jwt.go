package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"
)

// Validator проверяет access token Keycloak: подпись (JWKS), iss, aud|azp, срок, извлекает tenant и sub.
type Validator struct {
	keyfunc keyfunc.Keyfunc
	issuer  string
	aud     string
	tenant  string // имя claim (по умолчанию tenant_id)
}

// NewValidator создаёт валидатор с фоновым обновлением JWKS по URL (контекст — для остановки refresh).
func NewValidator(ctx context.Context, jwksURL, issuer, audience, tenantClaim string) (*Validator, error) {
	if jwksURL == "" || issuer == "" || audience == "" {
		return nil, fmt.Errorf("auth: пустые параметры JWKS/issuer/audience")
	}
	if tenantClaim == "" {
		tenantClaim = "tenant_id"
	}
	kf, err := keyfunc.NewDefaultCtx(ctx, []string{jwksURL})
	if err != nil {
		return nil, fmt.Errorf("auth: jwks keyfunc: %w", err)
	}
	return &Validator{keyfunc: kf, issuer: issuer, aud: audience, tenant: tenantClaim}, nil
}

// NewValidatorFromJWKSJSON — для тестов: статический JWKS без HTTP.
func NewValidatorFromJWKSJSON(jwksJSON []byte, issuer, audience, tenantClaim string) (*Validator, error) {
	if tenantClaim == "" {
		tenantClaim = "tenant_id"
	}
	kf, err := keyfunc.NewJWKSetJSON(jwksJSON)
	if err != nil {
		return nil, fmt.Errorf("auth: jwks json: %w", err)
	}
	return &Validator{keyfunc: kf, issuer: issuer, aud: audience, tenant: tenantClaim}, nil
}

// ValidateBearer извлекает Bearer-токен, проверяет подпись и claims; возвращает sub и tenant_id из доверенного claim.
func (v *Validator) ValidateBearer(ctx context.Context, authorizationHeader string) (sub string, tenantID string, err error) {
	raw, ok := bearerToken(authorizationHeader)
	if !ok {
		return "", "", ErrMissingBearer
	}
	claims := jwt.MapClaims{}
	parser := jwt.NewParser(
		jwt.WithValidMethods([]string{jwt.SigningMethodRS256.Name}),
		jwt.WithExpirationRequired(),
	)
	_, err = parser.ParseWithClaims(raw, &claims, v.keyfunc.KeyfuncCtx(ctx))
	if err != nil {
		return "", "", fmt.Errorf("%w: %w", ErrInvalidToken, err)
	}
	iss, _ := claims["iss"].(string)
	if iss != v.issuer {
		return "", "", fmt.Errorf("%w: issuer", ErrInvalidToken)
	}
	if !audienceMatches(claims, v.aud) {
		return "", "", fmt.Errorf("%w: audience/azp", ErrInvalidToken)
	}
	sub, _ = claims["sub"].(string)
	if sub == "" {
		return "", "", fmt.Errorf("%w: sub", ErrInvalidToken)
	}
	tenantID, err = stringClaim(claims, v.tenant)
	if err != nil || tenantID == "" {
		return "", "", ErrMissingTenantClaim
	}
	return sub, tenantID, nil
}

var (
	// ErrMissingBearer — нет заголовка Authorization: Bearer.
	ErrMissingBearer = errors.New("missing bearer token")
	// ErrInvalidToken — подпись, срок или обязательные claims не прошли проверку.
	ErrInvalidToken = errors.New("invalid token")
	// ErrMissingTenantClaim — в токене нет согласованного claim с tenant_id.
	ErrMissingTenantClaim = errors.New("missing tenant claim")
)

func bearerToken(h string) (string, bool) {
	h = strings.TrimSpace(h)
	const p = "Bearer "
	if len(h) <= len(p) || !strings.EqualFold(h[:len(p)], p) {
		return "", false
	}
	t := strings.TrimSpace(h[len(p):])
	if t == "" {
		return "", false
	}
	return t, true
}

func audienceMatches(claims jwt.MapClaims, want string) bool {
	if want == "" {
		return false
	}
	if azp, ok := claims["azp"].(string); ok && azp == want {
		return true
	}
	switch aud := claims["aud"].(type) {
	case string:
		return aud == want
	case []any:
		for _, x := range aud {
			if s, ok := x.(string); ok && s == want {
				return true
			}
		}
	}
	return false
}

func stringClaim(claims jwt.MapClaims, name string) (string, error) {
	raw, ok := claims[name]
	if !ok {
		return "", fmt.Errorf("claim %q отсутствует", name)
	}
	switch v := raw.(type) {
	case string:
		return strings.TrimSpace(v), nil
	case float64:
		// JSON-числа в MapClaims иногда приходят как float64.
		return fmt.Sprintf("%.0f", v), nil
	default:
		return "", fmt.Errorf("claim %q: неподдерживаемый тип", name)
	}
}
