// Package abac — фильтрация выдачи профиля по сегментам полей (namespace верхнего уровня документа)
// на основе realm-ролей из Keycloak. Политика задаётся конфигом (см. ParsePolicy).
package abac

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/ukituki-ps/april-profile/internal/profiles"
)

const metaKey = "_meta"

// Policy описывает, какие realm-роли открывают доступ к сегменту полей.
// Сегмент — это либо имя namespace (вложенный объект в документе), либо "default" для
// корневых скалярных полей (см. internal/profiles/document_paths.go).
// Сегмент виден вызывающему, если у него есть хотя бы одна роль из списка для этого сегмента.
// Сегменты, отсутствующие в политике, при активной политике не выдаются.
type Policy struct {
	segmentRoles map[string][]string
}

// ParsePolicy разбирает JSON из переменной окружения. Пустая строка — политика выключена (nil, nil).
// Формат: объект «сегмент» -> массив имён realm-ролей.
//
//	{"default":["april-profile-reader"],"hr":["april-profile-reader"],"security":["april-profile-security"]}
func ParsePolicy(raw string) (*Policy, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, nil
	}
	var m map[string][]string
	if err := json.Unmarshal([]byte(raw), &m); err != nil {
		return nil, fmt.Errorf("abac policy json: %w", err)
	}
	if len(m) == 0 {
		return nil, nil
	}
	// нормализуем ключи сегментов и роли
	out := make(map[string][]string, len(m))
	for seg, roles := range m {
		seg = strings.TrimSpace(seg)
		if seg == "" {
			continue
		}
		norm := make([]string, 0, len(roles))
		for _, r := range roles {
			r = strings.TrimSpace(r)
			if r != "" {
				norm = append(norm, r)
			}
		}
		out[seg] = norm
	}
	if len(out) == 0 {
		return nil, nil
	}
	return &Policy{segmentRoles: out}, nil
}

// Active сообщает, нужно ли применять фильтрацию.
func (p *Policy) Active() bool {
	return p != nil && len(p.segmentRoles) > 0
}

// FilterSnapshot оставляет в document (и в _meta.authority) только разрешённые сегменты.
// Остальные поля снимка не меняются.
func (p *Policy) FilterSnapshot(snap profiles.Snapshot, realmRoles []string) profiles.Snapshot {
	if p == nil || len(p.segmentRoles) == 0 {
		return snap
	}
	snap.Document = FilterDocument(snap.Document, p.visibleSegmentFn(realmRoles))
	return snap
}

func (p *Policy) visibleSegmentFn(realmRoles []string) func(string) bool {
	roleSet := make(map[string]struct{}, len(realmRoles))
	for _, r := range realmRoles {
		r = strings.TrimSpace(r)
		if r != "" {
			roleSet[r] = struct{}{}
		}
	}
	return func(segment string) bool {
		segment = strings.TrimSpace(segment)
		need, ok := p.segmentRoles[segment]
		if !ok || len(need) == 0 {
			return false
		}
		for _, r := range need {
			if _, ok := roleSet[r]; ok {
				return true
			}
		}
		return false
	}
}

// FilterDocument копирует документ, оставляя только сегменты, для которых visible возвращает true.
// Всегда возвращает не-nil map (может быть пустой).
func FilterDocument(doc map[string]any, visible func(segment string) bool) map[string]any {
	if doc == nil {
		return map[string]any{}
	}
	if visible == nil {
		return cloneJSONMap(doc)
	}
	out := make(map[string]any)
	for k, v := range doc {
		if k == metaKey {
			continue
		}
		switch t := v.(type) {
		case map[string]any:
			if visible(k) {
				out[k] = cloneJSONMap(t)
			}
		default:
			if visible("default") {
				out[k] = v
			}
		}
	}
	if rawMeta, ok := doc[metaKey].(map[string]any); ok {
		if fm := filterMeta(rawMeta, visible); len(fm) > 0 {
			out[metaKey] = fm
		}
	}
	return out
}

func filterMeta(meta map[string]any, visible func(string) bool) map[string]any {
	authRoot, ok := meta["authority"].(map[string]any)
	if !ok {
		// при активной ABAC не пробрасываем неизвестные ключи _meta (только authority фильтруется)
		return nil
	}
	filteredAuth := make(map[string]any)
	for path, entry := range authRoot {
		seg := segmentFromPath(path)
		if visible(seg) {
			filteredAuth[path] = entry
		}
	}
	if len(filteredAuth) == 0 {
		return nil
	}
	return map[string]any{"authority": filteredAuth}
}

func segmentFromPath(path string) string {
	path = strings.TrimSpace(path)
	ns, _, ok := strings.Cut(path, "/")
	if !ok || ns == "" {
		return "default"
	}
	return ns
}

func cloneJSONMap(m map[string]any) map[string]any {
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
