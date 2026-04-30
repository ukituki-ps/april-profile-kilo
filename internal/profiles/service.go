package profiles

import (
	"context"
	"encoding/base64"
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
	ErrInvalidCursor           = errors.New("invalid cursor")
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

type ListParams struct {
	Search       string
	EntityTypeID string
	Limit        int
	Cursor       string
	Sort         string
}

type ListItem struct {
	EntityID     string    `json:"entity_id"`
	EntityTypeID string    `json:"entity_type_id"`
	Version      int64     `json:"version"`
	CreatedAt    time.Time `json:"created_at"`
	Preview      string    `json:"preview"`
}

type ListResult struct {
	Items      []ListItem `json:"items"`
	NextCursor *string    `json:"next_cursor,omitempty"`
	TotalCount int64      `json:"total_count"`
}

type listCursor struct {
	CreatedAt time.Time `json:"created_at"`
	EntityID  string    `json:"entity_id"`
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
		INSERT INTO entities (tenant_id, entity_type_id, bound_entity_type_revision_id)
		SELECT $1, $2, r.id
		FROM entity_type_revisions r
		WHERE r.tenant_id = $1 AND r.family_id = $2::uuid
		ORDER BY r.revision_no DESC
		LIMIT 1
		RETURNING entity_id
	`, tenantID, entityTypeID).Scan(&entityID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Snapshot{}, ErrEntityTypeNotPublished
		}
		return Snapshot{}, fmt.Errorf("create entity: %w", err)
	}

	docWithAuth := initialDocumentWithAuthority(document, params.WriteSource)
	occurredAt := time.Now().UTC()
	if err := insertVersion(ctx, tx, tenantID, entityID, 1, docWithAuth); err != nil {
		return Snapshot{}, err
	}
	if err := insertProfileOutboxRow(ctx, tx, tenantID, entityID, 1, occurredAt); err != nil {
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
	occurredAt := time.Now().UTC()
	if err := insertVersion(ctx, tx, tenantID, entityID, nextVersion, outDoc); err != nil {
		return Snapshot{}, err
	}
	if err := insertProfileOutboxRow(ctx, tx, tenantID, entityID, nextVersion, occurredAt); err != nil {
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

func (s *Service) List(ctx context.Context, tenantID string, params ListParams) (ListResult, error) {
	limit := params.Limit
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	sort := strings.TrimSpace(strings.ToLower(params.Sort))
	if sort == "" {
		sort = "updated_desc"
	}
	if sort != "updated_desc" && sort != "updated_asc" {
		return ListResult{}, fmt.Errorf("sort must be updated_desc or updated_asc")
	}

	entityTypeID := strings.TrimSpace(params.EntityTypeID)
	if entityTypeID != "" {
		validated, err := validateUUID(entityTypeID)
		if err != nil {
			return ListResult{}, fmt.Errorf("invalid entity_type_id: %w", err)
		}
		entityTypeID = validated
	}

	search := strings.TrimSpace(params.Search)
	cursor, err := decodeListCursor(params.Cursor)
	if err != nil {
		return ListResult{}, err
	}

	baseWhere := `
		e.tenant_id = $1
		AND ($2 = '' OR e.entity_type_id = $2::uuid)
		AND ($3 = '' OR e.entity_id::text ILIKE '%' || $3 || '%' OR pv.document::text ILIKE '%' || $3 || '%')
	`
	baseArgs := []any{tenantID, entityTypeID, search}
	cursorFilter := ""
	if cursor != nil {
		if sort == "updated_desc" {
			cursorFilter = "AND (pv.created_at < $4 OR (pv.created_at = $4 AND e.entity_id > $5::uuid))"
		} else {
			cursorFilter = "AND (pv.created_at > $4 OR (pv.created_at = $4 AND e.entity_id > $5::uuid))"
		}
		baseArgs = append(baseArgs, cursor.CreatedAt, cursor.EntityID)
	}

	orderBy := "pv.created_at DESC, e.entity_id ASC"
	if sort == "updated_asc" {
		orderBy = "pv.created_at ASC, e.entity_id ASC"
	}

	limitArgPos := len(baseArgs) + 1
	query := fmt.Sprintf(`
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
		WHERE %s
		%s
		ORDER BY %s
		LIMIT $%d
	`, baseWhere, cursorFilter, orderBy, limitArgPos)
	args := append(baseArgs, limit+1)

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return ListResult{}, fmt.Errorf("query list entities: %w", err)
	}
	defer rows.Close()

	items := make([]ListItem, 0, limit+1)
	for rows.Next() {
		var item ListItem
		var rawDocument []byte
		if err := rows.Scan(&item.EntityID, &item.EntityTypeID, &item.Version, &rawDocument, &item.CreatedAt); err != nil {
			return ListResult{}, fmt.Errorf("scan list entity: %w", err)
		}
		var doc map[string]any
		if err := json.Unmarshal(rawDocument, &doc); err != nil {
			return ListResult{}, fmt.Errorf("decode list document: %w", err)
		}
		item.Preview = previewFromDocument(doc)
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return ListResult{}, fmt.Errorf("iterate list entities: %w", err)
	}

	var nextCursor *string
	if len(items) > limit {
		last := items[limit-1]
		encoded, err := encodeListCursor(listCursor{CreatedAt: last.CreatedAt, EntityID: last.EntityID})
		if err != nil {
			return ListResult{}, fmt.Errorf("encode next cursor: %w", err)
		}
		nextCursor = &encoded
		items = items[:limit]
	}

	totalCount, err := s.countCurrentProfiles(ctx, tenantID, entityTypeID, search)
	if err != nil {
		return ListResult{}, err
	}

	return ListResult{Items: items, NextCursor: nextCursor, TotalCount: totalCount}, nil
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
	var hasRev bool
	if err := tx.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM entity_type_revisions r
			WHERE r.tenant_id = $1 AND r.family_id = $2::uuid
		)
	`, tenantID, entityTypeID).Scan(&hasRev); err != nil {
		return fmt.Errorf("check entity type revisions: %w", err)
	}
	if !hasRev {
		var famExists bool
		if err := tx.QueryRow(ctx, `
			SELECT EXISTS (
				SELECT 1 FROM entity_type_families f
				WHERE f.tenant_id = $1 AND f.id = $2::uuid
			)
		`, tenantID, entityTypeID).Scan(&famExists); err != nil {
			return fmt.Errorf("check entity type family: %w", err)
		}
		if !famExists {
			return ErrEntityTypeNotFound
		}
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

func previewFromDocument(document map[string]any) string {
	for _, value := range document {
		text, ok := value.(string)
		if ok && strings.TrimSpace(text) != "" {
			return text
		}
	}
	payload, err := json.Marshal(document)
	if err != nil {
		return "{}"
	}
	return string(payload)
}

func encodeListCursor(cursor listCursor) (string, error) {
	raw, err := json.Marshal(cursor)
	if err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(raw), nil
}

func decodeListCursor(value string) (*listCursor, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil, nil
	}
	raw, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil {
		return nil, ErrInvalidCursor
	}
	var cursor listCursor
	if err := json.Unmarshal(raw, &cursor); err != nil {
		return nil, ErrInvalidCursor
	}
	if cursor.CreatedAt.IsZero() {
		return nil, ErrInvalidCursor
	}
	entityID, err := validateUUID(cursor.EntityID)
	if err != nil {
		return nil, ErrInvalidCursor
	}
	cursor.EntityID = entityID
	return &cursor, nil
}

func (s *Service) countCurrentProfiles(ctx context.Context, tenantID, entityTypeID, search string) (int64, error) {
	var total int64
	if err := s.pool.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM entities e
		JOIN LATERAL (
			SELECT document
			FROM profile_versions
			WHERE tenant_id = e.tenant_id AND entity_id = e.entity_id
			ORDER BY version DESC
			LIMIT 1
		) pv ON true
		WHERE
			e.tenant_id = $1
			AND ($2 = '' OR e.entity_type_id = $2::uuid)
			AND ($3 = '' OR e.entity_id::text ILIKE '%' || $3 || '%' OR pv.document::text ILIKE '%' || $3 || '%')
	`, tenantID, entityTypeID, search).Scan(&total); err != nil {
		return 0, fmt.Errorf("count list entities: %w", err)
	}
	return total, nil
}
