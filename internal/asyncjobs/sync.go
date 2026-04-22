package asyncjobs

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5"
	"github.com/prometheus/client_golang/prometheus"
)

// SourceRecord описывает единицу изменения из внешнего источника.
type SourceRecord struct {
	EventID         string
	ExternalID      string
	SourceUpdatedAt time.Time
	Payload         json.RawMessage
}

// SourceBatch — результат чтения батча из внешнего источника.
type SourceBatch struct {
	Records       []SourceRecord
	NextCursor    string
	HighWatermark time.Time
}

// SourceFetchRequest — запрос к адаптеру внешнего источника.
type SourceFetchRequest struct {
	TenantID     string
	SourceSystem string
	Cursor       string
	Limit        int
	Now          time.Time
}

// SourceClient читает изменения из внешнего источника.
type SourceClient interface {
	FetchChanges(ctx context.Context, req SourceFetchRequest) (SourceBatch, error)
}

// NoopSourceClient — заглушка: источник доступен, но изменений нет.
type NoopSourceClient struct{}

func (NoopSourceClient) FetchChanges(_ context.Context, req SourceFetchRequest) (SourceBatch, error) {
	return SourceBatch{
		Records:       nil,
		NextCursor:    req.Cursor,
		HighWatermark: req.Now.UTC(),
	}, nil
}

// SyncLagMetrics хранит lag метрики синка по source_system/tenant.
type SyncLagMetrics struct {
	sourceLagSeconds *prometheus.GaugeVec
}

// NewSyncLagMetrics регистрирует метрики в переданном registry.
func NewSyncLagMetrics(registry prometheus.Registerer) (*SyncLagMetrics, error) {
	if registry == nil {
		registry = prometheus.DefaultRegisterer
	}
	metric := prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Namespace: "april_profile",
		Subsystem: "source_sync",
		Name:      "lag_seconds",
		Help:      "Lag between now and source watermark by tenant/source_system.",
	}, []string{"tenant_id", "source_system"})
	if err := registry.Register(metric); err != nil {
		if are, ok := err.(prometheus.AlreadyRegisteredError); ok {
			existing, ok := are.ExistingCollector.(*prometheus.GaugeVec)
			if !ok {
				return nil, fmt.Errorf("register lag metric: %w", err)
			}
			return &SyncLagMetrics{sourceLagSeconds: existing}, nil
		}
		return nil, fmt.Errorf("register lag metric: %w", err)
	}
	return &SyncLagMetrics{sourceLagSeconds: metric}, nil
}

// ObserveLagSeconds обновляет lag для пары tenant/source.
func (m *SyncLagMetrics) ObserveLagSeconds(tenantID, sourceSystem string, value float64) {
	if m == nil || m.sourceLagSeconds == nil {
		return
	}
	m.sourceLagSeconds.WithLabelValues(tenantID, sourceSystem).Set(value)
}

// Collector возвращает underlying collector для тестовой инспекции registry.
func (m *SyncLagMetrics) Collector() prometheus.Collector {
	if m == nil {
		return nil
	}
	return m.sourceLagSeconds
}

// CalculateLagSeconds возвращает lag в секундах (неотрицательный).
func CalculateLagSeconds(now, watermark time.Time) float64 {
	if watermark.IsZero() {
		return 0
	}
	lag := now.Sub(watermark)
	if lag < 0 {
		return 0
	}
	return lag.Seconds()
}

