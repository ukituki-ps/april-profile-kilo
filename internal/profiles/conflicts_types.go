package profiles

import "time"

// FieldConflict — запись очереди конфликтов authority (таблица profile_field_conflicts).
type FieldConflict struct {
	ID              string         `json:"id"`
	EntityID        string         `json:"entity_id"`
	Status          string         `json:"status"`
	Namespace       string         `json:"namespace"`
	FieldKey        string         `json:"field_key"`
	ExistingValue   any       `json:"existing_value,omitempty"`
	IncomingValue   any       `json:"incoming_value,omitempty"`
	ExistingSource  string         `json:"existing_source"`
	IncomingSource  string         `json:"incoming_source"`
	Reason          string         `json:"reason"`
	CreatedAt       time.Time      `json:"created_at"`
	ResolvedAt      *time.Time     `json:"resolved_at,omitempty"`
	ResolutionValue any `json:"resolution_value,omitempty"`
	ResolvedBySub   string         `json:"resolved_by_sub,omitempty"`
	ResolutionNotes string         `json:"resolution_notes,omitempty"`
}

// MergeResult — результат явного merge дубликатов (source удалён, данные на target).
type MergeResult struct {
	TargetEntityID string         `json:"target_entity_id"`
	TargetVersion  int64          `json:"target_version"`
	SourceEntityID string         `json:"source_entity_id"`
	Document       map[string]any `json:"document"`
}
