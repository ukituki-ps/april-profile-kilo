package profiles

import (
	"encoding/json"
	"testing"
	"time"

)

func TestProfileChangeEventID_deterministic(t *testing.T) {
	t.Parallel()
	tenant := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	entity := "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
	v := int64(7)
	a := ProfileChangeEventID(tenant, entity, v)
	b := ProfileChangeEventID(tenant, entity, v)
	if a != b {
		t.Fatalf("expected same UUID, got %v and %v", a, b)
	}
	if a.Version() != 5 {
		t.Fatalf("expected UUID v5, got version %d", a.Version())
	}
}

func TestProfileChangeEventID_differsByVersion(t *testing.T) {
	t.Parallel()
	tenant := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	entity := "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
	a := ProfileChangeEventID(tenant, entity, 1)
	b := ProfileChangeEventID(tenant, entity, 2)
	if a == b {
		t.Fatal("expected different event_id for different versions")
	}
}

func TestProfileChangeEventV1_JSON(t *testing.T) {
	t.Parallel()
	ts := time.Date(2026, 4, 21, 12, 0, 0, 0, time.UTC)
	ev := ProfileChangeEventV1{
		TenantID:       "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
		EntityID:       "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
		EntityType:     "hr/employee",
		ProfileVersion: 3,
		OccurredAt:     ts,
		EventID:        ProfileChangeEventID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", 3).String(),
	}
	raw, err := json.Marshal(ev)
	if err != nil {
		t.Fatal(err)
	}
	var back ProfileChangeEventV1
	if err := json.Unmarshal(raw, &back); err != nil {
		t.Fatal(err)
	}
	if back.EventID != ev.EventID || back.ProfileVersion != 3 || back.EntityType != "hr/employee" {
		t.Fatalf("roundtrip: %+v", back)
	}
}

