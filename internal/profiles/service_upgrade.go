package profiles

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ErrInvalidBindingUpgrade — целевая ревизия не относится к семейству сущности или не опубликована.
var ErrInvalidBindingUpgrade = errors.New("invalid entity type revision for upgrade")

// UpgradeBindingParams — явный апгрейд привязки сущности к опубликованной ревизии схемы.
// Ровно одно из RevisionID / RevisionNo должно быть задано, либо оба пусты — тогда берётся последняя опубликованная ревизия семейства сущности.
type UpgradeBindingParams struct {
	RevisionID *string
	RevisionNo *int
}

// BatchUpgradeBindingParams — массовый апгрейд к одной целевой ревизии.
type BatchUpgradeBindingParams struct {
	EntityTypeFamilyID string
	TargetRevisionID   *string
	TargetRevisionNo   *int
	EntityIDs          []string
	OnlyBehindLatest   bool
	Limit              int
	IdempotencyKey     string
}

// BatchUpgradeBindingResult — сводка по batch (частичный успех допускается).
type BatchUpgradeBindingResult struct {
	Processed      int                        `json:"processed"`
	Succeeded      int                        `json:"succeeded"`
	Failed         int                        `json:"failed"`
	Results        []BatchUpgradeEntityResult `json:"results"`
	IdempotencyKey string                     `json:"idempotency_key,omitempty"`
}

// BatchUpgradeEntityResult — результат для одной сущности.
type BatchUpgradeEntityResult struct {
	EntityID string `json:"entity_id"`
	OK       bool   `json:"ok"`
	Code     string `json:"code,omitempty"`
	Message  string `json:"message,omitempty"`
	Version  int64  `json:"profile_version,omitempty"`
}

// UpgradeEntityBinding выполняет апгрейд привязки: валидация документа, при смене ревизии — новая версия профиля и outbox.
func (s *Service) UpgradeEntityBinding(ctx context.Context, tenantID, entityID string, params UpgradeBindingParams) (Snapshot, error) {
	entityID, err := validateUUID(entityID)
	if err != nil {
		return Snapshot{}, fmt.Errorf("invalid entity_id: %w", err)
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Snapshot{}, fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if err := lockEntity(ctx, tx, tenantID, entityID); err != nil {
		return Snapshot{}, err
	}

	var familyID, currentRevID string
	if err := tx.QueryRow(ctx, `
		SELECT e.entity_type_id::text, e.bound_entity_type_revision_id::text
		FROM entities e
		WHERE e.tenant_id = $1 AND e.entity_id = $2::uuid
	`, tenantID, entityID).Scan(&familyID, &currentRevID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Snapshot{}, ErrNotFound
		}
		return Snapshot{}, fmt.Errorf("load entity: %w", err)
	}

	targetRev, err := resolveTargetRevision(ctx, tx, tenantID, familyID, params.RevisionID, params.RevisionNo)
	if err != nil {
		return Snapshot{}, err
	}
	if targetRev.ID == currentRevID {
		if err := tx.Commit(ctx); err != nil {
			return Snapshot{}, fmt.Errorf("commit: %w", err)
		}
		return s.GetCurrent(ctx, tenantID, entityID)
	}

	var schemaRaw []byte
	if err := tx.QueryRow(ctx, `
		SELECT schema_json FROM entity_type_revisions
		WHERE tenant_id = $1 AND id = $2::uuid
	`, tenantID, targetRev.ID).Scan(&schemaRaw); err != nil {
		return Snapshot{}, fmt.Errorf("load target schema: %w", err)
	}
	var schemaMap map[string]any
	if err := json.Unmarshal(schemaRaw, &schemaMap); err != nil {
		return Snapshot{}, fmt.Errorf("decode target schema: %w", err)
	}

	var currentDoc []byte
	if err := tx.QueryRow(ctx, `
		SELECT document
		FROM profile_versions
		WHERE tenant_id = $1 AND entity_id = $2::uuid
		ORDER BY version DESC
		LIMIT 1
	`, tenantID, entityID).Scan(&currentDoc); err != nil {
		return Snapshot{}, fmt.Errorf("load current document: %w", err)
	}
	var docMap map[string]any
	if err := json.Unmarshal(currentDoc, &docMap); err != nil {
		return Snapshot{}, fmt.Errorf("decode document: %w", err)
	}

	normDoc, err := normalizeDocument(docMap)
	if err != nil {
		return Snapshot{}, err
	}
	if err := ValidateDocumentAgainstSchema(schemaMap, normDoc); err != nil {
		return Snapshot{}, err
	}

	var nextVersion int64
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(MAX(version), 0) + 1
		FROM profile_versions
		WHERE tenant_id = $1 AND entity_id = $2::uuid
	`, tenantID, entityID).Scan(&nextVersion); err != nil {
		return Snapshot{}, fmt.Errorf("next version: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		UPDATE entities
		SET bound_entity_type_revision_id = $3::uuid
		WHERE tenant_id = $1 AND entity_id = $2::uuid
	`, tenantID, entityID, targetRev.ID); err != nil {
		return Snapshot{}, fmt.Errorf("update bound revision: %w", err)
	}

	occurredAt := time.Now().UTC()
	if err := insertVersion(ctx, tx, tenantID, entityID, nextVersion, normDoc); err != nil {
		return Snapshot{}, err
	}
	if err := insertProfileOutboxRow(ctx, tx, tenantID, entityID, nextVersion, occurredAt); err != nil {
		return Snapshot{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Snapshot{}, fmt.Errorf("commit upgrade: %w", err)
	}
	return s.GetCurrent(ctx, tenantID, entityID)
}

