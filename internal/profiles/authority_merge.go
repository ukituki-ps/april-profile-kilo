package profiles

import (
	"strings"
)

func effectiveExistingSource(path string, auth map[string]string) string {
	s := strings.TrimSpace(auth[path])
	if s == "" {
		return "api"
	}
	return s
}

type conflictCandidate struct {
	namespace      string
	fieldKey       string
	existingValue  any
	incomingValue  any
	existingSource string
	incomingSource string
	reason         string
}

func splitNsField(path string) (namespace, fieldKey string) {
	ns, fk, ok := strings.Cut(path, "/")
	if !ok {
		return "default", path
	}
	if ns == "default" {
		return "default", fk
	}
	return ns, fk
}

// applyAuthorityToDocuments сливает incoming в current с правилами priority; возвращает новый документ (с _meta), кандидатов в конфликты и флаг изменения данных.
func applyAuthorityToDocuments(currentDoc, incomingDoc map[string]any, writeSource string) (map[string]any, []conflictCandidate, bool) {
	writeSource = strings.TrimSpace(writeSource)
	if writeSource == "" {
		writeSource = "api"
	}
	dataCur, metaCur := splitMeta(currentDoc)
	dataIn, _ := splitMeta(incomingDoc)

	flatCur := flattenDocument(dataCur)
	flatIn := flattenDocument(dataIn)

	metaNew := cloneMap(metaCur)
	authPaths := readAuthorityPaths(metaNew)

	newFlat := cloneMap(flatCur)
	changed := false
	var conflictCandidates []conflictCandidate

	for path, iv := range flatIn {
		ev, hasE := newFlat[path]
		es := effectiveExistingSource(path, authPaths)

		if !hasE {
			newFlat[path] = iv
			metaNew = setAuthorityPath(metaNew, path, writeSource)
			authPaths[path] = writeSource
			changed = true
			continue
		}

		apply, isConflict, reason := mergeFieldAuthority(path, ev, iv, es, writeSource)
		switch {
		case apply:
			newFlat[path] = iv
			metaNew = setAuthorityPath(metaNew, path, writeSource)
			authPaths[path] = writeSource
			changed = true
		case isConflict:
			ns, fk := splitNsField(path)
			conflictCandidates = append(conflictCandidates, conflictCandidate{
				namespace:      ns,
				fieldKey:       fk,
				existingValue:  ev,
				incomingValue:  iv,
				existingSource: es,
				incomingSource: writeSource,
				reason:         reason,
			})
		}
	}

	out := withMeta(unflattenDocument(newFlat), metaNew)
	return out, conflictCandidates, changed
}

// mergeDocumentsForDuplicate объединяет два профиля: на равном приоритете побеждает target.
func mergeDocumentsForDuplicate(targetDoc, sourceDoc map[string]any) map[string]any {
	dataT, metaT := splitMeta(targetDoc)
	dataS, metaS := splitMeta(sourceDoc)
	flatT := flattenDocument(dataT)
	flatS := flattenDocument(dataS)
	authT := readAuthorityPaths(metaT)
	authS := readAuthorityPaths(metaS)

	outFlat := cloneMap(flatT)
	metaOut := cloneMap(metaT)

	for path, sv := range flatS {
		if _, ok := outFlat[path]; !ok {
			outFlat[path] = sv
			src := effectiveExistingSource(path, authS)
			metaOut = setAuthorityPath(metaOut, path, src)
			continue
		}
		ts := effectiveExistingSource(path, authT)
		ss := effectiveExistingSource(path, authS)
		pt := priorityOf(ts)
		ps := priorityOf(ss)
		switch {
		case ps > pt:
			outFlat[path] = sv
			metaOut = setAuthorityPath(metaOut, path, ss)
		case ps < pt:
			// target wins, meta unchanged
		default:
			// tie -> target keeps value
		}
	}

	// переносим authority для путей только из target+source union
	return withMeta(unflattenDocument(outFlat), metaOut)
}
