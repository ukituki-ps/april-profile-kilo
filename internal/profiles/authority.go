package profiles

import (
	"encoding/json"
	"strings"
)

// Временная политика приоритетов источников (до подключения внешних authority).
// Больше число — сильнее источник.
var sourcePriority = map[string]int{
	"manual":   1000,
	"hris":     400,
	"crm":      350,
	"ad":       300,
	"import":   200,
	"api":      100,
	"sync":     80,
	"internal": 50,
}

func priorityOf(source string) int {
	s := strings.TrimSpace(strings.ToLower(source))
	if s == "" {
		return sourcePriority["api"]
	}
	if p, ok := sourcePriority[s]; ok {
		return p
	}
	return 30 // неизвестный внешний код — ниже именованных
}

// mergeFieldAuthority решает, можно ли применить входящее значение.
// Возвращает apply=true если новое значение нужно записать; conflict описывает запись в очередь.
func mergeFieldAuthority(path, existingValue, incomingValue any, existingSource, incomingSource string) (apply bool, conflict bool, reason string) {
	if jsonEqual(existingValue, incomingValue) {
		return false, false, ""
	}
	ex := strings.TrimSpace(strings.ToLower(existingSource))
	in := strings.TrimSpace(strings.ToLower(incomingSource))
	if ex != "" && ex == in {
		// Тот же логический источник — последняя запись побеждает (не путать с разными внешними системами).
		return true, false, ""
	}
	pIn := priorityOf(incomingSource)
	pEx := priorityOf(existingSource)
	switch {
	case pIn > pEx:
		return true, false, ""
	case pIn < pEx:
		return false, true, "incoming source has lower priority than existing"
	default:
		return false, true, "same priority and different values from different sources"
	}
}

func jsonEqual(a, b any) bool {
	ba, err := json.Marshal(a)
	if err != nil {
		return false
	}
	bb, err := json.Marshal(b)
	if err != nil {
		return false
	}
	return string(ba) == string(bb)
}
