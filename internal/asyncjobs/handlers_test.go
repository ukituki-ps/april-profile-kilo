package asyncjobs

import (
	"testing"
	"time"

	"github.com/hibiken/asynq"
)

func TestTaskTypes_registeredWithAsynq(t *testing.T) {
	t.Parallel()
	syncTask, err := NewSourceSyncTask("mock-hr")
	if err != nil {
		t.Fatalf("new source sync task: %v", err)
	}
	for _, tt := range []struct {
		name string
		task *asynq.Task
		want string
	}{
		{"ping", NewPingTask(), TaskTypePing},
		{"outbox", NewOutboxBatchTask(), TaskTypeOutboxBatch},
		{"source-sync", syncTask, TaskTypeSourceSync},
	} {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			if tt.task.Type() != tt.want {
				t.Fatalf("task type: got %q want %q", tt.task.Type(), tt.want)
			}
		})
	}
}

func TestCalculateLagSeconds(t *testing.T) {
	t.Parallel()
	now := time.Date(2026, 4, 22, 12, 0, 0, 0, time.UTC)
	if got := CalculateLagSeconds(now, now.Add(-45*time.Second)); got != 45 {
		t.Fatalf("want 45, got %v", got)
	}
	if got := CalculateLagSeconds(now, now.Add(2*time.Second)); got != 0 {
		t.Fatalf("future watermark must clamp to 0, got %v", got)
	}
}

func TestHandlers_Register_doesNotPanic(t *testing.T) {
	t.Parallel()
	h := &Handlers{OutboxBatchSize: 10}
	mux := asynq.NewServeMux()
	h.Register(mux)
}

func TestHandlers_outboxLimit_default(t *testing.T) {
	t.Parallel()
	h := &Handlers{}
	if got := h.outboxLimit(); got != 32 {
		t.Fatalf("want 32, got %d", got)
	}
}

func TestHandlers_outboxLimit_explicit(t *testing.T) {
	t.Parallel()
	h := &Handlers{OutboxBatchSize: 7}
	if got := h.outboxLimit(); got != 7 {
		t.Fatalf("want 7, got %d", got)
	}
}
