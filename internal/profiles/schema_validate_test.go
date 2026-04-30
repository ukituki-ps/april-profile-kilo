package profiles

import (
	"errors"
	"testing"
)

func TestValidateDocumentAgainstSchema_ok(t *testing.T) {
	t.Parallel()
	schema := map[string]any{
		"type": "object",
		"properties": map[string]any{
			"name": map[string]any{"type": "string"},
		},
		"required": []any{"name"},
	}
	doc := map[string]any{"name": "Ann"}
	if err := ValidateDocumentAgainstSchema(schema, doc); err != nil {
		t.Fatal(err)
	}
}

func TestValidateDocumentAgainstSchema_returnsSchemaValidationError(t *testing.T) {
	t.Parallel()
	schema := map[string]any{
		"type": "object",
		"properties": map[string]any{
			"name": map[string]any{"type": "string"},
		},
		"required": []any{"name"},
	}
	doc := map[string]any{"name": 3}
	err := ValidateDocumentAgainstSchema(schema, doc)
	if err == nil {
		t.Fatal("expected error")
	}
	var sve *SchemaValidationError
	if !errors.As(err, &sve) {
		t.Fatalf("want SchemaValidationError, got %T %v", err, err)
	}
	if len(sve.Issues) == 0 {
		t.Fatalf("expected issues: %#v", sve)
	}
}
