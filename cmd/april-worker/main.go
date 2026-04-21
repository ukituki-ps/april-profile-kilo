// Package main — фоновый воркер Asynq (ping, обработка profile_outbox).
package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/ukituki-ps/april-profile/internal/workerapp"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := workerapp.Run(ctx); err != nil {
		slog.Error("april-worker stopped", "err", err)
		os.Exit(1)
	}
}
