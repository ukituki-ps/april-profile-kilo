package config

// Конфигурация фонового воркера Asynq (см. LoadWorker): без HTTP и без обязательного Keycloak.

import (
	"fmt"
	"os"
	"strings"
	"time"
)

// WorkerConfig — DATABASE_URL + Redis + параметры очередей Asynq.
type WorkerConfig struct {
	DatabaseURL string

	RedisAddr     string
	RedisPassword string
	RedisDB       int

	AsynqConcurrency int
	OutboxBatchSize  int

	PingInterval   time.Duration
	OutboxInterval time.Duration
}

// LoadWorker читает env для процесса april-worker. Keycloak не требуется.
func LoadWorker() (WorkerConfig, error) {
	redisDB, err := intFromEnv("REDIS_DB", 0)
	if err != nil {
		return WorkerConfig{}, err
	}
	concurrency, err := intFromEnv("ASYNQ_CONCURRENCY", 4)
	if err != nil {
		return WorkerConfig{}, err
	}
	if concurrency < 1 {
		concurrency = 1
	}
	batch, err := intFromEnv("OUTBOX_BATCH_SIZE", 32)
	if err != nil {
		return WorkerConfig{}, err
	}
	if batch < 1 {
		batch = 1
	}
	pingEvery, err := durationFromEnv("ASYNQ_PING_INTERVAL", 30*time.Second)
	if err != nil {
		return WorkerConfig{}, err
	}
	outboxEvery, err := durationFromEnv("ASYNQ_OUTBOX_INTERVAL", 15*time.Second)
	if err != nil {
		return WorkerConfig{}, err
	}

	cfg := WorkerConfig{
		DatabaseURL:      strings.TrimSpace(os.Getenv("DATABASE_URL")),
		RedisAddr:        strings.TrimSpace(os.Getenv("REDIS_ADDR")),
		RedisPassword:    os.Getenv("REDIS_PASSWORD"),
		RedisDB:          redisDB,
		AsynqConcurrency: concurrency,
		OutboxBatchSize:  batch,
		PingInterval:     pingEvery,
		OutboxInterval:   outboxEvery,
	}
	if cfg.DatabaseURL == "" {
		return WorkerConfig{}, fmt.Errorf("config: требуется DATABASE_URL")
	}
	if cfg.RedisAddr == "" {
		return WorkerConfig{}, fmt.Errorf("config: требуется REDIS_ADDR")
	}
	return cfg, nil
}

// FormatEveryCron возвращает спецификацию cron для Register("@every ...") из интервала.
func FormatEveryCron(d time.Duration) string {
	if d < time.Second {
		d = time.Second
	}
	return "@every " + d.String()
}
