// Package main — точка входа сервиса AprilProfile (модульный монолит).
package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/ukituki-ps/april-profile/internal/app"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := app.Run(ctx); err != nil {
		slog.Error("april-profile stopped", "err", err)
		os.Exit(1)
	}
}
