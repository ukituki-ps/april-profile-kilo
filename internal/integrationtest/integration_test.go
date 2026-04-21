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

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	tcredis "github.com/testcontainers/testcontainers-go/modules/redis"
	"github.com/testcontainers/testcontainers-go/wait"

	"github.com/ukituki-ps/april-profile/internal/auth"
	"github.com/ukituki-ps/april-profile/internal/httpapi"
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

	for _, table := range []string{"tenants", "entity_types", "entities", "profile_events"} {
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

	srv := httptest.NewServer(httpapi.NewMux(validator, checker, slog.New(slog.NewTextHandler(io.Discard, nil))))
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
