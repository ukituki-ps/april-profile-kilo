## 1) Итого

- Статус: ✅ выполнено
- Задача: Фаза 1 (2/6) — валидация JWT Keycloak и `tenant_id` только из доверенного контекста
- Ветка: `feature/phase-1-jwt-tenant-context` (после merge — `develop`)
- Коммиты: `ed27da0` (feature commit), merge в `develop`: `2b0c7d5f29100ef6bbf6ac2cea38a508d207e656`
- PR: https://github.com/ukituki-ps/april-profile/pull/5

## 2) Что сделано

- **[backend]** Конфигурация из env: `HTTP_LISTEN_ADDR` (по умолчанию `:8080`), `KEYCLOAK_JWKS_URL`, `KEYCLOAK_ISSUER`, `KEYCLOAK_AUDIENCE`, `KEYCLOAK_TENANT_CLAIM` (по умолчанию `tenant_id`).
- **[backend]** Валидация access token: подпись по JWKS (`keyfunc`), проверка `iss`, срока, `aud` или `azp` против `KEYCLOAK_AUDIENCE`, обязательные `sub` и claim тенанта.
- **[backend]** Контекст запроса: `sub` и `tenant_id` только после успешной проверки JWT; защищённый маршрут `GET /v1/auth/whoami` не читает tenant из query/body (покрыто тестом с `?tenant_id=evil-tenant`).
- **[backend]** Публичный маршрут `GET /v1/system/ping` без JWT.
- **[docs]** Фрагмент в [`README.md`](../../README.md) про env и claim `tenant_id`; обновлены [`openapi/openapi.yaml`](../../openapi/openapi.yaml) (bearerAuth, ping, whoami), [`.env.example`](../../.env.example).
- **[docs-site]** Добавлен человекопонятный раздел "Задачи на пальцах" с отдельной страницей по задаче 005.
- **Согласование с AprilHub:** audience ориентир — `april-profile-api` ([`docs/guides/PROJECT_DEFAULTS.md`](../../docs/guides/PROJECT_DEFAULTS.md)); issuer и JWKS — как в [`docs/keycloak-stand-coordinates.md`](../../docs/keycloak-stand-coordinates.md) и [`docs/auth-jwt-keycloak-adapted.md`](../../docs/auth-jwt-keycloak-adapted.md).
- **[стенд smoke]** На `192.168.1.42` проверен реальный happy-path с Keycloak: `GET /v1/auth/whoami?tenant_id=evil` с валидным Bearer token возвращает `200` и `tenant_id=tenant-dev` (из claim токена), что подтверждает игнорирование недоверенного query-параметра.

## 3) Изменённые файлы

- `.env.example`
- `README.md`
- `go.mod`
- `go.sum`
- `internal/config/config.go`
- `internal/auth/context.go`
- `internal/auth/jwt.go`
- `internal/auth/middleware.go`
- `internal/auth/jwt_test.go`
- `internal/httpapi/server.go`
- `internal/httpapi/server_test.go`
- `internal/app/run.go`
- `openapi/openapi.yaml`
- `docs-site/docs/intro.md`
- `docs-site/docs/task-stories-overview.md`
- `docs-site/docs/task-story-005-keycloak-jwt-tenant.md`
- `tasks/005-phase-1-keycloak-jwt-tenant-context/PLAN.md`
- `tasks/005-phase-1-keycloak-jwt-tenant-context/REPORT.md`
- `task_list.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Обратимость: не применимо

## 5) Проверка качества

- Линтер: ok (`make openapi-lint`)
- Сборка: ok (`go vet ./...`, `go build ./...`, `make docs-build`)
- Unit tests: ok (`go test ./...`)
- Integration tests: часть сценариев — в `internal/httpapi` с `httptest` и локальным JWKS
- E2E / smoke: выполнен на стенде Hub (см. ниже)

Команды (фактически выполненные):

```bash
go vet ./...
go test ./...
make openapi-lint
make docs-build

# smoke на 192.168.1.42 (временный backend :18080)
GET /v1/system/ping                           -> 200 {"status":"ok"}
GET /v1/auth/whoami                           -> 401 {"code":"missing_bearer",...}
GET /v1/auth/whoami (Bearer garbage)          -> 401 {"code":"invalid_token",...}
GET /v1/auth/whoami?tenant_id=evil (real JWT)-> 200 {"sub":"...","tenant_id":"tenant-dev"}
```

## 6) Деплой

- Среда: dev (`192.168.1.42`, репозиторий `/home/ukituki/april-profile`)
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Способ доставки: merge PR #5 в `develop`, workflow `Deploy to dev` (успешно)
- Образы: для runtime backend не применялись (задача 007), smoke выполнялся временным запуском backend (`golang:1.24`, host `:18080`)
- Health / readiness: проверен `GET /v1/system/ping`; `/healthz`/`/readyz` пока не в объёме этой задачи (задача 006)
- Rollback: не требовался

## 7) Риски и ограничения

- Для работы сервиса в среде нужны корректные `KEYCLOAK_*` и доступ приложения до URL JWKS.
- Проверка алгоритма подписи зафиксирована на **RS256**; смена алгоритма в Keycloak потребует правки кода.
- **Выбор источника tenant:** реализован вариант **claim в access token** (`tenant_id` / `KEYCLOAK_TENANT_CLAIM`). Передача tenant через заголовок BFF не реализована; при необходимости — отдельное согласование с владельцами Hub и ADR/задача.
- На момент smoke пароль пользователя `april-dev` временно менялся через Admin API для получения тестового токена; затем сброшен на временное значение с `temporary=true`, старый smoke-пароль инвалидирован.

## 8) Что осталось

- [ ] Реализовать `/healthz` и `/readyz` (задача 006).
- [ ] Перевести backend на постоянный dev-runtime через Docker/ghcr/compose (задача 007), чтобы smoke выполнялся без временного ручного запуска.
