// Package app — корень приложения: HTTP-сервер и graceful shutdown.
package app

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/ukituki-ps/april-profile/internal/auth"
	"github.com/ukituki-ps/april-profile/internal/config"
	"github.com/ukituki-ps/april-profile/internal/entitytypes"
	"github.com/ukituki-ps/april-profile/internal/httpapi"
	"github.com/ukituki-ps/april-profile/internal/profiles"
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

	dbPool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("pgxpool: %w", err)
	}
	defer dbPool.Close()

	var redisClient *redis.Client
	if cfg.RedisAddr != "" {
		redisClient = redis.NewClient(&redis.Options{
			Addr:     cfg.RedisAddr,
			Password: cfg.RedisPassword,
			DB:       cfg.RedisDB,
		})
		defer func() {
			_ = redisClient.Close()
		}()
	}

	readiness := &readinessChecker{
		dbPool:            dbPool,
		redisClient:       redisClient,
		timeout:           cfg.ReadinessTimeout,
		allowWithoutRedis: cfg.ReadyzAllowWithoutRedis,
	}
	catalog := entitytypes.NewCatalog(dbPool)
	profileService := profiles.NewService(dbPool)
	mux := httpapi.NewMux(v, readiness, catalog, profileService, slog.Default())
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

type readinessChecker struct {
	dbPool            *pgxpool.Pool
	redisClient       *redis.Client
	timeout           time.Duration
	allowWithoutRedis bool
}

func (c *readinessChecker) Check(ctx context.Context) httpapi.ReadinessResult {
	out := httpapi.ReadinessResult{}
	deadlineCtx, cancel := context.WithTimeout(ctx, c.timeout)
	defer cancel()

	if err := c.dbPool.Ping(deadlineCtx); err == nil {
		out.DatabaseOK = true
	}
	if c.redisClient == nil && c.allowWithoutRedis {
		out.RedisSkipped = true
		out.RedisOK = true
	} else if c.redisClient != nil {
		if err := c.redisClient.Ping(deadlineCtx).Err(); err == nil {
			out.RedisOK = true
		}
	}
	out.Ready = out.DatabaseOK && out.RedisOK
	return out
}
