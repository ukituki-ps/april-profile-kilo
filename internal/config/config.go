// Package config загружает конфигурацию сервиса из переменных окружения.
package config

import (
	"fmt"
	"os"
	"strings"
)

// Config — минимальная конфигурация HTTP и Keycloak JWT для фазы 1.
type Config struct {
	HTTPListenAddr string

	KeycloakJWKSURL    string
	KeycloakIssuer     string
	KeycloakAudience   string
	KeycloakTenantClaim string
}

// Load читает переменные окружения. Поля Keycloak обязательны для валидации JWT на защищённых маршрутах.
func Load() (Config, error) {
	cfg := Config{
		HTTPListenAddr:      strings.TrimSpace(os.Getenv("HTTP_LISTEN_ADDR")),
		KeycloakJWKSURL:     strings.TrimSpace(os.Getenv("KEYCLOAK_JWKS_URL")),
		KeycloakIssuer:      strings.TrimSpace(os.Getenv("KEYCLOAK_ISSUER")),
		KeycloakAudience:    strings.TrimSpace(os.Getenv("KEYCLOAK_AUDIENCE")),
		KeycloakTenantClaim: strings.TrimSpace(os.Getenv("KEYCLOAK_TENANT_CLAIM")),
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
	return cfg, nil
}