type revisionRow struct {
	ID         string
	RevisionNo int
}

func resolveTargetRevision(ctx context.Context, tx pgx.Tx, tenantID, familyID string, revisionID *string, revisionNo *int) (revisionRow, error) {
	hasID := revisionID != nil && strings.TrimSpace(*revisionID) != ""
	hasNo := revisionNo != nil
	if hasID && hasNo {
		return revisionRow{}, fmt.Errorf("specify only one of revision_id or revision_no")
	}
	if hasID {
		if _, err := uuid.Parse(*revisionID); err != nil {
			return revisionRow{}, fmt.Errorf("invalid revision_id: %w", err)
		}
		var out revisionRow
		err := tx.QueryRow(ctx, `
			SELECT r.id::text, r.revision_no
			FROM entity_type_revisions r
			WHERE r.tenant_id = $1 AND r.family_id = $2::uuid AND r.id = $3::uuid
		`, tenantID, familyID, *revisionID).Scan(&out.ID, &out.RevisionNo)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return revisionRow{}, ErrInvalidBindingUpgrade
			}
			return revisionRow{}, fmt.Errorf("load revision by id: %w", err)
		}
		return out, nil
	}
	if hasNo {
		if *revisionNo <= 0 {
			return revisionRow{}, fmt.Errorf("revision_no must be positive")
		}
		var out revisionRow
		err := tx.QueryRow(ctx, `
			SELECT r.id::text, r.revision_no
			FROM entity_type_revisions r
			WHERE r.tenant_id = $1 AND r.family_id = $2::uuid AND r.revision_no = $3
		`, tenantID, familyID, *revisionNo).Scan(&out.ID, &out.RevisionNo)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return revisionRow{}, ErrInvalidBindingUpgrade
			}
			return revisionRow{}, fmt.Errorf("load revision by no: %w", err)
		}
		return out, nil
	}
	// latest published for family
	var out revisionRow
	err := tx.QueryRow(ctx, `
		SELECT r.id::text, r.revision_no
		FROM entity_type_revisions r
		WHERE r.tenant_id = $1 AND r.family_id = $2::uuid
		ORDER BY r.revision_no DESC, r.published_at DESC
		LIMIT 1
	`, tenantID, familyID).Scan(&out.ID, &out.RevisionNo)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return revisionRow{}, ErrInvalidBindingUpgrade
		}
		return revisionRow{}, fmt.Errorf("load latest revision: %w", err)
	}
	return out, nil
}

