package auth

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"math/big"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestAudienceMatches(t *testing.T) {
	t.Parallel()
	want := "april-profile-api"
	cases := []struct {
		name   string
		claims jwt.MapClaims
		ok     bool
	}{
		{"azp", jwt.MapClaims{"azp": want}, true},
		{"aud string", jwt.MapClaims{"aud": want}, true},
		{"aud slice", jwt.MapClaims{"aud": []any{"account", want}}, true},
		{"wrong", jwt.MapClaims{"aud": "other"}, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			if got := audienceMatches(tc.claims, want); got != tc.ok {
				t.Fatalf("audienceMatches: got %v want %v", got, tc.ok)
			}
		})
	}
}

func TestValidateBearer_JWKS(t *testing.T) {
	t.Parallel()
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	kid := "unit-test-kid"
	jwksJSON := mustRSAJWKS(t, &priv.PublicKey, kid)

	const iss = "http://127.0.0.1:9999/auth/realms/april"
	const aud = "april-profile-api"

	v, err := NewValidatorFromJWKSJSON(jwksJSON, iss, aud, "tenant_id")
	if err != nil {
		t.Fatal(err)
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"iss":       iss,
		"sub":       "subject-1",
		"exp":       time.Now().Add(time.Hour).Unix(),
		"azp":       aud,
		"tenant_id": "11111111-1111-1111-1111-111111111111",
	})
	token.Header["kid"] = kid
	raw, err := token.SignedString(priv)
	if err != nil {
		t.Fatal(err)
	}

	sub, tenant, err := v.ValidateBearer(context.Background(), "Bearer "+raw)
	if err != nil {
		t.Fatal(err)
	}
	if sub != "subject-1" || tenant != "11111111-1111-1111-1111-111111111111" {
		t.Fatalf("unexpected sub/tenant: %q %q", sub, tenant)
	}

	_, _, err = v.ValidateBearer(context.Background(), "Bearer garbage")
	if err == nil {
		t.Fatal("expected error")
	}

	noTenant := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"iss": iss,
		"sub": "subject-2",
		"exp": time.Now().Add(time.Hour).Unix(),
		"azp": aud,
	})
	noTenant.Header["kid"] = kid
	raw2, err := noTenant.SignedString(priv)
	if err != nil {
		t.Fatal(err)
	}
	_, _, err = v.ValidateBearer(context.Background(), "Bearer "+raw2)
	if err == nil || !errors.Is(err, ErrMissingTenantClaim) {
		t.Fatalf("want ErrMissingTenantClaim, got %v", err)
	}
}

func mustRSAJWKS(t *testing.T, pub *rsa.PublicKey, kid string) []byte {
	t.Helper()
	n := base64.RawURLEncoding.EncodeToString(pub.N.Bytes())
	eBytes := big.NewInt(int64(pub.E)).Bytes()
	e := base64.RawURLEncoding.EncodeToString(eBytes)
	keys := map[string]any{
		"kty": "RSA",
		"kid": kid,
		"use": "sig",
		"alg": "RS256",
		"n":   n,
		"e":   e,
	}
	body := map[string]any{"keys": []map[string]any{keys}}
	b, err := json.Marshal(body)
	if err != nil {
		t.Fatal(err)
	}
	return b
}

func TestBearerToken(t *testing.T) {
	t.Parallel()
	raw, ok := bearerToken("Bearer abc")
	if !ok || raw != "abc" {
		t.Fatalf("got %q %v", raw, ok)
	}
	_, ok = bearerToken("")
	if ok {
		t.Fatal("expected false")
	}
	_, ok = bearerToken("Basic x")
	if ok {
		t.Fatal("expected false")
	}
}

func FuzzBearerToken(f *testing.F) {
	f.Add("Bearer x")
	f.Add("bearer x")
	f.Add("Bearer ")
	f.Fuzz(func(t *testing.T, s string) {
		_, _ = bearerToken(s)
	})
}
