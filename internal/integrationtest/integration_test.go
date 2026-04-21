//go:build integration

package integrationtest

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"math/big"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	tcredis "github.com/testcontainers/testcontainers-go/modules/redis"
	"github.com/testcontainers/testcontainers-go/wait"

	"github.com/ukituki-ps/april-profile/internal/abac"
	"github.com/ukituki-ps/april-profile/internal/auth"
	"github.com/ukituki-ps/april-profile/internal/entitytypes"
	"github.com/ukituki-ps/april-profile/internal/httpapi"
	"github.com/ukituki-ps/april-profile/internal/profiles"
)

const atlasImage = "arigaio/atlas:0.32.0"

func TestAtlasMigrationsAppliedOnPostgresContainer(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	pgURL, cleanup := startPostgresWithAtlasMigrations(t, ctx)
	defer cleanup()

	pool, err := pgxpool.New(ctx, pgURL)
	if err != nil {
		t.Fatalf("pgxpool new: %v", err)
	}
	defer pool.Close()

	for _, table := range []string{"tenants", "entity_types", "entities", "profile_outbox", "profile_field_conflicts", "admin_audit_log"} {
		table := table
		t.Run(table, func(t *testing.T) {
			var exists bool
			if err := pool.QueryRow(ctx, `
				SELECT EXISTS (
					SELECT 1
					FROM information_schema.tables
					WHERE table_schema='public' AND table_name=$1
				)
			`, table).Scan(&exists); err != nil {
				t.Fatalf("query table %s: %v", table, err)
			}
			if !exists {
				t.Fatalf("expected table %s to exist after atlas migrate apply", table)
			}
		})
	}
}

func TestReadyzWithRealPostgresAndRedis(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	pgURL, cleanupPG := startPostgresWithAtlasMigrations(t, ctx)
	defer cleanupPG()
	redisAddr, cleanupRedis := startRedis(t, ctx)
	defer cleanupRedis()

	dbPool, err := pgxpool.New(ctx, pgURL)
	if err != nil {
		t.Fatalf("pgxpool new: %v", err)
	}
	defer dbPool.Close()

	redisOptions, err := redis.ParseURL(redisAddr)
	if err != nil {
		t.Fatalf("parse redis addr: %v", err)
	}
	redisClient := redis.NewClient(redisOptions)
	defer func() { _ = redisClient.Close() }()

	validator := newTestValidator(t)
	checker := &integrationReadinessChecker{
		dbPool:      dbPool,
		redisClient: redisClient,
		timeout:     3 * time.Second,
	}

	ps := profiles.NewService(dbPool)
	srv := httptest.NewServer(httpapi.NewMux(
		validator,
		checker,
		entitytypes.NewCatalog(dbPool),
		ps,
		ps,
		"",
		nil,
		slog.New(slog.NewTextHandler(io.Discard, nil)),
	))
	defer srv.Close()

	res, err := srv.Client().Get(srv.URL + "/healthz")
	if err != nil {
		t.Fatalf("healthz request: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(res.Body)
		t.Fatalf("healthz expected 200, got %d body=%s", res.StatusCode, string(body))
	}

	resReady, err := srv.Client().Get(srv.URL + "/readyz")
	if err != nil {
		t.Fatalf("readyz request: %v", err)
	}
	defer resReady.Body.Close()
	if resReady.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resReady.Body)
		t.Fatalf("readyz expected 200, got %d body=%s", resReady.StatusCode, string(body))
	}
}

