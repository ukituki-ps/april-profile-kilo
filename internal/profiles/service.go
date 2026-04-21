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
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound                = errors.New("entity not found")
	ErrEntityTypeNotFound      = errors.New("entity type not found")
	ErrEntityTypeNotPublished  = errors.New("entity type not published")
	ErrVersionNotFound         = errors.New("profile version not found")
	ErrExternalMappingConflict = errors.New("external mapping conflict")
	ErrAuthorityAllBlocked     = errors.New("authority: all proposed field updates blocked by conflicts")
	ErrConflictNotFound        = errors.New("conflict not found")
	ErrMergeInvalid            = errors.New("merge: invalid entity pair")
	ErrMergeExternalCollision  = errors.New("merge: external mapping collision between profiles")
)

type ExternalRef struct {
	SourceSystem string `json:"source_system"`
	ExternalID   string `json:"external_id"`
}

type Snapshot struct {
	EntityID     string         `json:"entity_id"`
	EntityTypeID string         `json:"entity_type_id"`
	Version      int64          `json:"version"`
	Document     map[string]any `json:"document"`
	CreatedAt    time.Time      `json:"created_at"`
	ExternalRefs []ExternalRef  `json:"external_refs"`
}

type CreateParams struct {
	EntityTypeID string
	Document     map[string]any
	ExternalRefs []ExternalRef
	// WriteSource — логический источник данных для authority (по умолчанию api).
	WriteSource string
}

type UpdateParams struct {
	Document     map[string]any
	ExternalRefs []ExternalRef
	// WriteSource — источник входящего изменения (по умолчанию api).
	WriteSource string
}

