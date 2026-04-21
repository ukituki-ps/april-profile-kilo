package entitytypes

import (
	"fmt"
)

// ValidateSchemaForPublication проверяет минимальные инварианты схемы типа перед publish.
func ValidateSchemaForPublication(schema map[string]any) error {
	if schema == nil {
		return fmt.Errorf("schema must be object")
	}

	rawType, ok := schema["type"].(string)
	if !ok || rawType != "object" {
		return fmt.Errorf("schema.type must be 'object'")
	}

	properties, ok := schema["properties"].(map[string]any)
	if !ok || len(properties) == 0 {
		return fmt.Errorf("schema.properties must be non-empty object")
	}

	if required, exists := schema["required"]; exists {
		requiredItems, ok := required.([]any)
		if !ok {
			return fmt.Errorf("schema.required must be array of property names")
		}
		for _, item := range requiredItems {
			name, ok := item.(string)
			if !ok {
				return fmt.Errorf("schema.required must contain only strings")
			}
			if _, exists := properties[name]; !exists {
				return fmt.Errorf("schema.required references unknown property '%s'", name)
			}
		}
	}

	return nil
}
