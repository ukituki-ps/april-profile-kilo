package httpapi

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"io"
	"log/slog"
	"math/big"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/ukituki-ps/april-profile/internal/auth"
	"github.com/ukituki-ps/april-profile/internal/entitytypes"
)

func TestHealthAndReadiness_arePublicAndReturn200(t *testing.T) {
	t.Parallel()
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	jwks := mustRSAJWKS(t, &priv.PublicKey, "kid-health")
	const iss = "http://kc.example/auth/realms/april"
	const aud = "april-profile-api"
	v, err := auth.NewValidatorFromJWKSJSON(jwks, iss, aud, "tenant_id")
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(NewMux(v, staticReadinessChecker{
		result: ReadinessResult{Ready: true, DatabaseOK: true, RedisOK: true},
	}, nil, slog.New(slog.NewTextHandler(io.Discard, nil))))
	t.Cleanup(ts.Close)

	cases := []struct {
		name         string
		path         string
		wantContains string
	}{
		{name: "healthz", path: "/healthz", wantContains: `"status":"ok"`},
		{name: "readyz", path: "/readyz", wantContains: `"status":"ready"`},
	}
	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			res, err := ts.Client().Get(ts.URL + tc.path)
			if err != nil {
				t.Fatal(err)
			}
			defer res.Body.Close()
			if res.StatusCode != http.StatusOK {
				body, _ := io.ReadAll(res.Body)
				t.Fatalf("status %d body %s", res.StatusCode, body)
			}
			body, err := io.ReadAll(res.Body)
			if err != nil {
				t.Fatal(err)
			}
			if !strings.Contains(string(body), tc.wantContains) {
				t.Fatalf("unexpected body for %s: %s", tc.path, body)
			}
			if reqID := res.Header.Get("X-Request-Id"); reqID == "" {
				t.Fatalf("missing X-Request-Id header")
			}
		})
	}
}

func TestWhoAmI_requiresJWT(t *testing.T) {
	t.Parallel()
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	kid := "kid-whoami"
	jwks := mustRSAJWKS(t, &priv.PublicKey, kid)
	const iss = "http://kc.example/auth/realms/april"
	const aud = "april-profile-api"
	v, err := auth.NewValidatorFromJWKSJSON(jwks, iss, aud, "tenant_id")
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(NewMux(v, staticReadinessChecker{
		result: ReadinessResult{Ready: true, DatabaseOK: true, RedisOK: true},
	}, nil, slog.New(slog.NewTextHandler(io.Discard, nil))))
	t.Cleanup(ts.Close)

	res, err := ts.Client().Get(ts.URL + "/v1/auth/whoami")
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status: %d", res.StatusCode)
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"iss":       iss,
		"sub":       "user-42",
		"exp":       time.Now().Add(time.Hour).Unix(),
		"azp":       aud,
		"tenant_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
	})
	token.Header["kid"] = kid
	raw, err := token.SignedString(priv)
	if err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, ts.URL+"/v1/auth/whoami?tenant_id=evil-tenant", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+raw)

	res2, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res2.Body.Close()
	if res2.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(res2.Body)
		t.Fatalf("status %d body %s", res2.StatusCode, body)
	}
	body, err := io.ReadAll(res2.Body)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(body), "evil-tenant") {
		t.Fatalf("untrusted tenant_id must not appear: %s", body)
	}
	if !strings.Contains(string(body), "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") {
		t.Fatalf("expected trusted tenant in body: %s", body)
	}
}

func TestWhoAmI_missingTenantClaim_returns403(t *testing.T) {
	t.Parallel()
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	kid := "kid-no-tenant"
	jwks := mustRSAJWKS(t, &priv.PublicKey, kid)
	const iss = "http://kc.example/auth/realms/april"
	const aud = "april-profile-api"
	v, err := auth.NewValidatorFromJWKSJSON(jwks, iss, aud, "tenant_id")
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(NewMux(v, staticReadinessChecker{
		result: ReadinessResult{Ready: true, DatabaseOK: true, RedisOK: true},
	}, nil, slog.New(slog.NewTextHandler(io.Discard, nil))))
	t.Cleanup(ts.Close)

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"iss": iss,
		"sub": "user-x",
		"exp": time.Now().Add(time.Hour).Unix(),
		"azp": aud,
	})
	token.Header["kid"] = kid
	raw, err := token.SignedString(priv)
	if err != nil {
		t.Fatal(err)
	}
	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, ts.URL+"/v1/auth/whoami", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+raw)
	res, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusForbidden {
		body, _ := io.ReadAll(res.Body)
		t.Fatalf("want 403, got %d: %s", res.StatusCode, body)
	}
}

func mustRSAJWKS(t *testing.T, pub *rsa.PublicKey, kid string) []byte {
	t.Helper()
	n := base64.RawURLEncoding.EncodeToString(pub.N.Bytes())
	e := base64.RawURLEncoding.EncodeToString(big.NewInt(int64(pub.E)).Bytes())
	key := map[string]any{
		"kty": "RSA",
		"kid": kid,
		"use": "sig",
		"alg": "RS256",
		"n":   n,
		"e":   e,
	}
	out, err := json.Marshal(map[string]any{"keys": []map[string]any{key}})
	if err != nil {
		t.Fatal(err)
	}
	return out
}

