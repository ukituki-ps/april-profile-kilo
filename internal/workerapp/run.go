// Package workerapp — запуск Asynq Server и Scheduler (фоновый воркер april-worker).
package workerapp

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/ukituki-ps/april-profile/internal/asyncjobs"
	"github.com/ukituki-ps/april-profile/internal/config"
	"github.com/ukituki-ps/april-profile/internal/version"
)

// Run блокируется до отмены ctx: обработчик задач + планировщик периодических задач.
func Run(ctx context.Context) error {
	cfg, err := config.LoadWorker()
	if err != nil {
		return err
	}

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("worker pgxpool: %w", err)
	}
	defer pool.Close()

	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})
	defer func() { _ = rdb.Close() }()

	redisOpt := asynq.RedisClientOpt{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	}

	h := &asyncjobs.Handlers{
		DB:                       pool,
		RDB:                      rdb,
		Publisher:                asyncjobs.StubPublisher{},
		OutboxBatchSize:          cfg.OutboxBatchSize,
		OutboxPublishMaxAttempts: cfg.OutboxPublishMaxAttempts,
		OutboxPublishBackoffBase: cfg.OutboxPublishBackoffBase,
		SourceClient:             asyncjobs.NoopSourceClient{},
		SyncBatchSize:            cfg.SyncBatchSize,
	}
	h.LagMetrics, err = asyncjobs.NewSyncLagMetrics(nil)
	if err != nil {
		return fmt.Errorf("init sync lag metrics: %w", err)
	}
	mux := asynq.NewServeMux()
	h.Register(mux)

	retryBase := cfg.AsynqRetryBaseDelay
	if retryBase <= 0 {
		retryBase = 2 * time.Second
	}
	srv := asynq.NewServer(redisOpt, asynq.Config{
		Concurrency: cfg.AsynqConcurrency,
		Queues: map[string]int{
			asyncjobs.QueueOutbox:  6,
			asyncjobs.QueueDefault: 3,
			asyncjobs.QueueSync:    3,
		},
		RetryDelayFunc: func(n int, err error, task *asynq.Task) time.Duration {
			_ = err
			_ = task
			if n < 0 {
				n = 0
			}
			if n > 16 {
				n = 16
			}
			d := retryBase
			for i := 0; i < n; i++ {
				next := d * 2
				if next < d {
					return 15 * time.Minute
				}
				d = next
				if d > 15*time.Minute {
					return 15 * time.Minute
				}
			}
			if d > 15*time.Minute {
				return 15 * time.Minute
			}
			return d
		},
		ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
			tid, _ := asynq.GetTaskID(ctx)
			slog.WarnContext(ctx, "asynq task handler returned error (retries/archive по политике Asynq)",
				"task_type", task.Type(),
				"asynq_task_id", tid,
				"err", err,
			)
		}),
	})

	sched := asynq.NewScheduler(redisOpt, nil)

	if _, err := sched.Register(config.FormatEveryCron(cfg.PingInterval), asyncjobs.NewPingTask(
		asynq.MaxRetry(cfg.AsynqPingMaxRetry),
		asynq.Timeout(cfg.AsynqPingTimeout),
	)); err != nil {
		return fmt.Errorf("scheduler register ping: %w", err)
	}
	if _, err := sched.Register(config.FormatEveryCron(cfg.OutboxInterval), asyncjobs.NewOutboxBatchTask(
		asynq.MaxRetry(cfg.AsynqOutboxMaxRetry),
		asynq.Timeout(cfg.AsynqOutboxTimeout),
	)); err != nil {
		return fmt.Errorf("scheduler register outbox: %w", err)
	}
	for _, sourceSystem := range cfg.SyncSourceSystems {
		task, err := asyncjobs.NewSourceSyncTask(sourceSystem,
			asynq.MaxRetry(cfg.AsynqSyncMaxRetry),
			asynq.Timeout(cfg.AsynqSyncTimeout),
		)
		if err != nil {
			return fmt.Errorf("build source sync task: %w", err)
		}
		if _, err := sched.Register(config.FormatEveryCron(cfg.SyncInterval), task); err != nil {
			return fmt.Errorf("scheduler register source sync (%s): %w", sourceSystem, err)
		}
	}

	slog.Info("AprilProfile Asynq worker starting",
		"version", version.String(),
		"concurrency", cfg.AsynqConcurrency,
		"queues", []string{asyncjobs.QueueDefault, asyncjobs.QueueOutbox, asyncjobs.QueueSync},
		"ping_every", cfg.PingInterval.String(),
		"outbox_every", cfg.OutboxInterval.String(),
		"sync_every", cfg.SyncInterval.String(),
		"sync_sources", cfg.SyncSourceSystems,
	)

	if err := srv.Start(mux); err != nil {
		return fmt.Errorf("asynq server start: %w", err)
	}
	if err := sched.Start(); err != nil {
		srv.Shutdown()
		return fmt.Errorf("asynq scheduler start: %w", err)
	}

	<-ctx.Done()
	slog.Info("AprilProfile Asynq worker shutdown requested")
	sched.Shutdown()
	srv.Shutdown()

	if err := ctx.Err(); err != nil && !errors.Is(err, context.Canceled) {
		return err
	}
	slog.Info("AprilProfile Asynq worker stopped")
	return nil
}