// BatchUpgradeEntityBinding применяет один целевой контракт ревизии к набору сущностей (отдельные транзакции на сущность).
func (s *Service) BatchUpgradeEntityBinding(ctx context.Context, tenantID string, params BatchUpgradeBindingParams) (BatchUpgradeBindingResult, error) {
	familyID, err := validateUUID(params.EntityTypeFamilyID)
	if err != nil {
		return BatchUpgradeBindingResult{}, fmt.Errorf("invalid entity_type_id: %w", err)
	}
	limit := params.Limit
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return BatchUpgradeBindingResult{}, fmt.Errorf("begin tx: %w", err)
	}
	targetRev, err := resolveTargetRevision(ctx, tx, tenantID, familyID, params.TargetRevisionID, params.TargetRevisionNo)
	if err != nil {
		_ = tx.Rollback(ctx)
		return BatchUpgradeBindingResult{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return BatchUpgradeBindingResult{}, fmt.Errorf("commit resolve target: %w", err)
	}

	var entityIDs []string
	if len(params.EntityIDs) > 0 {
		for _, id := range params.EntityIDs {
			id, err := validateUUID(id)
			if err != nil {
				return BatchUpgradeBindingResult{}, fmt.Errorf("invalid entity_id in list: %w", err)
			}
			entityIDs = append(entityIDs, id)
		}
		if len(entityIDs) > limit {
			entityIDs = entityIDs[:limit]
		}
	} else if params.OnlyBehindLatest {
		rows, err := s.pool.Query(ctx, `
			SELECT e.entity_id::text
			FROM entities e
			JOIN entity_type_revisions cur
				ON cur.tenant_id = e.tenant_id AND cur.id = e.bound_entity_type_revision_id
			WHERE e.tenant_id = $1
				AND e.entity_type_id = $2::uuid
				AND cur.revision_no < $3
			ORDER BY e.entity_id
			LIMIT $4
		`, tenantID, familyID, targetRev.RevisionNo, limit)
		if err != nil {
			return BatchUpgradeBindingResult{}, fmt.Errorf("list entities behind latest: %w", err)
		}
		defer rows.Close()
		for rows.Next() {
			var id string
			if err := rows.Scan(&id); err != nil {
				return BatchUpgradeBindingResult{}, err
			}
			entityIDs = append(entityIDs, id)
		}
		if err := rows.Err(); err != nil {
			return BatchUpgradeBindingResult{}, err
		}
	} else {
		return BatchUpgradeBindingResult{}, fmt.Errorf("either entity_ids or only_behind_latest is required")
	}

	out := BatchUpgradeBindingResult{
		Processed:      len(entityIDs),
		Results:        make([]BatchUpgradeEntityResult, 0, len(entityIDs)),
		IdempotencyKey: params.IdempotencyKey,
	}
	targetID := targetRev.ID
	for _, eid := range entityIDs {
		snap, err := s.UpgradeEntityBinding(ctx, tenantID, eid, UpgradeBindingParams{RevisionID: &targetID})
		res := BatchUpgradeEntityResult{EntityID: eid}
		if err != nil {
			res.OK = false
			res.Code = classifyUpgradeErr(err)
			res.Message = err.Error()
			out.Failed++
		} else {
			res.OK = true
			res.Version = snap.Version
			out.Succeeded++
		}
		out.Results = append(out.Results, res)
	}
	return out, nil
}

func classifyUpgradeErr(err error) string {
	switch {
	case errors.Is(err, ErrNotFound):
		return "entity_not_found"
	case errors.Is(err, ErrInvalidBindingUpgrade):
		return "invalid_binding_target"
	default:
		var sve *SchemaValidationError
		if errors.As(err, &sve) {
			return "schema_validation_failed"
		}
		return "error"
	}
}
