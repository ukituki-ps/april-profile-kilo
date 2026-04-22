package asyncjobs

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

// Handlers зависимости обработчиков Asynq.
type Handlers struct {
	DB              *pgxpool.Pool
	RDB             *redis.Client
	Publisher       Publisher
	OutboxBatchSize int
	SourceClient    SourceClient
	SyncBatchSize   int
	LagMetrics      *SyncLagMetrics
}

// Register mounts task handlers on mux.
func (h *Handlers) Register(mux *asynq.ServeMux) {
	mux.HandleFunc(TaskTypePing, h.handlePing)
	mux.HandleFunc(TaskTypeOutboxBatch, h.handleOutboxBatch)
	mux.HandleFunc(TaskTypeSourceSync, h.handleSourceSync)
}

func (h *Handlers) handlePing(ctx context.Context, _ *asynq.Task) error {
	if h.RDB == nil {
		return fmt.Errorf("asyncjobs: redis client is nil")
	}
	val := time.Now().UTC().Format(time.RFC3339Nano)
	if err := h.RDB.Set(ctx, RedisKeyLastPing, val, 0).Err(); err != nil {
		return fmt.Errorf("asyncjobs: ping redis set: %w", err)
	}
	return nil
}

type outboxRow struct {
	ID       string
	TenantID string
	Payload  []byte
}

func (h *Handlers) handleOutboxBatch(ctx context.Context, _ *asynq.Task) error {
	if h.DB == nil {
		return fmt.Errorf("asyncjobs: db pool is nil")
	}
	if h.Publisher == nil {
		return fmt.Errorf("asyncjobs: publisher is nil")
	}
	if h.RDB != nil {
		_ = h.RDB.Set(ctx, RedisKeyLastOutboxRun, time.Now().UTC().Format(time.RFC3339Nano), 0).Err()
	}

	tx, err := h.DB.Begin(ctx)
	if err != nil {
		return fmt.Errorf("asyncjobs: begin: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	rows, err := tx.Query(ctx, `
		SELECT id::text, tenant_id::text, payload
		FROM profile_outbox
		WHERE status = 'pending'
		ORDER BY created_at ASC
		LIMIT $1
		FOR UPDATE SKIP LOCKED
	`, h.outboxLimit())
	if err != nil {
		return fmt.Errorf("asyncjobs: select pending outbox: %w", err)
	}
	defer rows.Close()

	var list []outboxRow
	for rows.Next() {
		var r outboxRow
		if err := rows.Scan(&r.ID, &r.TenantID, &r.Payload); err != nil {
			return fmt.Errorf("asyncjobs: scan outbox: %w", err)
		}
		list = append(list, r)
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("asyncjobs: rows: %w", err)
	}

	for _, row := range list {
		if !json.Valid(row.Payload) {
			_, err := tx.Exec(ctx, `
				UPDATE profile_outbox SET status = 'failed' WHERE id = $1::uuid AND status = 'pending'
			`, row.ID)
			if err != nil {
				return fmt.Errorf("asyncjobs: mark failed invalid json: %w", err)
			}
			continue
		}
		pubCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		err := h.Publisher.PublishProfileChange(pubCtx, row.TenantID, row.Payload)
		cancel()
		if err != nil {
			_, err2 := tx.Exec(ctx, `
				UPDATE profile_outbox SET status = 'failed' WHERE id = $1::uuid AND status = 'pending'
			`, row.ID)
			if err2 != nil {
				return fmt.Errorf("asyncjobs: mark failed after publish: %w", err2)
			}
			continue
		}
		_, err = tx.Exec(ctx, `
			UPDATE profile_outbox
			SET status = 'published', published_at = now()
			WHERE id = $1::uuid AND status = 'pending'
		`, row.ID)
		if err != nil {
			return fmt.Errorf("asyncjobs: mark published: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("asyncjobs: commit: %w", err)
	}
	return nil
}

func (h *Handlers) outboxLimit() int {
	if h.OutboxBatchSize < 1 {
		return 32
	}
	return h.OutboxBatchSize
}

func (h *Handlers) syncLimit() int {
	if h.SyncBatchSize < 1 {
		return 200
	}
	return h.SyncBatchSize
}

func (h *Handlers) upsertCheckpoint(
	ctx context.Context,
	tx pgx.Tx,
	tenantID, sourceSystem, cursor string,
	watermark time.Time,
) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO source_sync_checkpoints (
			tenant_id, source_system, last_cursor, last_seen_source_updated_at, updated_at
		) VALUES (
			$1::uuid, $2, $3, $4, now()
		)
		ON CONFLICT (tenant_id, source_system) DO UPDATE
		SET last_cursor = EXCLUDED.last_cursor,
			last_seen_source_updated_at = CASE
				WHEN source_sync_checkpoints.last_seen_source_updated_at IS NULL THEN EXCLUDED.last_seen_source_updated_at
				WHEN EXCLUDED.last_seen_source_updated_at IS NULL THEN source_sync_checkpoints.last_seen_source_updated_at
				ELSE GREATEST(source_sync_checkpoints.last_seen_source_updated_at, EXCLUDED.last_seen_source_updated_at)
			END,
			updated_at = now()
	`, tenantID, sourceSystem, cursor, nullableTime(watermark))
	if err != nil {
		return fmt.Errorf("asyncjobs: upsert checkpoint: %w", err)
	}
	return nil
}

func nullableTime(v time.Time) any {
	if v.IsZero() {
		return nil
	}
	return v.UTC()
}

func logSyncWarning(msg string, args ...any) {
	slog.Warn(msg, args...)
}
