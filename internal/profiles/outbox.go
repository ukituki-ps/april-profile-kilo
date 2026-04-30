package profiles

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

// insertProfileOutboxRow добавляет строку outbox в той же транзакции, что и новая версия профиля.
// Идемпотентность: ON CONFLICT (tenant_id, entity_id, profile_version) DO NOTHING — повтор той же
// логической версии не создаёт вторую строку. Статус pending: фоновый воркер Asynq вызывает Publisher
// и переводит строку в published/failed (см. internal/asyncjobs).
func insertProfileOutboxRow(ctx context.Context, tx pgx.Tx, tenantID, entityID string, profileVersion int64, occurredAt time.Time) error {
	entityType, err := loadEntityTypeKey(ctx, tx, tenantID, entityID)
	if err != nil {
		return err
	}
	eventID := ProfileChangeEventID(tenantID, entityID, profileVersion)
	ev := ProfileChangeEventV1{
		TenantID:       tenantID,
		EntityID:       entityID,
		EntityType:     entityType,
		ProfileVersion: profileVersion,
		OccurredAt:     occurredAt.UTC(),
		EventID:        eventID.String(),
	}
	payload, err := MarshalProfileChangeEvent(ev)
	if err != nil {
		return fmt.Errorf("marshal profile event: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO profile_outbox (
			event_id,
			tenant_id,
			entity_id,
			entity_type,
			profile_version,
			occurred_at,
			payload,
			status,
			published_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, 'pending', NULL)
		ON CONFLICT (tenant_id, entity_id, profile_version) DO NOTHING
	`, eventID, tenantID, entityID, entityType, profileVersion, occurredAt.UTC(), payload)
	if err != nil {
		return fmt.Errorf("insert profile outbox: %w", err)
	}
	return nil
}

func loadEntityTypeKey(ctx context.Context, tx pgx.Tx, tenantID, entityID string) (string, error) {
	var ns, code string
	err := tx.QueryRow(ctx, `
		SELECT f.namespace, f.code
		FROM entities e
		JOIN entity_type_families f
			ON f.tenant_id = e.tenant_id AND f.id = e.entity_type_id
		WHERE e.tenant_id = $1 AND e.entity_id = $2
	`, tenantID, entityID).Scan(&ns, &code)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrNotFound
		}
		return "", fmt.Errorf("load entity type: %w", err)
	}
	return ns + "/" + code, nil
}
