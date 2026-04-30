package entitytypes

import "time"

// Revision — опубликованная immutable-ревизия схемы семейства типа.
type Revision struct {
	ID          string         `json:"id"`
	FamilyID    string         `json:"family_id"`
	RevisionNo  int            `json:"revision_no"`
	Schema      map[string]any `json:"schema"`
	PublishedAt time.Time      `json:"published_at"`
}
