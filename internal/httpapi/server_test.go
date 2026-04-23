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

	"github.com/ukituki-ps/april-profile/internal/abac"
	"github.com/ukituki-ps/april-profile/internal/auth"
	"github.com/ukituki-ps/april-profile/internal/entitytypes"
	"github.com/ukituki-ps/april-profile/internal/profiles"
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
	}, nil, nil, nil, "", nil, slog.New(slog.NewTextHandler(io.Discard, nil))))
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
	}, nil, nil, nil, "", nil, slog.New(slog.NewTextHandler(io.Discard, nil))))
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
	}, nil, nil, nil, "", nil, slog.New(slog.NewTextHandler(io.Discard, nil))))
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
	}, nil, nil, nil, "", nil, slog.New(slog.NewTextHandler(io.Discard, nil))))
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
	}, nil, nil, nil, "", nil, logger))
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
	if !strings.Contains(logBuf.String(), "requestId="+requestID) {
		t.Fatalf("requestId must be present in logs, got: %s", logBuf.String())
	}
	if !strings.Contains(logBuf.String(), "correlationId=") {
		t.Fatalf("correlationId must be present in logs, got: %s", logBuf.String())
	}
}

func TestMetrics_returnsPrometheusText(t *testing.T) {
	t.Parallel()
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	jwks := mustRSAJWKS(t, &priv.PublicKey, "kid-metrics")
	v, err := auth.NewValidatorFromJWKSJSON(jwks, "http://kc.example/auth/realms/april", "april-profile-api", "tenant_id")
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(NewMux(v, staticReadinessChecker{
		result: ReadinessResult{Ready: true, DatabaseOK: true, RedisOK: true},
	}, nil, nil, nil, "", nil, slog.New(slog.NewTextHandler(io.Discard, nil))))
	t.Cleanup(ts.Close)

	// CounterVec emits a series only after first observation with concrete labels.
	// Prime one request through the HTTP middleware chain before scraping /metrics.
	warmupRes, err := ts.Client().Get(ts.URL + "/healthz")
	if err != nil {
		t.Fatal(err)
	}
	_ = warmupRes.Body.Close()
	if warmupRes.StatusCode != http.StatusOK {
		t.Fatalf("warmup status %d", warmupRes.StatusCode)
	}

	res, err := ts.Client().Get(ts.URL + "/metrics")
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(res.Body)
		t.Fatalf("status %d body %s", res.StatusCode, body)
	}
	ct := res.Header.Get("Content-Type")
	if !strings.HasPrefix(ct, "text/plain") {
		t.Fatalf("unexpected Content-Type: %q", ct)
	}
	body, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	s := string(body)
	if !strings.Contains(s, "april_profile_http_requests_total") {
		t.Fatalf("expected april_profile_http_requests_total in body, got head: %.200q", s)
	}
	if !strings.Contains(s, "go_goroutines") {
		t.Fatalf("expected go_goroutines from Go collector, got head: %.200q", s)
	}
}

func TestCorrelationId_header_roundTrip(t *testing.T) {
	t.Parallel()
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	jwks := mustRSAJWKS(t, &priv.PublicKey, "kid-corr")
	v, err := auth.NewValidatorFromJWKSJSON(jwks, "http://kc.example/auth/realms/april", "april-profile-api", "tenant_id")
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(NewMux(v, staticReadinessChecker{
		result: ReadinessResult{Ready: true, DatabaseOK: true, RedisOK: true},
	}, nil, nil, nil, "", nil, slog.New(slog.NewTextHandler(io.Discard, nil))))
	t.Cleanup(ts.Close)

	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, ts.URL+"/healthz", nil)
	if err != nil {
		t.Fatal(err)
	}
	const wantCorr = "corr-from-client-9f2a"
	req.Header.Set("X-Correlation-Id", wantCorr)
	res, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if got := res.Header.Get("X-Correlation-Id"); got != wantCorr {
		t.Fatalf("X-Correlation-Id: want %q got %q", wantCorr, got)
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
	}, catalog, nil, nil, "", nil, slog.New(slog.NewTextHandler(io.Discard, nil))))
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

