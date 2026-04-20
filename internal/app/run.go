// Package app — корень приложения: HTTP-сервер и graceful shutdown.
package app

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/ukituki-ps/april-profile/internal/auth"
	"github.com/ukituki-ps/april-profile/internal/config"
	"github.com/ukituki-ps/april-profile/internal/httpapi"
	"github.com/ukituki-ps/april-profile/internal/version"
)

// Run запускает HTTP-сервер до отмены контекста (SIGINT/SIGTERM).
func Run(ctx context.Context) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	v, err := auth.NewValidator(ctx, cfg.KeycloakJWKSURL, cfg.KeycloakIssuer, cfg.KeycloakAudience, cfg.KeycloakTenantClaim)
	if err != nil {
		return fmt.Errorf("jwt validator: %w", err)
	}

	mux := httpapi.NewMux(v)
	srv := &http.Server{
		Addr:              cfg.HTTPListenAddr,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       60 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		slog.Info("AprilProfile HTTP listening", "addr", cfg.HTTPListenAddr, "version", version.String())
		errCh <- srv.ListenAndServe()
	}()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		if err := srv.Shutdown(shutdownCtx); err != nil {
			return fmt.Errorf("http shutdown: %w", err)
		}
		slog.Info("AprilProfile shutdown complete")
		if err := ctx.Err(); errors.Is(err, context.Canceled) {
			return nil
		}
		return ctx.Err()
	case err := <-errCh:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			return err
		}
		return nil
	}
}
