package httpapi

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"io"
	"math/big"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/ukituki-ps/april-profile/internal/auth"
)

func TestWhoAmI_requiresJWT(t *testing.T) {
	t.Parallel()
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	kid := "kid-whoami"
	jwks := mustRSAJWKS(t, &priv.PublicKey, kid)
	const iss = "http://kc.example/auth/realms/april"
	const aud = "april-profile-api"
	v, err := auth.NewValidatorFromJWKSJSON(jwks, iss, aud, "tenant_id")
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(NewMux(v))
	t.Cleanup(ts.Close)

	res, err := ts.Client().Get(ts.URL + "/v1/auth/whoami")
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status: %d", res.StatusCode)
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"iss":       iss,
		"sub":       "user-42",
		"exp":       time.Now().Add(time.Hour).Unix(),
		"azp":       aud,
		"tenant_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
	})
	token.Header["kid"] = kid
	raw, err := token.SignedString(priv)
	if err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, ts.URL+"/v1/auth/whoami?tenant_id=evil-tenant", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+raw)

	res2, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res2.Body.Close()
	if res2.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(res2.Body)
		t.Fatalf("status %d body %s", res2.StatusCode, body)
	}
	body, err := io.ReadAll(res2.Body)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(body), "evil-tenant") {
		t.Fatalf("untrusted tenant_id must not appear: %s", body)
	}
	if !strings.Contains(string(body), "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") {
		t.Fatalf("expected trusted tenant in body: %s", body)
	}
}

func TestWhoAmI_missingTenantClaim_returns403(t *testing.T) {
	t.Parallel()
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	kid := "kid-no-tenant"
	jwks := mustRSAJWKS(t, &priv.PublicKey, kid)
	const iss = "http://kc.example/auth/realms/april"
	const aud = "april-profile-api"
	v, err := auth.NewValidatorFromJWKSJSON(jwks, iss, aud, "tenant_id")
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(NewMux(v))
	t.Cleanup(ts.Close)

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"iss": iss,
		"sub": "user-x",
		"exp": time.Now().Add(time.Hour).Unix(),
		"azp": aud,
	})
	token.Header["kid"] = kid
	raw, err := token.SignedString(priv)
	if err != nil {
		t.Fatal(err)
	}
	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, ts.URL+"/v1/auth/whoami", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+raw)
	res, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusForbidden {
		body, _ := io.ReadAll(res.Body)
		t.Fatalf("want 403, got %d: %s", res.StatusCode, body)
	}
}

func mustRSAJWKS(t *testing.T, pub *rsa.PublicKey, kid string) []byte {
	t.Helper()
	n := base64.RawURLEncoding.EncodeToString(pub.N.Bytes())
	e := base64.RawURLEncoding.EncodeToString(big.NewInt(int64(pub.E)).Bytes())
	key := map[string]any{
		"kty": "RSA",
		"kid": kid,
		"use": "sig",
		"alg": "RS256",
		"n":   n,
		"e":   e,
	}
	out, err := json.Marshal(map[string]any{"keys": []map[string]any{key}})
	if err != nil {
		t.Fatal(err)
	}
	return out
}
