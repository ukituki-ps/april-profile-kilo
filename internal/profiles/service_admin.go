package profiles

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

func joinNsField(namespace, fieldKey string) string {
	if namespace == "default" {
		return "default/" + fieldKey
	}
	return namespace + "/" + fieldKey
}

// ListOpenConflicts возвращает открытые конфликты authority для tenant.
func (s *Service) ListOpenConflicts(ctx context.Context, tenantID string) ([]FieldConflict, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT
			id::text,
			entity_id::text,
			status,
			namespace,
			field_key,
			existing_value,
			incoming_value,
			existing_source,
			incoming_source,
			reason,
			created_at
		FROM profile_field_conflicts
		WHERE tenant_id = $1 AND status = 'open'
		ORDER BY created_at ASC
	`, tenantID)
	if err != nil {
		return nil, fmt.Errorf("list conflicts: %w", err)
	}
	defer rows.Close()

	var out []FieldConflict
	for rows.Next() {
		var c FieldConflict
		var ev, iv []byte
		if err := rows.Scan(
			&c.ID,
			&c.EntityID,
			&c.Status,
			&c.Namespace,
			&c.FieldKey,
			&ev,
			&iv,
			&c.ExistingSource,
			&c.IncomingSource,
			&c.Reason,
			&c.CreatedAt,
		); err != nil {
			return nil, err
		}
		if len(ev) > 0 {
			_ = json.Unmarshal(ev, &c.ExistingValue)
		}
		if len(iv) > 0 {
			_ = json.Unmarshal(iv, &c.IncomingValue)
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

// ResolveFieldConflict применяет ручное решение: новая версия профиля, authority manual, аудит.
func (s *Service) ResolveFieldConflict(ctx context.Context, tenantID, conflictID, actorSub string, resolution any, notes string) (Snapshot, error) {
	conflictID, err := validateUUID(conflictID)
	if err != nil {
		return Snapshot{}, fmt.Errorf("invalid conflict id: %w", err)
	}
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Snapshot{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var entityID, ns, fk string
	var status string
	if err := tx.QueryRow(ctx, `
		SELECT entity_id::text, namespace, field_key, status
		FROM profile_field_conflicts
		WHERE tenant_id = $1 AND id = $2
	`, tenantID, conflictID).Scan(&entityID, &ns, &fk, &status); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Snapshot{}, ErrConflictNotFound
		}
		return Snapshot{}, err
	}
	if status != "open" {
		return Snapshot{}, fmt.Errorf("conflict already resolved")
	}

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
		return Snapshot{}, err
	}
	var doc map[string]any
	if err := json.Unmarshal(currentDoc, &doc); err != nil {
		return Snapshot{}, err
	}
	data, meta := splitMeta(doc)
	flat := flattenDocument(data)
	path := joinNsField(ns, fk)
	flat[path] = resolution
	meta = setAuthorityPath(meta, path, "manual")

	newDoc := withMeta(unflattenDocument(flat), meta)

	var nextVersion int64
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(MAX(version), 0) + 1
		FROM profile_versions
		WHERE tenant_id = $1 AND entity_id = $2
	`, tenantID, entityID).Scan(&nextVersion); err != nil {
		return Snapshot{}, err
	}
	if err := insertVersion(ctx, tx, tenantID, entityID, nextVersion, newDoc); err != nil {
		return Snapshot{}, err
	}

	resJSON, err := json.Marshal(resolution)
	if err != nil {
		return Snapshot{}, err
	}
	_, err = tx.Exec(ctx, `
		UPDATE profile_field_conflicts
		SET status = 'resolved',
			resolved_at = now(),
			resolution_value = $3,
			resolved_by_sub = $4,
			resolution_notes = $5
		WHERE tenant_id = $1 AND id = $2
	`, tenantID, conflictID, resJSON, actorSub, nullIfEmpty(notes))
	if err != nil {
		return Snapshot{}, err
	}

	cid := conflictID
	eid := entityID
	if err := insertAudit(ctx, tx, tenantID, actorSub, "resolve_conflict", &eid, nil, &cid, map[string]any{
		"path": path,
	}); err != nil {
		return Snapshot{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Snapshot{}, err
	}
	return s.GetCurrent(ctx, tenantID, entityID)
}

func nullIfEmpty(s string) any {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return s
}

