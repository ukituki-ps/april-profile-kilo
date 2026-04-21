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
	ErrNotFound         = errors.New("entity type not found")
	ErrAlreadyPublished = errors.New("entity type already published")
	ErrInvalidSchema    = errors.New("invalid draft schema")
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
		return Record{}, fmt.Errorf("namespace and code are required")
	}
	draftSchema := params.DraftSchema
	if draftSchema == nil {
		draftSchema = map[string]any{}
	}

	schemaJSON, err := json.Marshal(draftSchema)
	if err != nil {
		return Record{}, fmt.Errorf("marshal draft schema: %w", err)
	}

	row := c.pool.QueryRow(ctx, `
		INSERT INTO entity_types (
			tenant_id,
			namespace,
			code,
			schema_json,
			schema_version,
			status
		) VALUES ($1, $2, $3, $4, 1, 'draft')
		RETURNING id, namespace, code, schema_json, schema_version, status, created_at
	`, tenantID, namespace, code, schemaJSON)

	var rec Record
	var rawSchema []byte
	var status string
	if err := row.Scan(
		&rec.ID,
		&rec.Namespace,
		&rec.Code,
		&rawSchema,
		&rec.DraftSchemaVersion,
		&status,
		&rec.CreatedAt,
	); err != nil {
		return Record{}, fmt.Errorf("insert entity type draft: %w", err)
	}
	rec.Status = Status(status)
	if err := json.Unmarshal(rawSchema, &rec.DraftSchema); err != nil {
		return Record{}, fmt.Errorf("decode stored draft schema: %w", err)
	}
	return rec, nil
}

func (c *Catalog) List(ctx context.Context, tenantID string) ([]Record, error) {
	rows, err := c.pool.Query(ctx, `
		SELECT
			id,
			namespace,
			code,
			schema_json,
			schema_version,
			status,
			published_schema_json,
			published_schema_version,
			published_at,
			created_at
		FROM entity_types
		WHERE tenant_id = $1
		ORDER BY created_at DESC
	`, tenantID)
	if err != nil {
		return nil, fmt.Errorf("list entity types: %w", err)
	}
	defer rows.Close()

	out := make([]Record, 0)
	for rows.Next() {
		rec, err := scanRecord(rows)
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

func (c *Catalog) Publish(ctx context.Context, tenantID, entityTypeID string) (Record, error) {
	_, err := uuid.Parse(entityTypeID)
	if err != nil {
		return Record{}, fmt.Errorf("invalid entity type id: %w", err)
	}

	tx, err := c.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Record{}, fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	row := tx.QueryRow(ctx, `
		SELECT
			id,
			namespace,
			code,
			schema_json,
			schema_version,
			status,
			published_schema_json,
			published_schema_version,
			published_at,
			created_at
		FROM entity_types
		WHERE tenant_id = $1 AND id = $2
		FOR UPDATE
	`, tenantID, entityTypeID)

	rec, err := scanRecord(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Record{}, ErrNotFound
		}
		return Record{}, fmt.Errorf("load draft for publish: %w", err)
	}
	if rec.Status == StatusPublished {
		return Record{}, ErrAlreadyPublished
	}

	if err := ValidateSchemaForPublication(rec.DraftSchema); err != nil {
		return Record{}, fmt.Errorf("%w: %v", ErrInvalidSchema, err)
	}

	row = tx.QueryRow(ctx, `
		UPDATE entity_types
		SET
			status = 'published',
			published_schema_json = schema_json,
			published_schema_version = schema_version,
			published_at = now()
		WHERE tenant_id = $1 AND id = $2
		RETURNING
			id,
			namespace,
			code,
			schema_json,
			schema_version,
			status,
			published_schema_json,
			published_schema_version,
			published_at,
			created_at
	`, tenantID, entityTypeID)

	published, err := scanRecord(row)
	if err != nil {
		return Record{}, fmt.Errorf("persist published entity type: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return Record{}, fmt.Errorf("commit publish: %w", err)
	}
	return published, nil
}

func scanRecord(row pgx.Row) (Record, error) {
	var rec Record
	var rawDraft []byte
	var rawPublished []byte
	var status string
	var publishedVersion *int
	if err := row.Scan(
		&rec.ID,
		&rec.Namespace,
		&rec.Code,
		&rawDraft,
		&rec.DraftSchemaVersion,
		&status,
		&rawPublished,
		&publishedVersion,
		&rec.PublishedAt,
		&rec.CreatedAt,
	); err != nil {
		return Record{}, err
	}
	rec.Status = Status(status)
	if err := json.Unmarshal(rawDraft, &rec.DraftSchema); err != nil {
		return Record{}, fmt.Errorf("decode draft schema: %w", err)
	}
	if len(rawPublished) > 0 {
		if err := json.Unmarshal(rawPublished, &rec.PublishedSchema); err != nil {
			return Record{}, fmt.Errorf("decode published schema: %w", err)
		}
	}
	rec.PublishedSchemaVersion = publishedVersion
	return rec, nil
}
