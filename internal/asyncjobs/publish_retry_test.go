package asyncjobs

import (
	"testing"
	"time"
)

func TestOutboxPublishBackoff(t *testing.T) {
	t.Parallel()
	base := 100 * time.Millisecond
	if got := outboxPublishBackoff(1, base); got != base {
		t.Fatalf("attempt 1: want %v got %v", base, got)
	}
	if got := outboxPublishBackoff(2, base); got != 2*base {
		t.Fatalf("attempt 2: want %v got %v", 2*base, got)
	}
	if got := outboxPublishBackoff(3, base); got != 4*base {
		t.Fatalf("attempt 3: want %v got %v", 4*base, got)
	}
}

func TestOutboxPublishBackoff_capsAtFifteenMinutes(t *testing.T) {
	t.Parallel()
	base := time.Minute
	got := outboxPublishBackoff(30, base)
	if got != 15*time.Minute {
		t.Fatalf("want cap 15m, got %v", got)
	}
}

func TestSanitizePublishError(t *testing.T) {
	t.Parallel()
	if got := sanitizePublishError(nil); got != "" {
		t.Fatalf("nil: want empty, got %q", got)
	}
	err := errorString("hello\nworld\t")
	if got := sanitizePublishError(err); got != "hello world" {
		t.Fatalf("got %q", got)
	}
}

type errorString string

func (e errorString) Error() string { return string(e) }