func (h *Handlers) handleSourceSync(ctx context.Context, task *asynq.Task) error {
	if h.DB == nil {
		return fmt.Errorf("asyncjobs: db pool is nil")
	}
	if h.SourceClient == nil {
		return fmt.Errorf("asyncjobs: source client is nil")
	}
	var payload SourceSyncPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("asyncjobs: decode source sync payload: %w", err)
	}
	payload.SourceSystem = strings.TrimSpace(payload.SourceSystem)
	if payload.SourceSystem == "" {
		return fmt.Errorf("asyncjobs: source_system is required")
	}
	if h.RDB != nil {
		_ = h.RDB.Set(ctx, RedisKeyLastSyncRun, time.Now().UTC().Format(time.RFC3339Nano), 0).Err()
	}

	rows, err := h.DB.Query(ctx, `SELECT id::text FROM tenants ORDER BY id`)
	if err != nil {
		return fmt.Errorf("asyncjobs: list tenants for sync: %w", err)
	}
	defer rows.Close()

	var tenants []string
	for rows.Next() {
		var tenantID string
		if err := rows.Scan(&tenantID); err != nil {
			return fmt.Errorf("asyncjobs: scan tenant: %w", err)
		}
		tenants = append(tenants, tenantID)
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("asyncjobs: iterate tenants: %w", err)
	}

	for _, tenantID := range tenants {
		if err := h.syncTenantSource(ctx, tenantID, payload.SourceSystem); err != nil {
			return err
		}
	}
	return nil
}

func (h *Handlers) syncTenantSource(ctx context.Context, tenantID, sourceSystem string) error {
	tx, err := h.DB.Begin(ctx)
	if err != nil {
		return fmt.Errorf("asyncjobs: begin source sync tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var cursor string
	var lastWatermark *time.Time
	err = tx.QueryRow(ctx, `
		SELECT last_cursor, last_seen_source_updated_at
		FROM source_sync_checkpoints
		WHERE tenant_id = $1::uuid AND source_system = $2
		FOR UPDATE
	`, tenantID, sourceSystem).Scan(&cursor, &lastWatermark)
	if err != nil && err != pgx.ErrNoRows {
		return fmt.Errorf("asyncjobs: load checkpoint: %w", err)
	}
	if err == pgx.ErrNoRows {
		cursor = ""
		lastWatermark = nil
	}

	now := time.Now().UTC()
	batch, err := h.SourceClient.FetchChanges(ctx, SourceFetchRequest{
		TenantID:     tenantID,
		SourceSystem: sourceSystem,
		Cursor:       cursor,
		Limit:        h.syncLimit(),
		Now:          now,
	})
	if err != nil {
		return fmt.Errorf("asyncjobs: fetch source changes: %w", err)
	}

	for _, item := range batch.Records {
		if strings.TrimSpace(item.EventID) == "" || strings.TrimSpace(item.ExternalID) == "" {
			logSyncWarning("asyncjobs: skip sync record with empty keys", "tenant_id", tenantID, "source_system", sourceSystem)
			continue
		}
		if item.Payload == nil {
			item.Payload = json.RawMessage(`{}`)
		}
		if !json.Valid(item.Payload) {
			logSyncWarning("asyncjobs: skip sync record with invalid payload", "tenant_id", tenantID, "source_system", sourceSystem, "event_id", item.EventID)
			continue
		}
		if item.SourceUpdatedAt.IsZero() {
			item.SourceUpdatedAt = now
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO source_sync_applied_events (
				tenant_id, source_system, event_id, external_id, source_updated_at, payload
			) VALUES (
				$1::uuid, $2, $3, $4, $5, $6
			)
			ON CONFLICT (tenant_id, source_system, event_id) DO NOTHING
		`, tenantID, sourceSystem, item.EventID, item.ExternalID, item.SourceUpdatedAt.UTC(), item.Payload); err != nil {
			return fmt.Errorf("asyncjobs: insert applied sync event: %w", err)
		}
	}

	watermark := batch.HighWatermark.UTC()
	if lastWatermark != nil && lastWatermark.After(watermark) {
		watermark = lastWatermark.UTC()
	}
	nextCursor := cursor
	if strings.TrimSpace(batch.NextCursor) != "" {
		nextCursor = strings.TrimSpace(batch.NextCursor)
	}
	if err := h.upsertCheckpoint(ctx, tx, tenantID, sourceSystem, nextCursor, watermark); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("asyncjobs: commit source sync: %w", err)
	}
	h.LagMetrics.ObserveLagSeconds(tenantID, sourceSystem, CalculateLagSeconds(now, watermark))
	return nil
}
