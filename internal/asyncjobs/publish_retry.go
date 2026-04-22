package asyncjobs

import (
	"strings"
	"time"
	"unicode/utf8"
)

const maxPublishErrorRunes = 512

// outboxPublishBackoff возвращает задержку перед следующей попыткой после attempt-го сбоя (attempt ≥ 1).
func outboxPublishBackoff(attempt int, base time.Duration) time.Duration {
	if base <= 0 {
		base = time.Second
	}
	if attempt < 1 {
		attempt = 1
	}
	exp := attempt - 1
	if exp > 16 {
		exp = 16
	}
	d := base
	for i := 0; i < exp; i++ {
		next := d * 2
		if next < d { // overflow
			return 15 * time.Minute
		}
		d = next
		if d > 15*time.Minute {
			return 15 * time.Minute
		}
	}
	if d > 15*time.Minute {
		return 15 * time.Minute
	}
	return d
}

// sanitizePublishError укорачивает текст ошибки и убирает переводы строк (без payload из JSON).
func sanitizePublishError(err error) string {
	if err == nil {
		return ""
	}
	s := strings.Map(func(r rune) rune {
		if r == '\n' || r == '\r' || r == '\t' {
			return ' '
		}
		return r
	}, err.Error())
	s = strings.TrimSpace(s)
	if s == "" {
		return "publish_error"
	}
	if utf8.RuneCountInString(s) > maxPublishErrorRunes {
		s = string([]rune(s)[:maxPublishErrorRunes])
	}
	return s
}