// MergeEntityProfiles переносит данные source -> target, удаляет source, пишет аудит.
func (s *Service) MergeEntityProfiles(ctx context.Context, tenantID, sourceEntityID, targetEntityID, actorSub string) (MergeResult, error) {
	sourceEntityID, err := validateUUID(sourceEntityID)
	if err != nil {
		return MergeResult{}, fmt.Errorf("invalid source: %w", err)
	}
	targetEntityID, err = validateUUID(targetEntityID)
	if err != nil {
		return MergeResult{}, fmt.Errorf("invalid target: %w", err)
	}
	if sourceEntityID == targetEntityID {
		return MergeResult{}, ErrMergeInvalid
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return MergeResult{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	rows, err := tx.Query(ctx, `
		SELECT entity_id::text, entity_type_id::text
		FROM entities
		WHERE tenant_id = $1 AND entity_id IN ($2, $3)
		ORDER BY entity_id
		FOR UPDATE
	`, tenantID, sourceEntityID, targetEntityID)
	if err != nil {
		return MergeResult{}, err
	}
	defer rows.Close()
	typesByEntity := map[string]string{}
	for rows.Next() {
		var eid, et string
		if err := rows.Scan(&eid, &et); err != nil {
			return MergeResult{}, err
		}
		typesByEntity[eid] = et
	}
	if err := rows.Err(); err != nil {
		return MergeResult{}, err
	}
	if len(typesByEntity) != 2 {
		return MergeResult{}, ErrNotFound
	}
	if typesByEntity[sourceEntityID] != typesByEntity[targetEntityID] {
		return MergeResult{}, ErrMergeInvalid
	}

	var srcDoc, tgtDoc []byte
	if err := tx.QueryRow(ctx, `
		SELECT document FROM profile_versions WHERE tenant_id = $1 AND entity_id = $2 ORDER BY version DESC LIMIT 1
	`, tenantID, sourceEntityID).Scan(&srcDoc); err != nil {
		return MergeResult{}, err
	}
	if err := tx.QueryRow(ctx, `
		SELECT document FROM profile_versions WHERE tenant_id = $1 AND entity_id = $2 ORDER BY version DESC LIMIT 1
	`, tenantID, targetEntityID).Scan(&tgtDoc); err != nil {
		return MergeResult{}, err
	}
	var sm, tm map[string]any
	if err := json.Unmarshal(srcDoc, &sm); err != nil {
		return MergeResult{}, err
	}
	if err := json.Unmarshal(tgtDoc, &tm); err != nil {
		return MergeResult{}, err
	}

	var collision int
	if err := tx.QueryRow(ctx, `
		SELECT COUNT(*) FROM external_id_mappings s
		JOIN external_id_mappings t
		  ON s.tenant_id = t.tenant_id
		 AND s.source_system = t.source_system
		 AND s.external_id = t.external_id
		WHERE s.tenant_id = $1 AND s.entity_id = $2 AND t.entity_id = $3
	`, tenantID, sourceEntityID, targetEntityID).Scan(&collision); err != nil {
		return MergeResult{}, err
	}
	if collision > 0 {
		return MergeResult{}, ErrMergeExternalCollision
	}

	if _, err := tx.Exec(ctx, `
		UPDATE external_id_mappings SET entity_id = $3
		WHERE tenant_id = $1 AND entity_id = $2
	`, tenantID, sourceEntityID, targetEntityID); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return MergeResult{}, ErrMergeExternalCollision
		}
		return MergeResult{}, err
	}

	merged := mergeDocumentsForDuplicate(tm, sm)

	var nextVersion int64
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(MAX(version), 0) + 1 FROM profile_versions WHERE tenant_id = $1 AND entity_id = $2
	`, tenantID, targetEntityID).Scan(&nextVersion); err != nil {
		return MergeResult{}, err
	}
	if err := insertVersion(ctx, tx, tenantID, targetEntityID, nextVersion, merged); err != nil {
		return MergeResult{}, err
	}

	if _, err := tx.Exec(ctx, `DELETE FROM entities WHERE tenant_id = $1 AND entity_id = $2`, tenantID, sourceEntityID); err != nil {
		return MergeResult{}, err
	}

	tid := targetEntityID
	sid := sourceEntityID
	if err := insertAudit(ctx, tx, tenantID, actorSub, "merge_profiles", &tid, &sid, nil, map[string]any{
		"target_version": nextVersion,
	}); err != nil {
		return MergeResult{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return MergeResult{}, err
	}

	snap, err := s.GetCurrent(ctx, tenantID, targetEntityID)
	if err != nil {
		return MergeResult{}, err
	}
	return MergeResult{
		TargetEntityID: targetEntityID,
		TargetVersion:  snap.Version,
		SourceEntityID: sourceEntityID,
		Document:       snap.Document,
	}, nil
}
