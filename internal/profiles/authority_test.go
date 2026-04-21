package profiles

import (
	"testing"
)

func TestPriorityOf_namedSources(t *testing.T) {
	t.Parallel()
	if priorityOf("hris") <= priorityOf("api") {
		t.Fatalf("hris should beat api")
	}
	if priorityOf("manual") <= priorityOf("hris") {
		t.Fatalf("manual should beat hris")
	}
}

func TestApplyAuthorityToDocuments_higherWins(t *testing.T) {
	t.Parallel()
	current := map[string]any{
		"name": "Alice",
		"_meta": map[string]any{
			"authority": map[string]any{
				"default/name": map[string]any{"source": "hris"},
			},
		},
	}
	incoming := map[string]any{"name": "Bob"}
	out, conflicts, changed := applyAuthorityToDocuments(current, incoming, "api")
	if changed {
		t.Fatalf("expected no change when api loses to hris")
	}
	if len(conflicts) != 1 {
		t.Fatalf("expected 1 conflict, got %d", len(conflicts))
	}
	_ = out
}

func TestApplyAuthorityToDocuments_incomingBeats(t *testing.T) {
	t.Parallel()
	current := map[string]any{
		"name": "Alice",
		"_meta": map[string]any{
			"authority": map[string]any{
				"default/name": map[string]any{"source": "api"},
			},
		},
	}
	incoming := map[string]any{"name": "Bob"}
	out, conflicts, changed := applyAuthorityToDocuments(current, incoming, "hris")
	if !changed {
		t.Fatal("expected change")
	}
	if len(conflicts) != 0 {
		t.Fatalf("unexpected conflicts: %v", conflicts)
	}
	if out["name"] != "Bob" {
		t.Fatalf("want Bob, got %v", out["name"])
	}
}

func TestApplyAuthorityToDocuments_sameSourceOverwrites(t *testing.T) {
	t.Parallel()
	current := map[string]any{
		"name": "Alice",
		"_meta": map[string]any{
			"authority": map[string]any{
				"default/name": map[string]any{"source": "api"},
			},
		},
	}
	incoming := map[string]any{"name": "Bob"}
	out, conflicts, changed := applyAuthorityToDocuments(current, incoming, "api")
	if !changed {
		t.Fatal("expected overwrite for same source")
	}
	if len(conflicts) != 0 {
		t.Fatalf("unexpected conflicts: %v", conflicts)
	}
	if out["name"] != "Bob" {
		t.Fatalf("got %v", out["name"])
	}
}

func TestMergeDocumentsForDuplicate_tieKeepsTarget(t *testing.T) {
	t.Parallel()
	target := map[string]any{
		"x": 1,
		"_meta": map[string]any{
			"authority": map[string]any{
				"default/x": map[string]any{"source": "api"},
			},
		},
	}
	source := map[string]any{
		"x": 2,
		"_meta": map[string]any{
			"authority": map[string]any{
				"default/x": map[string]any{"source": "api"},
			},
		},
	}
	out := mergeDocumentsForDuplicate(target, source)
	if out["x"] != float64(1) && out["x"] != 1 {
		t.Fatalf("on tie target wins, got %v", out["x"])
	}
}
