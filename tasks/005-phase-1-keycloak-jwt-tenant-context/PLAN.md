# План: JWT Keycloak и `tenant_id` из доверенного контекста

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-20
- **Статус плана:** согласован

## Исходные допущения

- Access token Keycloak подписан RS256; JWKS доступен по `KEYCLOAK_JWKS_URL`.
- `iss` в токене совпадает с `KEYCLOAK_ISSUER` (см. [`docs/keycloak-stand-coordinates.md`](../../docs/keycloak-stand-coordinates.md)).
- Аудитория проверяется как `aud` или `azp` относительно `KEYCLOAK_AUDIENCE` (клиент resource server `april-profile-api` по [`docs/guides/PROJECT_DEFAULTS.md`](../../docs/guides/PROJECT_DEFAULTS.md)).
- Источник `tenant_id` для API — **claim в access token** (имя по умолчанию `tenant_id`, mapper в Keycloak); заголовок BFF не используется в этой итерации (фиксируется в отчёте).

## Порядок работ (шаги)

1. Конфигурация env (`internal/config`): `HTTP_LISTEN_ADDR`, `KEYCLOAK_*`, `KEYCLOAK_TENANT_CLAIM`.
2. Валидатор JWT + JWKS (`internal/auth`): `github.com/golang-jwt/jwt/v5`, `github.com/MicahParks/keyfunc/v3`.
3. Request context с `sub` и `tenant_id`; middleware для защищённых маршрутов.
4. HTTP-маршруты (`internal/httpapi`): публичный `GET /v1/system/ping`, защищённый `GET /v1/auth/whoami`.
5. Запуск сервера и graceful shutdown в `internal/app`.
6. Юнит-тесты с локальным JWKS (RSA) и проверкой игнорирования `?tenant_id` в whoami.
7. Документация: README, OpenAPI, `.env.example`; отчёт `REPORT.md`.

## Затрагиваемые области

| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | `internal/config`, `internal/auth`, `internal/httpapi`, `internal/app` |
| Frontend | нет |
| БД / Atlas | нет |
| Инфра / Compose | нет (env-переменные в `.env.example`) |
| Документация / OpenAPI | `README.md`, `openapi/openapi.yaml`, `.env.example` |

## Риски и откат

- **Риск:** рассинхрон `iss` и фактического `iss` в токене → **Митигация:** брать `iss` из декодированного токена на стенде, см. keycloak-stand-coordinates.
- **Риск:** недоступность JWKS при старте → клиент `keyfunc` обновляет ключи в фоне; первый запрос может завершиться ошибкой до успешной загрузки.
- Откат: вернуть предыдущий коммит / отключить защищённые маршруты не предусмотрено без нового PR (ослабление JWT без feature-flag не делаем).

## Проверка после выполнения

- `go vet ./...`, `go test ./...`
- `make openapi-lint`, `make docs-build`

## Примечания

- Связанные документы: ADR-0002 (мультитенантность), [`docs/auth-jwt-keycloak-adapted.md`](../../docs/auth-jwt-keycloak-adapted.md).
- Smoke на стенде Hub с реальным Keycloak — опционально по `TASK.md`.
