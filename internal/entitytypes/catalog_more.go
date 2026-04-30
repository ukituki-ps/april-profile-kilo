package entitytypes

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// Get возвращает семейство с черновиком и сводкой по последней опубликованной ревизии.
func (c *Catalog) Get(ctx context.Context, tenantID, familyID string) (Record, error) {
	if _, err := uuid.Parse(familyID); err != nil {
		return Record{}, fmt.Errorf("%w: invalid entity type id: %v", ErrInvalidArgument, err)
	}
	return c.getRecord(ctx, tenantID, familyID)
}

type UpdateFamilyParams struct {
	Namespace string
	Code      string
}

// UpdateFamilyMeta обновляет namespace/code семейства (метаданные ключа типа).
func (c *Catalog) UpdateFamilyMeta(ctx context.Context, tenantID, familyID string, params UpdateFamilyParams) (Record, error) {
	if _, err := uuid.Parse(familyID); err != nil {
		return Record{}, fmt.Errorf("%w: invalid entity type id: %v", ErrInvalidArgument, err)
	}
	ns := strings.TrimSpace(params.Namespace)
	code := strings.TrimSpace(params.Code)
	if ns == "" || code == "" {
		return Record{}, fmt.Errorf("%w: namespace and code are required", ErrInvalidArgument)
	}
	cmd, err := c.pool.Exec(ctx, `
		UPDATE entity_type_families
		SET namespace = $3, code = $4, updated_at = now()
		WHERE tenant_id = $1 AND id = $2::uuid
	`, tenantID, familyID, ns, code)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return Record{}, ErrDuplicateFamilyKey
		}
		return Record{}, fmt.Errorf("update entity type family: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return Record{}, ErrNotFound
	}
	return c.getRecord(ctx, tenantID, familyID)
}

