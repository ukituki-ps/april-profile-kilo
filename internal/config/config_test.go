package config

import "testing"

func TestLoad_requiresDatabaseURL(t *testing.T) {
	t.Setenv("KEYCLOAK_JWKS_URL", "http://kc/certs")
	t.Setenv("KEYCLOAK_ISSUER", "http://kc/issuer")
	t.Setenv("KEYCLOAK_AUDIENCE", "april-profile-api")
	t.Setenv("REDIS_ADDR", "127.0.0.1:6379")

	_, err := Load()
	if err == nil {
		t.Fatal("expected error when DATABASE_URL is missing")
	}
}

func TestLoad_allowsMissingRedisWhenFeatureFlagEnabled(t *testing.T) {
	t.Setenv("KEYCLOAK_JWKS_URL", "http://kc/certs")
	t.Setenv("KEYCLOAK_ISSUER", "http://kc/issuer")
	t.Setenv("KEYCLOAK_AUDIENCE", "april-profile-api")
	t.Setenv("DATABASE_URL", "postgres://april:april@127.0.0.1:5432/april_profile?sslmode=disable")
	t.Setenv("READYZ_ALLOW_WITHOUT_REDIS", "true")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected load error: %v", err)
	}
	if !cfg.ReadyzAllowWithoutRedis {
		t.Fatal("expected ReadyzAllowWithoutRedis=true")
	}
}
