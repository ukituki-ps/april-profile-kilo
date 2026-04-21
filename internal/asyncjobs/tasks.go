// Package asyncjobs — задачи Asynq (ping, обработка outbox).
package asyncjobs

import (
	"github.com/hibiken/asynq"
)

// Имена типов задач и очередей — стабильный контракт для мониторинга и compose.
const (
	TaskTypePing          = "april:ping"
	TaskTypeOutboxBatch   = "april:outbox:batch"
	QueueDefault          = "default"
	QueueOutbox           = "outbox"
	RedisKeyLastPing      = "april:asynq:last_ping"
	RedisKeyLastOutboxRun = "april:asynq:last_outbox_batch"
)

// NewPingTask — периодическая проверка работоспособности воркера и Redis.
func NewPingTask() *asynq.Task {
	return asynq.NewTask(TaskTypePing, nil, asynq.Queue(QueueDefault))
}

// NewOutboxBatchTask — батч публикации строк profile_outbox со статусом pending.
func NewOutboxBatchTask() *asynq.Task {
	return asynq.NewTask(TaskTypeOutboxBatch, nil, asynq.Queue(QueueOutbox))
}