type Service struct {
	pool *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

func (s *Service) Create(ctx context.Context, tenantID string, params CreateParams) (Snapshot, error) {
	entityTypeID, err := validateUUID(params.EntityTypeID)
	if err != nil {
		return Snapshot{}, fmt.Errorf("invalid entity_type_id: %w", err)
	}
	document, err := normalizeDocument(params.Document)
	if err != nil {
		return Snapshot{}, err
	}
	if err := validateExternalRefs(params.ExternalRefs); err != nil {
		return Snapshot{}, err
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Snapshot{}, fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if err := ensureTenant(ctx, tx, tenantID); err != nil {
		return Snapshot{}, err
	}
	if err := ensureEntityTypePublished(ctx, tx, tenantID, entityTypeID); err != nil {
		return Snapshot{}, err
	}

	var entityID string
	if err := tx.QueryRow(ctx, `
		INSERT INTO entities (tenant_id, entity_type_id)
		VALUES ($1, $2)
		RETURNING entity_id
	`, tenantID, entityTypeID).Scan(&entityID); err != nil {
		return Snapshot{}, fmt.Errorf("create entity: %w", err)
	}

	docWithAuth := initialDocumentWithAuthority(document, params.WriteSource)
	if err := insertVersion(ctx, tx, tenantID, entityID, 1, docWithAuth); err != nil {
		return Snapshot{}, err
	}
	if err := syncExternalRefs(ctx, tx, tenantID, entityID, params.ExternalRefs, true); err != nil {
		return Snapshot{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Snapshot{}, fmt.Errorf("commit create: %w", err)
	}
	return s.GetCurrent(ctx, tenantID, entityID)
}

func (s *Service) Update(ctx context.Context, tenantID, entityID string, params UpdateParams) (Snapshot, error) {
	entityID, err := validateUUID(entityID)
	if err != nil {
		return Snapshot{}, fmt.Errorf("invalid entity_id: %w", err)
	}
	document, err := normalizeDocument(params.Document)
	if err != nil {
		return Snapshot{}, err
	}
	if err := validateExternalRefs(params.ExternalRefs); err != nil {
		return Snapshot{}, err
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Snapshot{}, fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if err := lockEntity(ctx, tx, tenantID, entityID); err != nil {
		return Snapshot{}, err
	}
	var currentDoc []byte
	if err := tx.QueryRow(ctx, `
		SELECT document
		FROM profile_versions
		WHERE tenant_id = $1 AND entity_id = $2
		ORDER BY version DESC
		LIMIT 1
	`, tenantID, entityID).Scan(&currentDoc); err != nil {
		return Snapshot{}, fmt.Errorf("load current document: %w", err)
	}
	var currentMap map[string]any
	if err := json.Unmarshal(currentDoc, &currentMap); err != nil {
		return Snapshot{}, fmt.Errorf("decode current document: %w", err)
	}

	mergedDoc, candidates, docChanged := applyAuthorityToDocuments(currentMap, document, params.WriteSource)
	refsChanged, err := externalRefsChanged(ctx, tx, tenantID, entityID, params.ExternalRefs)
	if err != nil {
		return Snapshot{}, err
	}

	if len(candidates) > 0 {
		if err := insertConflictCandidates(ctx, tx, tenantID, entityID, candidates); err != nil {
			return Snapshot{}, err
		}
	}
	if !docChanged && !refsChanged {
		if err := tx.Commit(ctx); err != nil {
			return Snapshot{}, fmt.Errorf("commit update: %w", err)
		}
		if len(candidates) > 0 {
			return Snapshot{}, ErrAuthorityAllBlocked
		}
		return s.GetCurrent(ctx, tenantID, entityID)
	}

	var nextVersion int64
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(MAX(version), 0) + 1
		FROM profile_versions
		WHERE tenant_id = $1 AND entity_id = $2
	`, tenantID, entityID).Scan(&nextVersion); err != nil {
		return Snapshot{}, fmt.Errorf("calculate next version: %w", err)
	}
	outDoc := mergedDoc
	if !docChanged && refsChanged {
		outDoc = currentMap
	}
	if err := insertVersion(ctx, tx, tenantID, entityID, nextVersion, outDoc); err != nil {
		return Snapshot{}, err
	}
	if err := syncExternalRefs(ctx, tx, tenantID, entityID, params.ExternalRefs, true); err != nil {
		return Snapshot{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Snapshot{}, fmt.Errorf("commit update: %w", err)
	}
	return s.GetCurrent(ctx, tenantID, entityID)
}

func (s *Service) GetCurrent(ctx context.Context, tenantID, entityID string) (Snapshot, error) {
	entityID, err := validateUUID(entityID)
	if err != nil {
		return Snapshot{}, fmt.Errorf("invalid entity_id: %w", err)
	}
	return s.getByQuery(ctx, `
		SELECT
			e.entity_id,
			e.entity_type_id,
			pv.version,
			pv.document,
			pv.created_at
		FROM entities e
		JOIN LATERAL (
			SELECT version, document, created_at
			FROM profile_versions
			WHERE tenant_id = e.tenant_id AND entity_id = e.entity_id
			ORDER BY version DESC
			LIMIT 1
		) pv ON true
		WHERE e.tenant_id = $1 AND e.entity_id = $2
	`, tenantID, entityID)
}

func (s *Service) GetByVersion(ctx context.Context, tenantID, entityID string, version int64) (Snapshot, error) {
	entityID, err := validateUUID(entityID)
	if err != nil {
		return Snapshot{}, fmt.Errorf("invalid entity_id: %w", err)
	}
	if version <= 0 {
		return Snapshot{}, fmt.Errorf("version must be positive")
	}
	out, err := s.getByQuery(ctx, `
		SELECT
			e.entity_id,
			e.entity_type_id,
			pv.version,
			pv.document,
			pv.created_at
		FROM entities e
		JOIN profile_versions pv
			ON pv.tenant_id = e.tenant_id
			AND pv.entity_id = e.entity_id
		WHERE e.tenant_id = $1 AND e.entity_id = $2 AND pv.version = $3
	`, tenantID, entityID, version)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return Snapshot{}, ErrVersionNotFound
		}
		return Snapshot{}, err
	}
	return out, nil
}

func (s *Service) GetCurrentByExternalRef(ctx context.Context, tenantID string, ref ExternalRef) (Snapshot, error) {
	ref.SourceSystem = strings.TrimSpace(ref.SourceSystem)
	ref.ExternalID = strings.TrimSpace(ref.ExternalID)
	if ref.SourceSystem == "" || ref.ExternalID == "" {
		return Snapshot{}, fmt.Errorf("source_system and external_id are required")
	}
	return s.getByQuery(ctx, `
		SELECT
			e.entity_id,
			e.entity_type_id,
			pv.version,
			pv.document,
			pv.created_at
		FROM external_id_mappings m
		JOIN entities e
			ON e.tenant_id = m.tenant_id
			AND e.entity_id = m.entity_id
		JOIN LATERAL (
			SELECT version, document, created_at
			FROM profile_versions
			WHERE tenant_id = e.tenant_id AND entity_id = e.entity_id
			ORDER BY version DESC
			LIMIT 1
		) pv ON true
		WHERE m.tenant_id = $1
			AND m.source_system = $2
			AND m.external_id = $3
	`, tenantID, ref.SourceSystem, ref.ExternalID)
}

func (s *Service) Delete(ctx context.Context, tenantID, entityID string) error {
	entityID, err := validateUUID(entityID)
	if err != nil {
		return fmt.Errorf("invalid entity_id: %w", err)
	}
	cmd, err := s.pool.Exec(ctx, `
		DELETE FROM entities
		WHERE tenant_id = $1 AND entity_id = $2
	`, tenantID, entityID)
	if err != nil {
		return fmt.Errorf("delete entity: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Service) getByQuery(ctx context.Context, sql string, args ...any) (Snapshot, error) {
	var out Snapshot
	var rawDocument []byte
	if err := s.pool.QueryRow(ctx, sql, args...).Scan(
		&out.EntityID,
		&out.EntityTypeID,
		&out.Version,
		&rawDocument,
		&out.CreatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Snapshot{}, ErrNotFound
		}
		return Snapshot{}, fmt.Errorf("query snapshot: %w", err)
	}
	if err := json.Unmarshal(rawDocument, &out.Document); err != nil {
		return Snapshot{}, fmt.Errorf("decode document: %w", err)
	}
	refs, err := s.loadExternalRefs(ctx, args[0].(string), out.EntityID)
	if err != nil {
		return Snapshot{}, err
	}
	out.ExternalRefs = refs
	return out, nil
}

func (s *Service) loadExternalRefs(ctx context.Context, tenantID, entityID string) ([]ExternalRef, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT source_system, external_id
		FROM external_id_mappings
		WHERE tenant_id = $1 AND entity_id = $2
		ORDER BY source_system, external_id
	`, tenantID, entityID)
	if err != nil {
		return nil, fmt.Errorf("list external refs: %w", err)
	}
	defer rows.Close()

	out := make([]ExternalRef, 0)
	for rows.Next() {
		var ref ExternalRef
		if err := rows.Scan(&ref.SourceSystem, &ref.ExternalID); err != nil {
			return nil, fmt.Errorf("scan external ref: %w", err)
		}
		out = append(out, ref)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate external refs: %w", err)
	}
	return out, nil
}

func ensureTenant(ctx context.Context, tx pgx.Tx, tenantID string) error {
	if _, err := tx.Exec(ctx, `
		INSERT INTO tenants (id)
		VALUES ($1)
		ON CONFLICT (id) DO NOTHING
	`, tenantID); err != nil {
		return fmt.Errorf("ensure tenant: %w", err)
	}
	return nil
}

func ensureEntityTypePublished(ctx context.Context, tx pgx.Tx, tenantID, entityTypeID string) error {
	var status string
	if err := tx.QueryRow(ctx, `
		SELECT status
		FROM entity_types
		WHERE tenant_id = $1 AND id = $2
	`, tenantID, entityTypeID).Scan(&status); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrEntityTypeNotFound
		}
		return fmt.Errorf("load entity type: %w", err)
	}
	if status != "published" {
		return ErrEntityTypeNotPublished
	}
	return nil
}

func insertVersion(ctx context.Context, tx pgx.Tx, tenantID, entityID string, version int64, document map[string]any) error {
	payload, err := json.Marshal(document)
	if err != nil {
		return fmt.Errorf("marshal document: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO profile_versions (tenant_id, entity_id, version, document)
		VALUES ($1, $2, $3, $4)
	`, tenantID, entityID, version, payload); err != nil {
		return fmt.Errorf("insert profile version: %w", err)
	}
	return nil
}

func syncExternalRefs(ctx context.Context, tx pgx.Tx, tenantID, entityID string, refs []ExternalRef, replace bool) error {
	if replace {
		if _, err := tx.Exec(ctx, `
			DELETE FROM external_id_mappings
			WHERE tenant_id = $1 AND entity_id = $2
		`, tenantID, entityID); err != nil {
			return fmt.Errorf("cleanup external refs: %w", err)
		}
	}
	for _, item := range refs {
		item.SourceSystem = strings.TrimSpace(item.SourceSystem)
		item.ExternalID = strings.TrimSpace(item.ExternalID)
		_, err := tx.Exec(ctx, `
			INSERT INTO external_id_mappings (tenant_id, source_system, external_id, entity_id)
			VALUES ($1, $2, $3, $4)
		`, tenantID, item.SourceSystem, item.ExternalID, entityID)
		if err == nil {
			continue
		}
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrExternalMappingConflict
		}
		return fmt.Errorf("upsert external ref: %w", err)
	}
	return nil
}

func lockEntity(ctx context.Context, tx pgx.Tx, tenantID, entityID string) error {
	var id string
	if err := tx.QueryRow(ctx, `
		SELECT entity_id
		FROM entities
		WHERE tenant_id = $1 AND entity_id = $2
		FOR UPDATE
	`, tenantID, entityID).Scan(&id); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("load entity: %w", err)
	}
	return nil
}

func normalizeDocument(document map[string]any) (map[string]any, error) {
	if document == nil {
		document = map[string]any{}
	}
	payload, err := json.Marshal(document)
	if err != nil {
		return nil, fmt.Errorf("invalid document: %w", err)
	}
	var out map[string]any
	if err := json.Unmarshal(payload, &out); err != nil {
		return nil, fmt.Errorf("invalid document: %w", err)
	}
	return out, nil
}

func validateExternalRefs(refs []ExternalRef) error {
	seen := map[string]struct{}{}
	for _, item := range refs {
		source := strings.TrimSpace(item.SourceSystem)
		externalID := strings.TrimSpace(item.ExternalID)
		if source == "" || externalID == "" {
			return fmt.Errorf("external refs require source_system and external_id")
		}
		key := source + "\n" + externalID
		if _, ok := seen[key]; ok {
			return fmt.Errorf("duplicate external ref: %s/%s", source, externalID)
		}
		seen[key] = struct{}{}
	}
	return nil
}

func validateUUID(value string) (string, error) {
	id, err := uuid.Parse(strings.TrimSpace(value))
	if err != nil {
		return "", err
	}
	return id.String(), nil
}
