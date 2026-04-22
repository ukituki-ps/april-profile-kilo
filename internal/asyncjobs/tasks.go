// Package asyncjobs — задачи Asynq (ping, обработка outbox).
package asyncjobs

import (
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
)

// Имена типов задач и очередей — стабильный контракт для мониторинга и compose.
const (
	TaskTypePing          = "april:ping"
	TaskTypeOutboxBatch   = "april:outbox:batch"
	TaskTypeSourceSync    = "april:source_sync:batch"
	QueueDefault          = "default"
	QueueOutbox           = "outbox"
	QueueSync             = "sync"
	RedisKeyLastPing      = "april:asynq:last_ping"
	RedisKeyLastOutboxRun = "april:asynq:last_outbox_batch"
	RedisKeyLastSyncRun   = "april:asynq:last_source_sync"
)

// NewPingTask — периодическая проверка работоспособности воркера и Redis.
func NewPingTask() *asynq.Task {
	return asynq.NewTask(TaskTypePing, nil, asynq.Queue(QueueDefault))
}

// NewOutboxBatchTask — батч публикации строк profile_outbox со статусом pending.
func NewOutboxBatchTask() *asynq.Task {
	return asynq.NewTask(TaskTypeOutboxBatch, nil, asynq.Queue(QueueOutbox))
}

// SourceSyncPayload — минимальный payload джобы синка.
type SourceSyncPayload struct {
	SourceSystem string `json:"source_system"`
}

// NewSourceSyncTask — батч синхронизации по одному source_system.
func NewSourceSyncTask(sourceSystem string) (*asynq.Task, error) {
	payload := SourceSyncPayload{SourceSystem: sourceSystem}
	raw, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal source sync payload: %w", err)
	}
	return asynq.NewTask(TaskTypeSourceSync, raw, asynq.Queue(QueueSync)), nil
}
