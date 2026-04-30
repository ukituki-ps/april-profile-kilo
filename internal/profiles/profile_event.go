package profiles

import (
	"encoding/json"
	"strconv"
	"time"

	"github.com/google/uuid"
)

// ProfileEventNamespaceUUID — namespace UUID для детерминированного event_id (UUID v5, RFC 4122).
// Фиксированное значение; не менять без миграции данных и согласования с потребителями.
var ProfileEventNamespaceUUID = uuid.MustParse("019a2f3e-8c1d-7b5a-9e00-0000c0ffee01")

// ProfileChangeEventV1 — минимальный контракт исходящего события (ADR-0003).
// Поля ревизии типа — ADR-0005; omitempty сохраняет совместимость со старыми потребителями payload.
type ProfileChangeEventV1 struct {
	TenantID             string    `json:"tenant_id"`
	EntityID             string    `json:"entity_id"`
	EntityType           string    `json:"entity_type"`
	EntityTypeRevisionID string    `json:"entity_type_revision_id,omitempty"`
	EntityTypeRevisionNo int       `json:"entity_type_revision_no,omitempty"`
	ProfileVersion       int64     `json:"profile_version"`
	OccurredAt           time.Time `json:"occurred_at"`
	EventID              string    `json:"event_id"`
}

// ProfileChangeEventID возвращает детерминированный event_id для пары (tenant, entity, version).
func ProfileChangeEventID(tenantID, entityID string, profileVersion int64) uuid.UUID {
	s := tenantID + "|" + entityID + "|" + strconv.FormatInt(profileVersion, 10)
	return uuid.NewSHA1(ProfileEventNamespaceUUID, []byte(s))
}

// MarshalProfileChangeEvent сериализует событие в JSON для колонки payload.
func MarshalProfileChangeEvent(ev ProfileChangeEventV1) ([]byte, error) {
	return json.Marshal(ev)
}
