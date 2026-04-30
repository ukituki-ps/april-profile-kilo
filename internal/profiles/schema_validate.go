package profiles

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/santhosh-tekuri/jsonschema/v6"
)

// SchemaValidationIssue — элемент отчёта 422 при несоответствии документа JSON Schema.
type SchemaValidationIssue struct {
	Path    string `json:"path"`
	Message string `json:"message"`
}

// SchemaValidationError агрегирует ошибки валидации документа по схеме ревизии типа.
type SchemaValidationError struct {
	Issues []SchemaValidationIssue `json:"issues"`
}

func (e *SchemaValidationError) Error() string {
	if e == nil || len(e.Issues) == 0 {
		return "document failed json schema validation"
	}
	var b strings.Builder
	b.WriteString("document failed json schema validation: ")
	for i, it := range e.Issues {
		if i > 0 {
			b.WriteString("; ")
		}
		b.WriteString(it.Path)
		b.WriteString(": ")
		b.WriteString(it.Message)
	}
	return b.String()
}

const inlineSchemaResourceURL = "https://april-profile.invalid/schemas/entity-profile-instance.json"

// ValidateDocumentAgainstSchema проверяет документ экземпляра профиля по JSON Schema ревизии типа.
func ValidateDocumentAgainstSchema(schema map[string]any, document map[string]any) error {
	if schema == nil {
		return fmt.Errorf("schema is nil")
	}
	schemaBytes, err := json.Marshal(schema)
	if err != nil {
		return fmt.Errorf("marshal schema: %w", err)
	}
	docBytes, err := json.Marshal(document)
	if err != nil {
		return fmt.Errorf("marshal document: %w", err)
	}

	schemaDoc, err := jsonschema.UnmarshalJSON(bytes.NewReader(schemaBytes))
	if err != nil {
		return fmt.Errorf("parse schema json: %w", err)
	}
	instance, err := jsonschema.UnmarshalJSON(bytes.NewReader(docBytes))
	if err != nil {
		return fmt.Errorf("parse document json: %w", err)
	}

	c := jsonschema.NewCompiler()
	if err := c.AddResource(inlineSchemaResourceURL, schemaDoc); err != nil {
		return fmt.Errorf("register schema: %w", err)
	}
	sch, err := c.Compile(inlineSchemaResourceURL)
	if err != nil {
		return fmt.Errorf("compile schema: %w", err)
	}
	if err := sch.Validate(instance); err != nil {
		var ve *jsonschema.ValidationError
		if errors.As(err, &ve) {
			return &SchemaValidationError{Issues: flattenValidationError(ve)}
		}
		return fmt.Errorf("validate: %w", err)
	}
	return nil
}

func flattenValidationError(root *jsonschema.ValidationError) []SchemaValidationIssue {
	if root == nil {
		return nil
	}
	var out []SchemaValidationIssue
	var walk func(e *jsonschema.ValidationError)
	walk = func(e *jsonschema.ValidationError) {
		if e == nil {
			return
		}
		if len(e.Causes) == 0 {
			path := jsonPointerFromTokens(e.InstanceLocation)
			msg := e.Error()
			out = append(out, SchemaValidationIssue{Path: path, Message: strings.TrimSpace(msg)})
			return
		}
		for _, c := range e.Causes {
			walk(c)
		}
	}
	walk(root)
	if len(out) == 0 {
		out = append(out, SchemaValidationIssue{Path: "", Message: strings.TrimSpace(root.Error())})
	}
	return out
}

func jsonPointerFromTokens(tokens []string) string {
	if len(tokens) == 0 {
		return ""
	}
	var b strings.Builder
	for _, tok := range tokens {
		b.WriteByte('/')
		b.WriteString(jsonPointerEscape(tok))
	}
	return b.String()
}

func jsonPointerEscape(s string) string {
	s = strings.ReplaceAll(s, "~", "~0")
	s = strings.ReplaceAll(s, "/", "~1")
	return s
}
