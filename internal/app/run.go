// Package app — корень приложения: запуск без HTTP до задач health/OpenAPI (фаза 1).
package app

import (
	"context"
	"errors"
	"log/slog"

	"github.com/ukituki-ps/april-profile/internal/version"
)

// Run запускает процесс до отмены контекста (SIGINT/SIGTERM).
// Сейчас это заглушка: доменный API и middleware JWT — в последующих задачах фазы 1.
func Run(ctx context.Context) error {
	slog.Info("AprilProfile starting", "version", version.String())
	<-ctx.Done()
	slog.Info("AprilProfile shutdown complete")
	if err := ctx.Err(); errors.Is(err, context.Canceled) {
		return nil
	}
	return ctx.Err()
}