func TestEntitiesByVersion_ABAC_filtersDocumentByRealmRoles(t *testing.T) {
	t.Parallel()
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	kid := "kid-abac-version"
	jwks := mustRSAJWKS(t, &priv.PublicKey, kid)
	const iss = "http://kc.example/auth/realms/april"
	const aud = "april-profile-api"
	v, err := auth.NewValidatorFromJWKSJSON(jwks, iss, aud, "tenant_id")
	if err != nil {
		t.Fatal(err)
	}
	policy, err := abac.ParsePolicy(`{"default":["reader"],"hr":["reader"],"security":["sec"]}`)
	if err != nil || policy == nil {
		t.Fatalf("policy: %v", err)
	}
	service := &stubProfileService{
		getByVersionFn: func(_ context.Context, _, _ string, version int64) (profiles.Snapshot, error) {
			return profiles.Snapshot{
				EntityID:     "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				EntityTypeID: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
				Version:      version,
				Document: map[string]any{
					"name": "Alice",
					"hr":   map[string]any{"title": "Eng"},
					"security": map[string]any{
						"lvl": 1,
					},
				},
			}, nil
		},
	}
	ts := httptest.NewServer(NewMux(v, staticReadinessChecker{
		result: ReadinessResult{Ready: true, DatabaseOK: true, RedisOK: true},
	}, nil, service, nil, "", policy, slog.New(slog.NewTextHandler(io.Discard, nil))))
	t.Cleanup(ts.Close)

	tokenReader := signedTokenWithRoles(t, priv, kid, iss, aud, []string{"reader"})
	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, ts.URL+"/v1/entities/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/versions/1", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+tokenReader)
	res, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	var payload map[string]any
	if err := json.Unmarshal(body, &payload); err != nil {
		t.Fatalf("json: %v body=%s", err, string(body))
	}
	doc, _ := payload["document"].(map[string]any)
	if doc["security"] != nil {
		t.Fatalf("security must be stripped for reader, doc=%v", doc)
	}
	if doc["name"] == nil || doc["hr"] == nil {
		t.Fatalf("expected default+hr, doc=%v", doc)
	}

	tokenSec := signedTokenWithRoles(t, priv, kid, iss, aud, []string{"sec"})
	req2, _ := http.NewRequestWithContext(context.Background(), http.MethodGet, ts.URL+"/v1/entities/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/versions/1", nil)
	req2.Header.Set("Authorization", "Bearer "+tokenSec)
	res2, err := ts.Client().Do(req2)
	if err != nil {
		t.Fatal(err)
	}
	defer res2.Body.Close()
	body2, _ := io.ReadAll(res2.Body)
	var payload2 map[string]any
	if err := json.Unmarshal(body2, &payload2); err != nil {
		t.Fatalf("json: %v", err)
	}
	doc2, _ := payload2["document"].(map[string]any)
	if doc2["security"] == nil {
		t.Fatal("security visible for sec role")
	}
	if doc2["name"] != nil {
		t.Fatalf("default segment must be hidden without reader role, got %#v", doc2)
	}
}

func signedTokenWithRoles(t *testing.T, priv *rsa.PrivateKey, kid, iss, aud string, roles []string) string {
	t.Helper()
	arr := make([]any, len(roles))
	for i := range roles {
		arr[i] = roles[i]
	}
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"iss":       iss,
		"sub":       "user-42",
		"exp":       time.Now().Add(time.Hour).Unix(),
		"azp":       aud,
		"tenant_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
		"realm_access": map[string]any{
			"roles": arr,
		},
	})
	token.Header["kid"] = kid
	raw, err := token.SignedString(priv)
	if err != nil {
		t.Fatal(err)
	}
	return raw
}