// DeleteFamily удаляет семейство только если нет сущностей и нет опубликованных ревизий.
func (c *Catalog) DeleteFamily(ctx context.Context, tenantID, familyID string) error {
	if _, err := uuid.Parse(familyID); err != nil {
		return fmt.Errorf("%w: invalid entity type id: %v", ErrInvalidArgument, err)
	}
	tx, err := c.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var revCount, entCount int
	if err := tx.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*) FROM entity_type_revisions r WHERE r.tenant_id = $1 AND r.family_id = $2::uuid),
			(SELECT COUNT(*) FROM entities e WHERE e.tenant_id = $1 AND e.entity_type_id = $2::uuid)
	`, tenantID, familyID).Scan(&revCount, &entCount); err != nil {
		return fmt.Errorf("counts: %w", err)
	}
	if revCount > 0 || entCount > 0 {
		return ErrFamilyNotDeletable
	}

	cmd, err := tx.Exec(ctx, `
		DELETE FROM entity_type_families
		WHERE tenant_id = $1 AND id = $2::uuid
	`, tenantID, familyID)
	if err != nil {
		return fmt.Errorf("delete family: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return ErrNotFound
	}
	return tx.Commit(ctx)
}

type SaveDraftParams struct {
	DraftSchema          map[string]any
	IfDraftSchemaVersion *int
}

// SaveDraft сохраняет черновик; при IfDraftSchemaVersion проверяет optimistic concurrency.
func (c *Catalog) SaveDraft(ctx context.Context, tenantID, familyID string, params SaveDraftParams) (Record, error) {
	if _, err := uuid.Parse(familyID); err != nil {
		return Record{}, fmt.Errorf("%w: invalid entity type id: %v", ErrInvalidArgument, err)
	}
	draft := params.DraftSchema
	if draft == nil {
		draft = map[string]any{}
	}
	raw, err := json.Marshal(draft)
	if err != nil {
		return Record{}, fmt.Errorf("marshal draft: %w", err)
	}

	tx, err := c.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Record{}, fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var currentVer int
	err = tx.QueryRow(ctx, `
		SELECT d.draft_schema_version
		FROM entity_type_drafts d
		JOIN entity_type_families f ON f.id = d.family_id AND f.tenant_id = d.tenant_id
		WHERE d.tenant_id = $1 AND d.family_id = $2::uuid
		FOR UPDATE OF d
	`, tenantID, familyID).Scan(&currentVer)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Record{}, ErrNotFound
		}
		return Record{}, fmt.Errorf("load draft: %w", err)
	}
	if params.IfDraftSchemaVersion != nil && *params.IfDraftSchemaVersion != currentVer {
		return Record{}, ErrDraftVersionConflict
	}

	nextVer := currentVer + 1
	_, err = tx.Exec(ctx, `
		UPDATE entity_type_drafts
		SET draft_schema_json = $3::jsonb, draft_schema_version = $4, updated_at = now()
		WHERE tenant_id = $1 AND family_id = $2::uuid
	`, tenantID, familyID, raw, nextVer)
	if err != nil {
		return Record{}, fmt.Errorf("update draft: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return Record{}, fmt.Errorf("commit save draft: %w", err)
	}
	return c.getRecord(ctx, tenantID, familyID)
}

// ListRevisions возвращает все опубликованные ревизии семейства по возрастанию revision_no.
func (c *Catalog) ListRevisions(ctx context.Context, tenantID, familyID string) ([]Revision, error) {
	if _, err := uuid.Parse(familyID); err != nil {
		return nil, fmt.Errorf("%w: invalid entity type id: %v", ErrInvalidArgument, err)
	}
	rows, err := c.pool.Query(ctx, `
		SELECT r.id::text, r.family_id::text, r.revision_no, r.schema_json, r.published_at
		FROM entity_type_revisions r
		WHERE r.tenant_id = $1 AND r.family_id = $2::uuid
		ORDER BY r.revision_no ASC
	`, tenantID, familyID)
	if err != nil {
		return nil, fmt.Errorf("list revisions: %w", err)
	}
	defer rows.Close()

	var out []Revision
	for rows.Next() {
		var rev Revision
		var raw []byte
		if err := rows.Scan(&rev.ID, &rev.FamilyID, &rev.RevisionNo, &raw, &rev.PublishedAt); err != nil {
			return nil, fmt.Errorf("scan revision: %w", err)
		}
		if err := json.Unmarshal(raw, &rev.Schema); err != nil {
			return nil, fmt.Errorf("decode revision schema: %w", err)
		}
		out = append(out, rev)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate revisions: %w", err)
	}
	return out, nil
}

// GetRevision возвращает ревизию по UUID в пределах tenant и семейства.
func (c *Catalog) GetRevision(ctx context.Context, tenantID, familyID, revisionID string) (Revision, error) {
	if _, err := uuid.Parse(familyID); err != nil {
		return Revision{}, fmt.Errorf("%w: invalid family id: %v", ErrInvalidArgument, err)
	}
	if _, err := uuid.Parse(revisionID); err != nil {
		return Revision{}, fmt.Errorf("%w: invalid revision id: %v", ErrInvalidArgument, err)
	}
	return c.scanOneRevision(ctx, `
		SELECT r.id::text, r.family_id::text, r.revision_no, r.schema_json, r.published_at
		FROM entity_type_revisions r
		WHERE r.tenant_id = $1 AND r.family_id = $2::uuid AND r.id = $3::uuid
	`, tenantID, familyID, revisionID)
}

// GetRevisionByNo возвращает ревизию по номеру внутри семейства.
func (c *Catalog) GetRevisionByNo(ctx context.Context, tenantID, familyID string, revisionNo int) (Revision, error) {
	if _, err := uuid.Parse(familyID); err != nil {
		return Revision{}, fmt.Errorf("%w: invalid family id: %v", ErrInvalidArgument, err)
	}
	if revisionNo <= 0 {
		return Revision{}, fmt.Errorf("%w: revision_no must be positive", ErrInvalidArgument)
	}
	return c.scanOneRevision(ctx, `
		SELECT r.id::text, r.family_id::text, r.revision_no, r.schema_json, r.published_at
		FROM entity_type_revisions r
		WHERE r.tenant_id = $1 AND r.family_id = $2::uuid AND r.revision_no = $3
	`, tenantID, familyID, revisionNo)
}

func (c *Catalog) scanOneRevision(ctx context.Context, query string, args ...any) (Revision, error) {
	row := c.pool.QueryRow(ctx, query, args...)
	var rev Revision
	var raw []byte
	if err := row.Scan(&rev.ID, &rev.FamilyID, &rev.RevisionNo, &raw, &rev.PublishedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Revision{}, ErrRevisionNotFound
		}
		return Revision{}, fmt.Errorf("load revision: %w", err)
	}
	if err := json.Unmarshal(raw, &rev.Schema); err != nil {
		return Revision{}, fmt.Errorf("decode revision schema: %w", err)
	}
	return rev, nil
}
