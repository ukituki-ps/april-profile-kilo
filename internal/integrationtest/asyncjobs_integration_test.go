//go:build integration

package integrationtest

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/testutil"
	"github.com/redis/go-redis/v9"
	"github.com/ukituki-ps/april-profile/internal/asyncjobs"
	"github.com/ukituki-ps/april-profile/internal/profiles"
)

func TestAsynq_ping_writesRedisKey(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	redisURL, cleanupR := startRedis(t, ctx)
	defer cleanupR()

	rOpts, err := redis.ParseURL(redisURL)
	if err != nil {
		t.Fatalf("parse redis url: %v", err)
	}
	rdb := redis.NewClient(rOpts)
	defer func() { _ = rdb.Close() }()

	redisOpt := asynq.RedisClientOpt{
		Addr:     rOpts.Addr,
		Password: rOpts.Password,
		DB:       rOpts.DB,
	}
	srv := asynq.NewServer(redisOpt, asynq.Config{
		Concurrency: 2,
		Queues: map[string]int{
			asyncjobs.QueueOutbox:  1,
			asyncjobs.QueueDefault: 1,
		},
	})
	h := &asyncjobs.Handlers{RDB: rdb, OutboxBatchSize: 10}
	mux := asynq.NewServeMux()
	h.Register(mux)
	if err := srv.Start(mux); err != nil {
		t.Fatalf("asynq server: %v", err)
	}
	defer srv.Shutdown()

	client := asynq.NewClient(redisOpt)
	if _, err := client.Enqueue(asyncjobs.NewPingTask(), asynq.MaxRetry(0)); err != nil {
		t.Fatalf("enqueue ping: %v", err)
	}

	deadline := time.Now().Add(20 * time.Second)
	for time.Now().Before(deadline) {
		s, err := rdb.Get(ctx, asyncjobs.RedisKeyLastPing).Result()
		if err == nil && s != "" {
			return
		}
		time.Sleep(100 * time.Millisecond)
	}
	t.Fatal("expected redis key set by ping task")
}

func TestAsynq_outboxBatch_marksPublished(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	pgURL, cleanupPG := startPostgresWithAtlasMigrations(t, ctx)
	defer cleanupPG()
	redisURL, cleanupR := startRedis(t, ctx)
	defer cleanupR()

	pool, err := pgxpool.New(ctx, pgURL)
	if err != nil {
		t.Fatalf("pgxpool: %v", err)
	}
	defer pool.Close()

	rOpts, err := redis.ParseURL(redisURL)
	if err != nil {
		t.Fatalf("parse redis url: %v", err)
	}
	rdb := redis.NewClient(rOpts)
	defer func() { _ = rdb.Close() }()

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
		Document:     map[string]any{"name": "Ping"},
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	var status string
	if err := pool.QueryRow(ctx, `
		SELECT status FROM profile_outbox
		WHERE tenant_id = $1 AND entity_id = $2::uuid AND profile_version = 1
	`, tenantID, created.EntityID).Scan(&status); err != nil {
		t.Fatalf("select status: %v", err)
	}
	if status != "pending" {
		t.Fatalf("want pending, got %q", status)
	}

	redisOpt := asynq.RedisClientOpt{
		Addr:     rOpts.Addr,
		Password: rOpts.Password,
		DB:       rOpts.DB,
	}
	srv := asynq.NewServer(redisOpt, asynq.Config{
		Concurrency: 2,
		Queues: map[string]int{
			asyncjobs.QueueOutbox:  6,
			asyncjobs.QueueDefault: 3,
		},
	})
	h := &asyncjobs.Handlers{
		DB:              pool,
		RDB:             rdb,
		Publisher:       asyncjobs.StubPublisher{},
		OutboxBatchSize: 10,
	}
	mux := asynq.NewServeMux()
	h.Register(mux)
	if err := srv.Start(mux); err != nil {
		t.Fatalf("asynq server: %v", err)
	}
	defer srv.Shutdown()

	client := asynq.NewClient(redisOpt)
	if _, err := client.Enqueue(asyncjobs.NewOutboxBatchTask(), asynq.MaxRetry(0)); err != nil {
		t.Fatalf("enqueue outbox: %v", err)
	}

	deadline := time.Now().Add(30 * time.Second)
	for time.Now().Before(deadline) {
		err := pool.QueryRow(ctx, `
			SELECT status FROM profile_outbox
			WHERE tenant_id = $1 AND entity_id = $2::uuid AND profile_version = 1
		`, tenantID, created.EntityID).Scan(&status)
		if err != nil {
			t.Fatalf("poll status: %v", err)
		}
		if status == "published" {
			var pubAt *time.Time
			if err := pool.QueryRow(ctx, `
				SELECT published_at FROM profile_outbox
				WHERE tenant_id = $1 AND entity_id = $2::uuid AND profile_version = 1
			`, tenantID, created.EntityID).Scan(&pubAt); err != nil {
				t.Fatalf("published_at: %v", err)
			}
			if pubAt == nil {
				t.Fatal("expected published_at set")
			}
			return
		}
		time.Sleep(100 * time.Millisecond)
	}
	t.Fatalf("expected published, last status %q", status)
}

