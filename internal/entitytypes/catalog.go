package entitytypes

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound      = errors.New("entity type not found")
	ErrInvalidSchema = errors.New("invalid draft schema")
)

type Status string

const (
	StatusDraft     Status = "draft"
	StatusPublished Status = "published"
)

type Record struct {
	ID                     string         `json:"id"`
	Namespace              string         `json:"namespace"`
	Code                   string         `json:"code"`
	Status                 Status         `json:"status"`
	DraftSchema            map[string]any `json:"draft_schema"`
	DraftSchemaVersion     int            `json:"draft_schema_version"`
	PublishedSchema        map[string]any `json:"published_schema,omitempty"`
	PublishedSchemaVersion *int           `json:"published_schema_version,omitempty"`
	PublishedAt            *time.Time     `json:"published_at,omitempty"`
	CreatedAt              time.Time      `json:"created_at"`
}

type CreateDraftParams struct {
	Namespace   string
	Code        string
	DraftSchema map[string]any
}

type Catalog struct {
	pool *pgxpool.Pool
}

func NewCatalog(pool *pgxpool.Pool) *Catalog {
	return &Catalog{pool: pool}
}

func (c *Catalog) CreateDraft(ctx context.Context, tenantID string, params CreateDraftParams) (Record, error) {
	namespace := strings.TrimSpace(params.Namespace)
	code := strings.TrimSpace(params.Code)
	if namespace == "" || code == "" {
		return Record{}, fmt.Errorf("%w: namespace and code are required", ErrInvalidArgument)
	}
	draftSchema := params.DraftSchema
	if draftSchema == nil {
		draftSchema = map[string]any{}
	}

	schemaJSON, err := json.Marshal(draftSchema)
	if err != nil {
		return Record{}, fmt.Errorf("marshal draft schema: %w", err)
	}

	tx, err := c.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Record{}, fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var familyID string
	var createdAt time.Time
	err = tx.QueryRow(ctx, `
		INSERT INTO entity_type_families (id, tenant_id, namespace, code)
		VALUES (gen_random_uuid(), $1, $2, $3)
		RETURNING id, created_at
	`, tenantID, namespace, code).Scan(&familyID, &createdAt)
	if err != nil {
		return Record{}, fmt.Errorf("insert entity type family: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO entity_type_drafts (tenant_id, family_id, draft_schema_json, draft_schema_version, updated_at)
		VALUES ($1, $2, $3::jsonb, 1, now())
	`, tenantID, familyID, schemaJSON)
	if err != nil {
		return Record{}, fmt.Errorf("insert entity type draft: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return Record{}, fmt.Errorf("commit create draft: %w", err)
	}

	return c.getRecord(ctx, tenantID, familyID)
}

func (c *Catalog) List(ctx context.Context, tenantID string) ([]Record, error) {
	rows, err := c.pool.Query(ctx, `
		SELECT
			f.id,
			f.namespace,
			f.code,
			d.draft_schema_json,
			d.draft_schema_version,
			lr.revision_no,
			lr.schema_json,
			lr.published_at,
			f.created_at
		FROM entity_type_families f
		JOIN entity_type_drafts d
			ON d.tenant_id = f.tenant_id AND d.family_id = f.id
		LEFT JOIN LATERAL (
			SELECT r.revision_no, r.schema_json, r.published_at
			FROM entity_type_revisions r
			WHERE r.tenant_id = f.tenant_id AND r.family_id = f.id
			ORDER BY r.revision_no DESC
			LIMIT 1
		) lr ON TRUE
		WHERE f.tenant_id = $1
		ORDER BY f.created_at DESC
	`, tenantID)
	if err != nil {
		return nil, fmt.Errorf("list entity types: %w", err)
	}
	defer rows.Close()

	out := make([]Record, 0)
	for rows.Next() {
		rec, err := scanRecordFromListRow(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, rec)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate entity types: %w", err)
	}
	return out, nil
}

func (c *Catalog) Publish(ctx context.Context, tenantID, entityTypeFamilyID string) (Record, error) {
	_, err := uuid.Parse(entityTypeFamilyID)
	if err != nil {
		return Record{}, fmt.Errorf("%w: invalid entity type id: %v", ErrInvalidArgument, err)
	}

	tx, err := c.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Record{}, fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	row := tx.QueryRow(ctx, `
		SELECT d.draft_schema_json
		FROM entity_type_drafts d
		JOIN entity_type_families f ON f.id = d.family_id AND f.tenant_id = d.tenant_id
		WHERE d.tenant_id = $1 AND d.family_id = $2
		FOR UPDATE OF d
	`, tenantID, entityTypeFamilyID)

	var draftRaw []byte
	if err := row.Scan(&draftRaw); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Record{}, ErrNotFound
		}
		return Record{}, fmt.Errorf("load draft for publish: %w", err)
	}

	var draftMap map[string]any
	if err := json.Unmarshal(draftRaw, &draftMap); err != nil {
		return Record{}, fmt.Errorf("decode draft schema: %w", err)
	}
	if err := ValidateSchemaForPublication(draftMap); err != nil {
		return Record{}, fmt.Errorf("%w: %v", ErrInvalidSchema, err)
	}

	var nextNo int
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(MAX(revision_no), 0) + 1
		FROM entity_type_revisions
		WHERE tenant_id = $1 AND family_id = $2
	`, tenantID, entityTypeFamilyID).Scan(&nextNo); err != nil {
		return Record{}, fmt.Errorf("next revision_no: %w", err)
	}

	payload, err := json.Marshal(draftMap)
	if err != nil {
		return Record{}, fmt.Errorf("marshal revision schema: %w", err)
	}

	pubAt := time.Now().UTC()
	_, err = tx.Exec(ctx, `
		INSERT INTO entity_type_revisions (tenant_id, family_id, revision_no, schema_json, published_at)
		VALUES ($1, $2, $3, $4::jsonb, $5)
	`, tenantID, entityTypeFamilyID, nextNo, payload, pubAt)
	if err != nil {
		return Record{}, fmt.Errorf("insert published revision: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return Record{}, fmt.Errorf("commit publish: %w", err)
	}

	return c.getRecord(ctx, tenantID, entityTypeFamilyID)
}

func (c *Catalog) getRecord(ctx context.Context, tenantID, familyID string) (Record, error) {
	row := c.pool.QueryRow(ctx, `
		SELECT
			f.id,
			f.namespace,
			f.code,
			d.draft_schema_json,
			d.draft_schema_version,
			lr.revision_no,
			lr.schema_json,
			lr.published_at,
			f.created_at
		FROM entity_type_families f
		JOIN entity_type_drafts d
			ON d.tenant_id = f.tenant_id AND d.family_id = f.id
		LEFT JOIN LATERAL (
			SELECT r.revision_no, r.schema_json, r.published_at
			FROM entity_type_revisions r
			WHERE r.tenant_id = f.tenant_id AND r.family_id = f.id
			ORDER BY r.revision_no DESC
			LIMIT 1
		) lr ON TRUE
		WHERE f.tenant_id = $1 AND f.id = $2
	`, tenantID, familyID)
	rec, err := scanRecordFromListRow(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Record{}, ErrNotFound
		}
		return Record{}, err
	}
	return rec, nil
}

func scanRecordFromListRow(row pgx.Row) (Record, error) {
	var rec Record
	var draftRaw []byte
	var lrRevNo *int
	var lrRaw []byte
	var lrPubAt *time.Time
	if err := row.Scan(
		&rec.ID,
		&rec.Namespace,
		&rec.Code,
		&draftRaw,
		&rec.DraftSchemaVersion,
		&lrRevNo,
		&lrRaw,
		&lrPubAt,
		&rec.CreatedAt,
	); err != nil {
		return Record{}, err
	}
	if err := json.Unmarshal(draftRaw, &rec.DraftSchema); err != nil {
		return Record{}, fmt.Errorf("decode draft schema: %w", err)
	}
	if lrRevNo != nil && len(lrRaw) > 0 {
		rec.Status = StatusPublished
		v := *lrRevNo
		rec.PublishedSchemaVersion = &v
		rec.PublishedAt = lrPubAt
		if err := json.Unmarshal(lrRaw, &rec.PublishedSchema); err != nil {
			return Record{}, fmt.Errorf("decode published schema: %w", err)
		}
	} else {
		rec.Status = StatusDraft
	}
	return rec, nil
}
