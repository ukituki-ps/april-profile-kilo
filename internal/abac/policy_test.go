package abac

import (
	"testing"

	"github.com/ukituki-ps/april-profile/internal/profiles"
)

func TestParsePolicy_empty(t *testing.T) {
	p, err := ParsePolicy("")
	if err != nil {
		t.Fatal(err)
	}
	if p != nil {
		t.Fatal("expected nil policy")
	}
}

func TestParsePolicy_valid(t *testing.T) {
	p, err := ParsePolicy(`{"default":["r1"],"hr":["r1","r2"]}`)
	if err != nil {
		t.Fatal(err)
	}
	if !p.Active() {
		t.Fatal("expected active")
	}
	if !p.visibleSegmentFn([]string{"r1"})("hr") {
		t.Fatal("hr should be visible for r1")
	}
	if p.visibleSegmentFn([]string{"r1"})("security") {
		t.Fatal("security should be denied when not in policy")
	}
}

func TestFilterDocument_namespacesAndDefault(t *testing.T) {
	p, err := ParsePolicy(`{"default":["reader"],"hr":["reader"],"security":["security-auditor"]}`)
	if err != nil {
		t.Fatal(err)
	}
	vis := p.visibleSegmentFn([]string{"reader"})
	doc := map[string]any{
		"name": "Alice",
		"hr":   map[string]any{"title": "Eng"},
		"security": map[string]any{
			"clearance": "top",
		},
	}
	got := FilterDocument(doc, vis)
	if got["security"] != nil {
		t.Fatalf("security must be stripped, got %#v", got)
	}
	if got["name"] != "Alice" {
		t.Fatalf("want default field, got %#v", got)
	}
	m, ok := got["hr"].(map[string]any)
	if !ok || m["title"] != "Eng" {
		t.Fatalf("want hr, got %#v", got)
	}
}

func TestFilterDocument_metaAuthority(t *testing.T) {
	p, err := ParsePolicy(`{"default":["reader"],"hr":["reader"]}`)
	if err != nil {
		t.Fatal(err)
	}
	vis := p.visibleSegmentFn([]string{"reader"})
	doc := map[string]any{
		"name": "x",
		"_meta": map[string]any{
			"authority": map[string]any{
				"hr/title":    map[string]any{"source": "hris"},
				"security/lv": map[string]any{"source": "api"},
			},
		},
	}
	got := FilterDocument(doc, vis)
	meta, ok := got["_meta"].(map[string]any)
	if !ok {
		t.Fatalf("expected _meta, got %#v", got)
	}
	auth, ok := meta["authority"].(map[string]any)
	if !ok {
		t.Fatal("expected authority in meta")
	}
	if auth["hr/title"] == nil {
		t.Fatal("expected hr path in authority")
	}
	if auth["security/lv"] != nil {
		t.Fatal("security path must be stripped from authority")
	}
}

func TestFilterSnapshot_roundTrip(t *testing.T) {
	p, err := ParsePolicy(`{"default":["r"],"hr":["r"]}`)
	if err != nil {
		t.Fatal(err)
	}
	s := profiles.Snapshot{
		EntityID:     "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
		EntityTypeID: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
		Version:      1,
		Document: map[string]any{
			"x": 1,
			"y": map[string]any{"z": 2},
		},
	}
	out := p.FilterSnapshot(s, []string{"other"})
	// нет совпадения ролей — default и hr не видны
	if len(out.Document) != 0 {
		t.Fatalf("expected empty doc, got %#v", out.Document)
	}
	out2 := p.FilterSnapshot(s, []string{"r"})
	if out2.Document["x"] == nil {
		t.Fatal("expected default field with matching role")
	}
}
