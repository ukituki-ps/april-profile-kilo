// Package workerapp — запуск Asynq Server и Scheduler (фоновый воркер april-worker).
package workerapp

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

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
		DB:              pool,
		RDB:             rdb,
		Publisher:       asyncjobs.StubPublisher{},
		OutboxBatchSize: cfg.OutboxBatchSize,
	}
	mux := asynq.NewServeMux()
	h.Register(mux)

	srv := asynq.NewServer(redisOpt, asynq.Config{
		Concurrency: cfg.AsynqConcurrency,
		Queues: map[string]int{
			asyncjobs.QueueOutbox:   6,
			asyncjobs.QueueDefault: 3,
		},
	})

	sched := asynq.NewScheduler(redisOpt, nil)

	if _, err := sched.Register(config.FormatEveryCron(cfg.PingInterval), asyncjobs.NewPingTask()); err != nil {
		return fmt.Errorf("scheduler register ping: %w", err)
	}
	if _, err := sched.Register(config.FormatEveryCron(cfg.OutboxInterval), asyncjobs.NewOutboxBatchTask()); err != nil {
		return fmt.Errorf("scheduler register outbox: %w", err)
	}

	slog.Info("AprilProfile Asynq worker starting",
		"version", version.String(),
		"concurrency", cfg.AsynqConcurrency,
		"queues", []string{asyncjobs.QueueDefault, asyncjobs.QueueOutbox},
		"ping_every", cfg.PingInterval.String(),
		"outbox_every", cfg.OutboxInterval.String(),
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