func TestProfilesService_AppendOnlyVersioningAndExternalMappings(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	pgURL, cleanup := startPostgresWithAtlasMigrations(t, ctx)
	defer cleanup()

	pool, err := pgxpool.New(ctx, pgURL)
	if err != nil {
		t.Fatalf("pgxpool new: %v", err)
	}
	defer pool.Close()

	tenantID := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	entityTypeID := "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
	if _, err := pool.Exec(ctx, `
		INSERT INTO tenants (id) VALUES ($1)
	`, tenantID); err != nil {
		t.Fatalf("insert tenant: %v", err)
	}
	if _, err := pool.Exec(ctx, `
		INSERT INTO entity_types (
			id,
			tenant_id,
			namespace,
			code,
			schema_json,
			schema_version,
			status,
			published_schema_json,
			published_schema_version,
			published_at
		) VALUES (
			$1, $2, 'hr', 'employee',
			'{"type":"object","properties":{"name":{"type":"string"}}}'::jsonb,
			1,
			'published',
			'{"type":"object","properties":{"name":{"type":"string"}}}'::jsonb,
			1,
			now()
		)
	`, entityTypeID, tenantID); err != nil {
		t.Fatalf("insert entity type: %v", err)
	}

	service := profiles.NewService(pool)
	created, err := service.Create(ctx, tenantID, profiles.CreateParams{
		EntityTypeID: entityTypeID,
		Document:     map[string]any{"name": "Alice", "email": "alice@april.local"},
		ExternalRefs: []profiles.ExternalRef{
			{SourceSystem: "hris", ExternalID: "E-100"},
		},
	})
	if err != nil {
		t.Fatalf("create profile: %v", err)
	}
	if created.Version != 1 {
		t.Fatalf("want version 1, got %d", created.Version)
	}

	updated, err := service.Update(ctx, tenantID, created.EntityID, profiles.UpdateParams{
		Document: map[string]any{"name": "Alice Cooper", "email": "alice@april.local"},
		ExternalRefs: []profiles.ExternalRef{
			{SourceSystem: "hris", ExternalID: "E-100"},
			{SourceSystem: "ad", ExternalID: "alice.ad"},
		},
	})
	if err != nil {
		t.Fatalf("update profile: %v", err)
	}
	if updated.Version != 2 {
		t.Fatalf("want version 2, got %d", updated.Version)
	}

	v1, err := service.GetByVersion(ctx, tenantID, created.EntityID, 1)
	if err != nil {
		t.Fatalf("get version 1: %v", err)
	}
	if got := v1.Document["name"]; got != "Alice" {
		t.Fatalf("want v1 name Alice, got %v", got)
	}

	byExternal, err := service.GetCurrentByExternalRef(ctx, tenantID, profiles.ExternalRef{
		SourceSystem: "ad",
		ExternalID:   "alice.ad",
	})
	if err != nil {
		t.Fatalf("get by external: %v", err)
	}
	if byExternal.EntityID != created.EntityID {
		t.Fatalf("unexpected entity by external: %s", byExternal.EntityID)
	}

	if err := service.Delete(ctx, tenantID, created.EntityID); err != nil {
		t.Fatalf("delete profile: %v", err)
	}
	if _, err := service.GetCurrent(ctx, tenantID, created.EntityID); err == nil {
		t.Fatal("expected not found after delete")
	}
}

