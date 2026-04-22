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
	SyncInterval   time.Duration

	SyncBatchSize     int
	SyncSourceSystems []string

	// Asynq: повторы всей задачи при ошибке обработчика (архив Redis после исчерпания).
	AsynqRetryBaseDelay      time.Duration
	AsynqPingMaxRetry        int
	AsynqOutboxMaxRetry      int
	AsynqSyncMaxRetry        int
	AsynqPingTimeout         time.Duration
	AsynqOutboxTimeout       time.Duration
	AsynqSyncTimeout         time.Duration
	OutboxPublishMaxAttempts int
	OutboxPublishBackoffBase time.Duration
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
	syncEvery, err := durationFromEnv("ASYNQ_SYNC_INTERVAL", 20*time.Second)
	if err != nil {
		return WorkerConfig{}, err
	}
	syncBatchSize, err := intFromEnv("SYNC_BATCH_SIZE", 200)
	if err != nil {
		return WorkerConfig{}, err
	}
	if syncBatchSize < 1 {
		syncBatchSize = 1
	}
	retryBase, err := durationFromEnv("ASYNQ_RETRY_BASE_DELAY", 2*time.Second)
	if err != nil {
		return WorkerConfig{}, err
	}
	pingMaxRetry, err := intFromEnv("ASYNQ_PING_MAX_RETRY", 3)
	if err != nil {
		return WorkerConfig{}, err
	}
	outboxMaxRetry, err := intFromEnv("ASYNQ_OUTBOX_BATCH_MAX_RETRY", 5)
	if err != nil {
		return WorkerConfig{}, err
	}
	syncMaxRetry, err := intFromEnv("ASYNQ_SYNC_MAX_RETRY", 5)
	if err != nil {
		return WorkerConfig{}, err
	}
	pingTimeout, err := durationFromEnv("ASYNQ_PING_TIMEOUT", 30*time.Second)
	if err != nil {
		return WorkerConfig{}, err
	}
	outboxTimeout, err := durationFromEnv("ASYNQ_OUTBOX_TIMEOUT", 3*time.Minute)
	if err != nil {
		return WorkerConfig{}, err
	}
	syncTimeout, err := durationFromEnv("ASYNQ_SYNC_TIMEOUT", 3*time.Minute)
	if err != nil {
		return WorkerConfig{}, err
	}
	outboxPubMax, err := intFromEnv("OUTBOX_PUBLISH_MAX_ATTEMPTS", 5)
	if err != nil {
		return WorkerConfig{}, err
	}
	if outboxPubMax < 1 {
		outboxPubMax = 1
	}
	outboxBackoff, err := durationFromEnv("OUTBOX_PUBLISH_BACKOFF_BASE", time.Second)
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
		SyncInterval:     syncEvery,
		SyncBatchSize:    syncBatchSize,
		SyncSourceSystems: csvFromEnv(
			"SYNC_SOURCE_SYSTEMS",
			[]string{"mock-hr"},
		),
		AsynqRetryBaseDelay:      retryBase,
		AsynqPingMaxRetry:        pingMaxRetry,
		AsynqOutboxMaxRetry:      outboxMaxRetry,
		AsynqSyncMaxRetry:        syncMaxRetry,
		AsynqPingTimeout:         pingTimeout,
		AsynqOutboxTimeout:       outboxTimeout,
		AsynqSyncTimeout:         syncTimeout,
		OutboxPublishMaxAttempts: outboxPubMax,
		OutboxPublishBackoffBase: outboxBackoff,
	}
	if cfg.DatabaseURL == "" {
		return WorkerConfig{}, fmt.Errorf("config: требуется DATABASE_URL")
	}
	if cfg.RedisAddr == "" {
		return WorkerConfig{}, fmt.Errorf("config: требуется REDIS_ADDR")
	}
	return cfg, nil
}

func csvFromEnv(name string, fallback []string) []string {
	raw := strings.TrimSpace(os.Getenv(name))
	if raw == "" {
		return fallback
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	if len(out) == 0 {
		return fallback
	}
	return out
}

// FormatEveryCron возвращает спецификацию cron для Register("@every ...") из интервала.
func FormatEveryCron(d time.Duration) string {
	if d < time.Second {
		d = time.Second
	}
	return "@every " + d.String()
}
