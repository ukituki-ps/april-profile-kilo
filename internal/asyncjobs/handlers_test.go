package asyncjobs

import (
	"testing"

	"github.com/hibiken/asynq"
)

func TestTaskTypes_registeredWithAsynq(t *testing.T) {
	t.Parallel()
	for _, tt := range []struct {
		name string
		task *asynq.Task
		want string
	}{
		{"ping", NewPingTask(), TaskTypePing},
		{"outbox", NewOutboxBatchTask(), TaskTypeOutboxBatch},
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
