# Dev smoke: AprilHub BFF -> AprilProfile (локальный proxy)

Гайд фиксирует минимальную проверку контракта из задачи `020`: путь `/admin/profile/api/v1/...`,
передача `Authorization` и отсутствие tenant из недоверенных источников.

## Предпосылки

- Запущен AprilProfile локально, например `go run ./cmd/april-profile` (по умолчанию `http://127.0.0.1:8080`).
- Есть валидный access token Keycloak с `tenant_id` claim.

## 1) Запустить временный nginx reverse proxy

```bash
docker rm -f profile-bff-smoke-nginx >/dev/null 2>&1 || true
docker run --name profile-bff-smoke-nginx --rm -d -p 18080:80 \
  -v "$PWD/docs/guides/nginx.profile-bff-smoke.conf:/etc/nginx/conf.d/default.conf:ro" \
  nginx:1.27-alpine
```

Прокси-путь:
- вход: `http://127.0.0.1:18080/admin/profile/api/v1/...`
- выход: `http://host.docker.internal:8080/api/v1/...`

## 2) Проверить публичный ping через префикс BFF

```bash
curl -sS http://127.0.0.1:18080/admin/profile/api/v1/system/ping
```

Ожидаемо: `{"status":"ok"}`.

## 3) Проверить защищённый endpoint через тот же префикс

```bash
export TOKEN="<access_token_with_tenant_claim>"
curl -sS \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Forwarded-Proto: https" \
  -H "X-Forwarded-Host: dev.april.local" \
  http://127.0.0.1:18080/admin/profile/api/v1/auth/whoami
```

Ожидаемо: `200` и JSON с `sub` и `tenant_id`.

## 4) Негативная проверка: tenant в query не должен влиять

```bash
curl -sS \
  -H "Authorization: Bearer ${TOKEN}" \
  "http://127.0.0.1:18080/admin/profile/api/v1/auth/whoami?tenant_id=fake-tenant"
```

Ожидаемо: `tenant_id` в ответе остаётся из JWT claim, не из query.

## 5) Остановить proxy

```bash
docker rm -f profile-bff-smoke-nginx
```
