package profiles

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5"
)

func initialDocumentWithAuthority(doc map[string]any, source string) map[string]any {
	source = strings.TrimSpace(source)
	if source == "" {
		source = "api"
	}
	data, _ := splitMeta(doc)
	flat := flattenDocument(data)
	meta := map[string]any{}
	for path := range flat {
		meta = setAuthorityPath(meta, path, source)
	}
	return withMeta(unflattenDocument(flat), meta)
}

func externalRefsChanged(ctx context.Context, tx pgx.Tx, tenantID, entityID string, want []ExternalRef) (bool, error) {
	have, err := loadExternalRefsTx(ctx, tx, tenantID, entityID)
	if err != nil {
		return false, err
	}
	if len(have) != len(want) {
		return true, nil
	}
	sort.Slice(have, func(i, j int) bool {
		return have[i].SourceSystem < have[j].SourceSystem ||
			(have[i].SourceSystem == have[j].SourceSystem && have[i].ExternalID < have[j].ExternalID)
	})
	sort.Slice(want, func(i, j int) bool {
		return want[i].SourceSystem < want[j].SourceSystem ||
			(want[i].SourceSystem == want[j].SourceSystem && want[i].ExternalID < want[j].ExternalID)
	})
	for i := range have {
		if have[i].SourceSystem != want[i].SourceSystem || have[i].ExternalID != want[i].ExternalID {
			return true, nil
		}
	}
	return false, nil
}

func loadExternalRefsTx(ctx context.Context, tx pgx.Tx, tenantID, entityID string) ([]ExternalRef, error) {
	rows, err := tx.Query(ctx, `
		SELECT source_system, external_id
		FROM external_id_mappings
		WHERE tenant_id = $1 AND entity_id = $2
	`, tenantID, entityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ExternalRef
	for rows.Next() {
		var r ExternalRef
		if err := rows.Scan(&r.SourceSystem, &r.ExternalID); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func insertConflictCandidates(ctx context.Context, tx pgx.Tx, tenantID, entityID string, candidates []conflictCandidate) error {
	for _, c := range candidates {
		ev, err := json.Marshal(c.existingValue)
		if err != nil {
			return err
		}
		iv, err := json.Marshal(c.incomingValue)
		if err != nil {
			return err
		}
		_, err = tx.Exec(ctx, `
			INSERT INTO profile_field_conflicts (
				tenant_id, entity_id, status, namespace, field_key,
				existing_value, incoming_value, existing_source, incoming_source, reason
			) VALUES ($1, $2, 'open', $3, $4, $5, $6, $7, $8, $9)
		`, tenantID, entityID, c.namespace, c.fieldKey, ev, iv, c.existingSource, c.incomingSource, c.reason)
		if err != nil {
			return fmt.Errorf("insert conflict: %w", err)
		}
	}
	return nil
}

func insertAudit(ctx context.Context, tx pgx.Tx, tenantID, actorSub, action string, entityID, relatedEntityID, conflictID *string, payload map[string]any) error {
	var payloadJSON []byte
	var err error
	if payload == nil {
		payloadJSON = []byte("{}")
	} else {
		payloadJSON, err = json.Marshal(payload)
		if err != nil {
			return err
		}
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO admin_audit_log (tenant_id, actor_sub, action, entity_id, related_entity_id, conflict_id, payload)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, tenantID, actorSub, action, entityID, relatedEntityID, conflictID, payloadJSON)
	return err
}