func TestAsynq_sourceSync_checkpointAndLagMetric(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	pgURL, cleanupPG := startPostgresWithAtlasMigrations(t, ctx)
	defer cleanupPG()
	redisURL, cleanupR := startRedis(t, ctx)
	defer cleanupR()

	pool, err := pgxpool.New(ctx, pgURL)
	if err != nil {
		t.Fatalf("pgxpool: %v", err)
	}
	defer pool.Close()
	rOpts, err := redis.ParseURL(redisURL)
	if err != nil {
		t.Fatalf("parse redis url: %v", err)
	}
	rdb := redis.NewClient(rOpts)
	defer func() { _ = rdb.Close() }()

	tenantID := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	if _, err := pool.Exec(ctx, `INSERT INTO tenants (id) VALUES ($1::uuid)`, tenantID); err != nil {
		t.Fatalf("insert tenant: %v", err)
	}

	registry := prometheus.NewRegistry()
	metrics, err := asyncjobs.NewSyncLagMetrics(registry)
	if err != nil {
		t.Fatalf("new sync lag metrics: %v", err)
	}
	source := fixedSourceClient{
		batch: asyncjobs.SourceBatch{
			Records: []asyncjobs.SourceRecord{
				{EventID: "ev-1", ExternalID: "hr-1", SourceUpdatedAt: time.Now().Add(-2 * time.Minute), Payload: json.RawMessage(`{"name":"A"}`)},
				{EventID: "ev-2", ExternalID: "hr-2", SourceUpdatedAt: time.Now().Add(-90 * time.Second), Payload: json.RawMessage(`{"name":"B"}`)},
			},
			NextCursor:    "cursor-2",
			HighWatermark: time.Now().Add(-90 * time.Second),
		},
	}
	redisOpt := asynq.RedisClientOpt{Addr: rOpts.Addr, Password: rOpts.Password, DB: rOpts.DB}
	srv := asynq.NewServer(redisOpt, asynq.Config{
		Concurrency: 2,
		Queues: map[string]int{
			asyncjobs.QueueOutbox:  2,
			asyncjobs.QueueDefault: 2,
			asyncjobs.QueueSync:    4,
		},
	})
	h := &asyncjobs.Handlers{
		DB:            pool,
		RDB:           rdb,
		SourceClient:  source,
		SyncBatchSize: 100,
		LagMetrics:    metrics,
	}
	mux := asynq.NewServeMux()
	h.Register(mux)
	if err := srv.Start(mux); err != nil {
		t.Fatalf("start asynq server: %v", err)
	}
	defer srv.Shutdown()
	client := asynq.NewClient(redisOpt)
	defer func() { _ = client.Close() }()

	task, err := asyncjobs.NewSourceSyncTask("mock-hr")
	if err != nil {
		t.Fatalf("new source sync task: %v", err)
	}
	if _, err := client.Enqueue(task, asynq.MaxRetry(0)); err != nil {
		t.Fatalf("enqueue source sync 1: %v", err)
	}
	if _, err := client.Enqueue(task, asynq.MaxRetry(0)); err != nil {
		t.Fatalf("enqueue source sync 2: %v", err)
	}

	deadline := time.Now().Add(30 * time.Second)
	for time.Now().Before(deadline) {
		var count int
		var cursor string
		err := pool.QueryRow(ctx, `
			SELECT count(*) FROM source_sync_applied_events
			WHERE tenant_id = $1::uuid AND source_system = 'mock-hr'
		`, tenantID).Scan(&count)
		if err != nil {
			t.Fatalf("count applied events: %v", err)
		}
		_ = pool.QueryRow(ctx, `
			SELECT last_cursor FROM source_sync_checkpoints
			WHERE tenant_id = $1::uuid AND source_system = 'mock-hr'
		`, tenantID).Scan(&cursor)
		if count == 2 && cursor == "cursor-2" {
			metricCount := testutil.CollectAndCount(metrics.Collector(), "april_profile_source_sync_lag_seconds")
			if metricCount != 1 {
				t.Fatalf("expected 1 lag metric series, got %d", metricCount)
			}
			return
		}
		time.Sleep(120 * time.Millisecond)
	}
	t.Fatal("source sync did not converge")
}

type fixedSourceClient struct {
	batch asyncjobs.SourceBatch
}

func (f fixedSourceClient) FetchChanges(context.Context, asyncjobs.SourceFetchRequest) (asyncjobs.SourceBatch, error) {
	return f.batch, nil
}