func TestEntitiesByVersion_returnsSnapshot(t *testing.T) {
	t.Parallel()
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	kid := "kid-entity-by-version"
	jwks := mustRSAJWKS(t, &priv.PublicKey, kid)
	const iss = "http://kc.example/auth/realms/april"
	const aud = "april-profile-api"
	v, err := auth.NewValidatorFromJWKSJSON(jwks, iss, aud, "tenant_id")
	if err != nil {
		t.Fatal(err)
	}
	service := &stubProfileService{
		getByVersionFn: func(_ context.Context, _, _ string, version int64) (profiles.Snapshot, error) {
			return profiles.Snapshot{
				EntityID:     "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				EntityTypeID: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
				Version:      version,
				Document:     map[string]any{"name": "Alice"},
			}, nil
		},
	}
	ts := httptest.NewServer(NewMux(v, staticReadinessChecker{
		result: ReadinessResult{Ready: true, DatabaseOK: true, RedisOK: true},
	}, nil, service, nil, "", nil, slog.New(slog.NewTextHandler(io.Discard, nil))))
	t.Cleanup(ts.Close)

	token := signedToken(t, priv, kid, iss, aud)
	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, ts.URL+"/v1/entities/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/versions/3", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	res, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(res.Body)
		t.Fatalf("want 200, got %d: %s", res.StatusCode, body)
	}
	body, _ := io.ReadAll(res.Body)
	if !strings.Contains(string(body), `"version":3`) {
		t.Fatalf("unexpected body: %s", body)
	}
}

func signedToken(t *testing.T, priv *rsa.PrivateKey, kid, iss, aud string) string {
	t.Helper()
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
	return raw
}

type stubProfileService struct {
	createFn       func(ctx context.Context, tenantID string, params profiles.CreateParams) (profiles.Snapshot, error)
	updateFn       func(ctx context.Context, tenantID, entityID string, params profiles.UpdateParams) (profiles.Snapshot, error)
	getCurrentFn   func(ctx context.Context, tenantID, entityID string) (profiles.Snapshot, error)
	getByVersionFn func(ctx context.Context, tenantID, entityID string, version int64) (profiles.Snapshot, error)
	getByExtFn     func(ctx context.Context, tenantID string, ref profiles.ExternalRef) (profiles.Snapshot, error)
	deleteFn       func(ctx context.Context, tenantID, entityID string) error
}

func (s *stubProfileService) Create(ctx context.Context, tenantID string, params profiles.CreateParams) (profiles.Snapshot, error) {
	if s.createFn == nil {
		return profiles.Snapshot{}, nil
	}
	return s.createFn(ctx, tenantID, params)
}

func (s *stubProfileService) Update(ctx context.Context, tenantID, entityID string, params profiles.UpdateParams) (profiles.Snapshot, error) {
	if s.updateFn == nil {
		return profiles.Snapshot{}, nil
	}
	return s.updateFn(ctx, tenantID, entityID, params)
}

func (s *stubProfileService) GetCurrent(ctx context.Context, tenantID, entityID string) (profiles.Snapshot, error) {
	if s.getCurrentFn == nil {
		return profiles.Snapshot{}, nil
	}
	return s.getCurrentFn(ctx, tenantID, entityID)
}

func (s *stubProfileService) GetByVersion(ctx context.Context, tenantID, entityID string, version int64) (profiles.Snapshot, error) {
	if s.getByVersionFn == nil {
		return profiles.Snapshot{}, nil
	}
	return s.getByVersionFn(ctx, tenantID, entityID, version)
}

func (s *stubProfileService) GetCurrentByExternalRef(ctx context.Context, tenantID string, ref profiles.ExternalRef) (profiles.Snapshot, error) {
	if s.getByExtFn == nil {
		return profiles.Snapshot{}, nil
	}
	return s.getByExtFn(ctx, tenantID, ref)
}

func (s *stubProfileService) Delete(ctx context.Context, tenantID, entityID string) error {
	if s.deleteFn == nil {
		return nil
	}
	return s.deleteFn(ctx, tenantID, entityID)
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
