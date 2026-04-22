package config

import (
	"testing"
	"time"
)

func TestLoadWorker_requiresDatabaseURL(t *testing.T) {
	t.Setenv("REDIS_ADDR", "127.0.0.1:6379")

	_, err := LoadWorker()
	if err == nil {
		t.Fatal("expected error when DATABASE_URL is missing")
	}
}

func TestLoadWorker_requiresRedisAddr(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://april:april@127.0.0.1:5432/april_profile?sslmode=disable")

	_, err := LoadWorker()
	if err == nil {
		t.Fatal("expected error when REDIS_ADDR is missing")
	}
}

func TestLoadWorker_syncDefaults(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://april:april@127.0.0.1:5432/april_profile?sslmode=disable")
	t.Setenv("REDIS_ADDR", "127.0.0.1:6379")

	cfg, err := LoadWorker()
	if err != nil {
		t.Fatalf("load worker: %v", err)
	}
	if cfg.SyncBatchSize != 200 {
		t.Fatalf("want sync batch 200, got %d", cfg.SyncBatchSize)
	}
	if len(cfg.SyncSourceSystems) != 1 || cfg.SyncSourceSystems[0] != "mock-hr" {
		t.Fatalf("unexpected sync sources: %#v", cfg.SyncSourceSystems)
	}
}

func TestFormatEveryCron(t *testing.T) {
	if got := FormatEveryCron(30 * time.Second); got != "@every 30s" {
		t.Fatalf("got %q", got)
	}
}
