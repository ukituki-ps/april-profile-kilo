package profiles

import (
	"encoding/json"
	"strings"
)

const metaKey = "_meta"

// flattenDocument раскладывает документ профиля в плоский map path -> значение.
// path: "namespace/field"; плоские ключи становятся "default/name".
func flattenDocument(doc map[string]any) map[string]any {
	if doc == nil {
		return map[string]any{}
	}
	out := make(map[string]any)
	for k, v := range doc {
		if k == metaKey {
			continue
		}
		switch t := v.(type) {
		case map[string]any:
			for fk, fv := range t {
				path := k + "/" + fk
				out[path] = fv
			}
		default:
			out["default/"+k] = v
		}
	}
	return out
}

func unflattenDocument(flat map[string]any) map[string]any {
	if len(flat) == 0 {
		return map[string]any{}
	}
	out := make(map[string]any)
	for path, v := range flat {
		ns, field, ok := strings.Cut(path, "/")
		if !ok || field == "" {
			continue
		}
		if ns == "default" {
			out[field] = v
			continue
		}
		bucket, ok := out[ns].(map[string]any)
		if !ok {
			bucket = map[string]any{}
			out[ns] = bucket
		}
		bucket[field] = v
	}
	return out
}

func cloneMap(m map[string]any) map[string]any {
	if m == nil {
		return map[string]any{}
	}
	b, err := json.Marshal(m)
	if err != nil {
		return map[string]any{}
	}
	var out map[string]any
	if err := json.Unmarshal(b, &out); err != nil {
		return map[string]any{}
	}
	return out
}

func splitMeta(doc map[string]any) (data map[string]any, meta map[string]any) {
	if doc == nil {
		return map[string]any{}, nil
	}
	raw := cloneMap(doc)
	m, ok := raw[metaKey].(map[string]any)
	if !ok {
		return raw, nil
	}
	delete(raw, metaKey)
	return raw, m
}

func withMeta(data map[string]any, meta map[string]any) map[string]any {
	out := cloneMap(data)
	if meta == nil || len(meta) == 0 {
		return out
	}
	out[metaKey] = meta
	return out
}

// readAuthorityPaths возвращает карту path -> source (пустая строка если нет).
func readAuthorityPaths(meta map[string]any) map[string]string {
	if meta == nil {
		return map[string]string{}
	}
	authRoot, ok := meta["authority"].(map[string]any)
	if !ok {
		return map[string]string{}
	}
	out := make(map[string]string)
	for path, raw := range authRoot {
		entry, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		s, _ := entry["source"].(string)
		out[path] = strings.TrimSpace(s)
	}
	return out
}

func setAuthorityPath(meta map[string]any, path, source string) map[string]any {
	if meta == nil {
		meta = map[string]any{}
	}
	authRoot, ok := meta["authority"].(map[string]any)
	if !ok {
		authRoot = map[string]any{}
		meta["authority"] = authRoot
	}
	authRoot[path] = map[string]any{
		"source": strings.TrimSpace(source),
	}
	return meta
}