func TestReadyz_returns503WhenDependenciesUnavailable(t *testing.T) {
	t.Parallel()
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	jwks := mustRSAJWKS(t, &priv.PublicKey, "kid-readyz")
	v, err := auth.NewValidatorFromJWKSJSON(jwks, "http://kc.example/auth/realms/april", "april-profile-api", "tenant_id")
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(NewMux(v, staticReadinessChecker{
		result: ReadinessResult{Ready: false, DatabaseOK: false, RedisOK: false},
	}, nil, slog.New(slog.NewTextHandler(io.Discard, nil))))
	t.Cleanup(ts.Close)

	res, err := ts.Client().Get(ts.URL + "/readyz")
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusServiceUnavailable {
		t.Fatalf("want 503, got %d", res.StatusCode)
	}
	body, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(body), `"status":"not_ready"`) {
		t.Fatalf("unexpected body: %s", body)
	}
}

func TestRequestLogging_includesRequestID(t *testing.T) {
	t.Parallel()
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	jwks := mustRSAJWKS(t, &priv.PublicKey, "kid-log")
	v, err := auth.NewValidatorFromJWKSJSON(jwks, "http://kc.example/auth/realms/april", "april-profile-api", "tenant_id")
	if err != nil {
		t.Fatal(err)
	}

	var logBuf bytes.Buffer
	logger := slog.New(slog.NewTextHandler(&logBuf, nil))
	ts := httptest.NewServer(NewMux(v, staticReadinessChecker{
		result: ReadinessResult{Ready: true, DatabaseOK: true, RedisOK: true},
	}, nil, logger))
	t.Cleanup(ts.Close)

	res, err := ts.Client().Get(ts.URL + "/healthz")
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		t.Fatalf("want 200, got %d", res.StatusCode)
	}
	requestID := res.Header.Get("X-Request-Id")
	if requestID == "" {
		t.Fatal("missing X-Request-Id header")
	}
	if !strings.Contains(logBuf.String(), "request_id="+requestID) {
		t.Fatalf("request_id must be present in logs, got: %s", logBuf.String())
	}
}

type staticReadinessChecker struct {
	result ReadinessResult
}

func (s staticReadinessChecker) Check(context.Context) ReadinessResult {
	return s.result
}

func TestEntityTypesPublish_invalidDraftSchemaReturns422(t *testing.T) {
	t.Parallel()
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	kid := "kid-publish-invalid-schema"
	jwks := mustRSAJWKS(t, &priv.PublicKey, kid)
	const iss = "http://kc.example/auth/realms/april"
	const aud = "april-profile-api"
	v, err := auth.NewValidatorFromJWKSJSON(jwks, iss, aud, "tenant_id")
	if err != nil {
		t.Fatal(err)
	}
	catalog := &stubCatalog{
		publishFn: func(_ context.Context, _, _ string) (entitytypes.Record, error) {
			return entitytypes.Record{}, entitytypes.ErrInvalidSchema
		},
	}
	ts := httptest.NewServer(NewMux(v, staticReadinessChecker{
		result: ReadinessResult{Ready: true, DatabaseOK: true, RedisOK: true},
	}, catalog, slog.New(slog.NewTextHandler(io.Discard, nil))))
	t.Cleanup(ts.Close)

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"iss":       iss,
		"sub":       "user-42",
		"exp":       time.Now().Add(time.Hour).Unix(),
		"azp":       aud,
		"tenant_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
	})
	token.Header["kid"] = kid
	raw, err := token.SignedString(priv)
	if err != nil {
		t.Fatal(err)
	}
	req, err := http.NewRequestWithContext(context.Background(), http.MethodPost, ts.URL+"/v1/entity-types/11111111-1111-1111-1111-111111111111/publish", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+raw)
	res, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusUnprocessableEntity {
		body, _ := io.ReadAll(res.Body)
		t.Fatalf("want 422, got %d: %s", res.StatusCode, body)
	}
}

type stubCatalog struct {
	createDraftFn func(ctx context.Context, tenantID string, params entitytypes.CreateDraftParams) (entitytypes.Record, error)
	listFn        func(ctx context.Context, tenantID string) ([]entitytypes.Record, error)
	publishFn     func(ctx context.Context, tenantID, entityTypeID string) (entitytypes.Record, error)
}

func (s *stubCatalog) CreateDraft(ctx context.Context, tenantID string, params entitytypes.CreateDraftParams) (entitytypes.Record, error) {
	if s.createDraftFn == nil {
		return entitytypes.Record{}, nil
	}
	return s.createDraftFn(ctx, tenantID, params)
}

func (s *stubCatalog) List(ctx context.Context, tenantID string) ([]entitytypes.Record, error) {
	if s.listFn == nil {
		return []entitytypes.Record{}, nil
	}
	return s.listFn(ctx, tenantID)
}

func (s *stubCatalog) Publish(ctx context.Context, tenantID, entityTypeID string) (entitytypes.Record, error) {
	if s.publishFn == nil {
		return entitytypes.Record{}, nil
	}
	return s.publishFn(ctx, tenantID, entityTypeID)
}