func TestProfileOutbox_eventContractAndIdempotency(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	pgURL, cleanup := startPostgresWithAtlasMigrations(t, ctx)
	defer cleanup()

	pool, err := pgxpool.New(ctx, pgURL)
	if err != nil {
		t.Fatalf("pgxpool new: %v", err)
	}
	defer pool.Close()

	tenantID := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	entityTypeID := "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
	if _, err := pool.Exec(ctx, `INSERT INTO tenants (id) VALUES ($1)`, tenantID); err != nil {
		t.Fatalf("insert tenant: %v", err)
	}
	if _, err := pool.Exec(ctx, `
		INSERT INTO entity_types (
			id, tenant_id, namespace, code, schema_json, schema_version, status,
			published_schema_json, published_schema_version, published_at
		) VALUES (
			$1, $2, 'hr', 'employee',
			'{"type":"object","properties":{"name":{"type":"string"}}}'::jsonb,
			1, 'published',
			'{"type":"object","properties":{"name":{"type":"string"}}}'::jsonb,
			1, now()
		)
	`, entityTypeID, tenantID); err != nil {
		t.Fatalf("insert entity type: %v", err)
	}

	service := profiles.NewService(pool)
	created, err := service.Create(ctx, tenantID, profiles.CreateParams{
		EntityTypeID: entityTypeID,
		Document:     map[string]any{"name": "Alice"},
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	var n int
	if err := pool.QueryRow(ctx, `
		SELECT count(*) FROM profile_outbox WHERE tenant_id = $1 AND entity_id = $2::uuid
	`, tenantID, created.EntityID).Scan(&n); err != nil {
		t.Fatalf("count outbox: %v", err)
	}
	if n != 1 {
		t.Fatalf("want 1 outbox row after create, got %d", n)
	}

	var payload []byte
	var eventID, entityType string
	var pv int64
	var rowStatus string
	if err := pool.QueryRow(ctx, `
		SELECT event_id::text, entity_type, profile_version, payload, status
		FROM profile_outbox
		WHERE tenant_id = $1 AND entity_id = $2::uuid AND profile_version = 1
	`, tenantID, created.EntityID).Scan(&eventID, &entityType, &pv, &payload, &rowStatus); err != nil {
		t.Fatalf("load outbox: %v", err)
	}
	if rowStatus != "pending" {
		t.Fatalf("want outbox status pending before Asynq publish, got %q", rowStatus)
	}
	if entityType != "hr/employee" || pv != 1 {
		t.Fatalf("unexpected row: type=%s v=%d", entityType, pv)
	}
	var doc map[string]any
	if err := json.Unmarshal(payload, &doc); err != nil {
		t.Fatalf("payload json: %v", err)
	}
	if doc["event_id"] != eventID || doc["entity_type"] != "hr/employee" {
		t.Fatalf("payload mismatch: %v", doc)
	}

	updated, err := service.Update(ctx, tenantID, created.EntityID, profiles.UpdateParams{
		Document: map[string]any{"name": "Bob"},
	})
	if err != nil {
		t.Fatalf("update: %v", err)
	}
	if updated.Version != 2 {
		t.Fatalf("want version 2, got %d", updated.Version)
	}
	if err := pool.QueryRow(ctx, `
		SELECT count(*) FROM profile_outbox WHERE tenant_id = $1 AND entity_id = $2::uuid
	`, tenantID, created.EntityID).Scan(&n); err != nil {
		t.Fatalf("count outbox 2: %v", err)
	}
	if n != 2 {
		t.Fatalf("want 2 outbox rows, got %d", n)
	}

	// Повторная вставка с тем же (tenant, entity, version) не проходит уникальное ограничение.
	_, err = pool.Exec(ctx, `
		INSERT INTO profile_outbox (
			event_id, tenant_id, entity_id, entity_type, profile_version, occurred_at, payload, status
		) VALUES (
			gen_random_uuid(), $1, $2::uuid, 'hr/employee', 2, now(), '{}'::jsonb, 'pending'
		)
	`, tenantID, created.EntityID)
	if err == nil {
		t.Fatal("expected unique violation on duplicate profile_version")
	}
}

// alwaysHealthyReadiness — для HTTP-тестов без отдельного Redis в контейнере.
type alwaysHealthyReadiness struct{}

func (alwaysHealthyReadiness) Check(context.Context) httpapi.ReadinessResult {
	return httpapi.ReadinessResult{Ready: true, DatabaseOK: true, RedisOK: true}
}

func TestABAC_GetCurrent_filtersNamespacesByJWTRealmRoles(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	pgURL, cleanup := startPostgresWithAtlasMigrations(t, ctx)
	defer cleanup()

	pool, err := pgxpool.New(ctx, pgURL)
	if err != nil {
		t.Fatalf("pgxpool new: %v", err)
	}
	defer pool.Close()

	tenantID := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	entityTypeID := "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
	if _, err := pool.Exec(ctx, `INSERT INTO tenants (id) VALUES ($1)`, tenantID); err != nil {
		t.Fatalf("insert tenant: %v", err)
	}
	if _, err := pool.Exec(ctx, `
		INSERT INTO entity_types (
			id, tenant_id, namespace, code, schema_json, schema_version, status,
			published_schema_json, published_schema_version, published_at
		) VALUES (
			$1, $2, 'hr', 'employee',
			'{"type":"object","properties":{"name":{"type":"string"}}}'::jsonb,
			1, 'published',
			'{"type":"object","properties":{"name":{"type":"string"}}}'::jsonb,
			1, now()
		)
	`, entityTypeID, tenantID); err != nil {
		t.Fatalf("insert entity type: %v", err)
	}

	svc := profiles.NewService(pool)
	created, err := svc.Create(ctx, tenantID, profiles.CreateParams{
		EntityTypeID: entityTypeID,
		Document: map[string]any{
			"name":     "N",
			"hr":       map[string]any{"title": "T"},
			"security": map[string]any{"lvl": 3},
		},
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	v, priv, kid := newValidatorWithSigner(t)
	const iss = "http://kc.example/auth/realms/april"
	const aud = "april-profile-api"
	policy, err := abac.ParsePolicy(`{"default":["reader"],"hr":["reader"],"security":["sec-role"]}`)
	if err != nil || policy == nil {
		t.Fatalf("policy: %v", err)
	}
	srv := httptest.NewServer(httpapi.NewMux(
		v,
		alwaysHealthyReadiness{},
		entitytypes.NewCatalog(pool),
		svc,
		svc,
		"",
		policy,
		slog.New(slog.NewTextHandler(io.Discard, nil)),
	))
	defer srv.Close()

	tokenReader := integrationSignedToken(t, priv, kid, iss, aud, tenantID, []string{"reader"})
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, srv.URL+"/v1/entities/"+created.EntityID, nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+tokenReader)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	if res.StatusCode != http.StatusOK {
		t.Fatalf("status %d body %s", res.StatusCode, string(body))
	}
	var got map[string]any
	if err := json.Unmarshal(body, &got); err != nil {
		t.Fatal(err)
	}
	doc, _ := got["document"].(map[string]any)
	if doc["security"] != nil {
		t.Fatalf("security leak: %v", doc)
	}

	tokenSec := integrationSignedToken(t, priv, kid, iss, aud, tenantID, []string{"sec-role"})
	req2, err := http.NewRequestWithContext(ctx, http.MethodGet, srv.URL+"/v1/entities/"+created.EntityID, nil)
	if err != nil {
		t.Fatal(err)
	}
	req2.Header.Set("Authorization", "Bearer "+tokenSec)
	res2, err := http.DefaultClient.Do(req2)
	if err != nil {
		t.Fatal(err)
	}
	defer res2.Body.Close()
	body2, _ := io.ReadAll(res2.Body)
	if res2.StatusCode != http.StatusOK {
		t.Fatalf("status %d body %s", res2.StatusCode, string(body2))
	}
	var got2 map[string]any
	if err := json.Unmarshal(body2, &got2); err != nil {
		t.Fatal(err)
	}
	doc2, _ := got2["document"].(map[string]any)
	if doc2["security"] == nil {
		t.Fatal("expected security for sec-role token")
	}
	if doc2["name"] != nil {
		t.Fatalf("default hidden without reader: %v", doc2)
	}
}

func newValidatorWithSigner(t *testing.T) (v *auth.Validator, priv *rsa.PrivateKey, kid string) {
	t.Helper()
	kid = "integration-abac-kid"
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("rsa: %v", err)
	}
	jwks := mustRSAJWKS(t, &priv.PublicKey, kid)
	validator, err := auth.NewValidatorFromJWKSJSON(
		jwks,
		"http://kc.example/auth/realms/april",
		"april-profile-api",
		"tenant_id",
	)
	if err != nil {
		t.Fatalf("validator: %v", err)
	}
	return validator, priv, kid
}

func integrationSignedToken(t *testing.T, priv *rsa.PrivateKey, kid, iss, aud, tenantID string, roles []string) string {
	t.Helper()
	arr := make([]any, len(roles))
	for i := range roles {
		arr[i] = roles[i]
	}
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"iss":       iss,
		"sub":       "integration-user",
		"exp":       time.Now().Add(time.Hour).Unix(),
		"azp":       aud,
		"tenant_id": tenantID,
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

type integrationReadinessChecker struct {
	dbPool      *pgxpool.Pool
	redisClient *redis.Client
	timeout     time.Duration
}

func (c *integrationReadinessChecker) Check(ctx context.Context) httpapi.ReadinessResult {
	deadlineCtx, cancel := context.WithTimeout(ctx, c.timeout)
	defer cancel()

	result := httpapi.ReadinessResult{}
	if err := c.dbPool.Ping(deadlineCtx); err == nil {
		result.DatabaseOK = true
	}
	if err := c.redisClient.Ping(deadlineCtx).Err(); err == nil {
		result.RedisOK = true
	}
	result.Ready = result.DatabaseOK && result.RedisOK
	return result
}

func startPostgresWithAtlasMigrations(t *testing.T, ctx context.Context) (string, func()) {
	t.Helper()

	pgContainer, err := postgres.Run(
		ctx,
		"postgres:17-alpine",
		postgres.WithDatabase("april_profile"),
		postgres.WithUsername("april"),
		postgres.WithPassword("april"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).
				WithStartupTimeout(90*time.Second),
		),
	)
	if err != nil {
		t.Fatalf("start postgres container: %v", err)
	}

	connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		_ = pgContainer.Terminate(ctx)
		t.Fatalf("postgres connection string: %v", err)
	}

	applyAtlasMigrations(t, ctx, connStr)

	cleanup := func() {
		_ = pgContainer.Terminate(context.Background())
	}
	return connStr, cleanup
}

func startRedis(t *testing.T, ctx context.Context) (string, func()) {
	t.Helper()

	redisContainer, err := tcredis.Run(ctx, "redis:7-alpine")
	if err != nil {
		t.Fatalf("start redis container: %v", err)
	}

	addr, err := redisContainer.ConnectionString(ctx)
	if err != nil {
		_ = redisContainer.Terminate(ctx)
		t.Fatalf("redis connection string: %v", err)
	}

	cleanup := func() {
		_ = redisContainer.Terminate(context.Background())
	}
	return addr, cleanup
}

func applyAtlasMigrations(t *testing.T, ctx context.Context, databaseURL string) {
	t.Helper()

	repoRoot := findRepoRoot(t)
	cmd := exec.CommandContext(
		ctx,
		"docker",
		"run",
		"--rm",
		"--network",
		"host",
		"-v",
		fmt.Sprintf("%s:/work", repoRoot),
		"-w",
		"/work",
		"-e",
		fmt.Sprintf("DATABASE_URL=%s", databaseURL),
		atlasImage,
		"migrate",
		"apply",
		"--env",
		"local",
	)
	output, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("atlas migrate apply failed: %v\n%s", err, string(output))
	}
}

func findRepoRoot(t *testing.T) string {
	t.Helper()

	wd, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}

	current := wd
	for {
		if _, err := os.Stat(filepath.Join(current, "go.mod")); err == nil {
			return current
		}
		parent := filepath.Dir(current)
		if parent == current {
			t.Fatalf("repo root with go.mod not found from %s", wd)
		}
		current = parent
	}
}

func newTestValidator(t *testing.T) *auth.Validator {
	t.Helper()

	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("rsa generate: %v", err)
	}

	jwks := mustRSAJWKS(t, &priv.PublicKey, "integration-kid")
	validator, err := auth.NewValidatorFromJWKSJSON(
		jwks,
		"http://kc.example/auth/realms/april",
		"april-profile-api",
		"tenant_id",
	)
	if err != nil {
		t.Fatalf("validator from jwks: %v", err)
	}
	return validator
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
		t.Fatalf("marshal jwks: %v", err)
	}
	return out
}
