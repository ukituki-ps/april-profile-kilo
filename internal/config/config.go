// Package config загружает конфигурацию сервиса из переменных окружения.
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config — минимальная конфигурация HTTP и Keycloak JWT для фазы 1.
type Config struct {
	HTTPListenAddr string

	KeycloakJWKSURL     string
	KeycloakIssuer      string
	KeycloakAudience    string
	KeycloakTenantClaim string

	DatabaseURL             string
	RedisAddr               string
	RedisPassword           string
	RedisDB                 int
	ReadinessTimeout        time.Duration
	ReadyzAllowWithoutRedis bool
}

// Load читает переменные окружения. Поля Keycloak обязательны для валидации JWT на защищённых маршрутах.
func Load() (Config, error) {
	redisDB, err := intFromEnv("REDIS_DB", 0)
	if err != nil {
		return Config{}, err
	}
	readinessTimeout, err := durationFromEnv("READINESS_TIMEOUT", 3*time.Second)
	if err != nil {
		return Config{}, err
	}
	allowWithoutRedis, err := boolFromEnv("READYZ_ALLOW_WITHOUT_REDIS", false)
	if err != nil {
		return Config{}, err
	}

	cfg := Config{
		HTTPListenAddr:          strings.TrimSpace(os.Getenv("HTTP_LISTEN_ADDR")),
		KeycloakJWKSURL:         strings.TrimSpace(os.Getenv("KEYCLOAK_JWKS_URL")),
		KeycloakIssuer:          strings.TrimSpace(os.Getenv("KEYCLOAK_ISSUER")),
		KeycloakAudience:        strings.TrimSpace(os.Getenv("KEYCLOAK_AUDIENCE")),
		KeycloakTenantClaim:     strings.TrimSpace(os.Getenv("KEYCLOAK_TENANT_CLAIM")),
		DatabaseURL:             strings.TrimSpace(os.Getenv("DATABASE_URL")),
		RedisAddr:               strings.TrimSpace(os.Getenv("REDIS_ADDR")),
		RedisPassword:           os.Getenv("REDIS_PASSWORD"),
		RedisDB:                 redisDB,
		ReadinessTimeout:        readinessTimeout,
		ReadyzAllowWithoutRedis: allowWithoutRedis,
	}
	if cfg.HTTPListenAddr == "" {
		cfg.HTTPListenAddr = ":8080"
	}
	if cfg.KeycloakTenantClaim == "" {
		cfg.KeycloakTenantClaim = "tenant_id"
	}
	if cfg.KeycloakJWKSURL == "" || cfg.KeycloakIssuer == "" || cfg.KeycloakAudience == "" {
		return Config{}, fmt.Errorf("config: требуются KEYCLOAK_JWKS_URL, KEYCLOAK_ISSUER и KEYCLOAK_AUDIENCE")
	}
	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("config: требуется DATABASE_URL")
	}
	if cfg.RedisAddr == "" && !cfg.ReadyzAllowWithoutRedis {
		return Config{}, fmt.Errorf("config: требуется REDIS_ADDR или READYZ_ALLOW_WITHOUT_REDIS=true")
	}
	return cfg, nil
}

func intFromEnv(name string, defaultValue int) (int, error) {
	raw := strings.TrimSpace(os.Getenv(name))
	if raw == "" {
		return defaultValue, nil
	}
	value, err := strconv.Atoi(raw)
	if err != nil {
		return 0, fmt.Errorf("config: %s must be int: %w", name, err)
	}
	return value, nil
}

func durationFromEnv(name string, defaultValue time.Duration) (time.Duration, error) {
	raw := strings.TrimSpace(os.Getenv(name))
	if raw == "" {
		return defaultValue, nil
	}
	value, err := time.ParseDuration(raw)
	if err != nil {
		return 0, fmt.Errorf("config: %s must be duration (e.g. 3s): %w", name, err)
	}
	return value, nil
}

func boolFromEnv(name string, defaultValue bool) (bool, error) {
	raw := strings.TrimSpace(os.Getenv(name))
	if raw == "" {
		return defaultValue, nil
	}
	value, err := strconv.ParseBool(raw)
	if err != nil {
		return false, fmt.Errorf("config: %s must be bool: %w", name, err)
	}
	return value, nil
}
