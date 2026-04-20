## 1) Итого

- Статус: ✅ выполнено
- Задача: Фаза 1 (2/6) — валидация JWT Keycloak и `tenant_id` только из доверенного контекста
- Ветка: `feature/phase-1-jwt-tenant-context`
- Коммиты: см. `git log -1` на ветке `feature/phase-1-jwt-tenant-context`
- PR: не создавался (локальная ветка в рабочей копии)

## 2) Что сделано

- **[backend]** Конфигурация из env: `HTTP_LISTEN_ADDR` (по умолчанию `:8080`), `KEYCLOAK_JWKS_URL`, `KEYCLOAK_ISSUER`, `KEYCLOAK_AUDIENCE`, `KEYCLOAK_TENANT_CLAIM` (по умолчанию `tenant_id`).
- **[backend]** Валидация access token: подпись по JWKS (`keyfunc`), проверка `iss`, срока, `aud` или `azp` против `KEYCLOAK_AUDIENCE`, обязательные `sub` и claim тенанта.
- **[backend]** Контекст запроса: `sub` и `tenant_id` только после успешной проверки JWT; защищённый маршрут `GET /v1/auth/whoami` не читает tenant из query/body (покрыто тестом с `?tenant_id=evil-tenant`).
- **[backend]** Публичный маршрут `GET /v1/system/ping` без JWT.
- **[docs]** Фрагмент в [`README.md`](../../README.md) про env и claim `tenant_id`; обновлены [`openapi/openapi.yaml`](../../openapi/openapi.yaml) (bearerAuth, ping, whoami), [`.env.example`](../../.env.example).
- **Согласование с AprilHub:** audience ориентир — `april-profile-api` ([`docs/guides/PROJECT_DEFAULTS.md`](../../docs/guides/PROJECT_DEFAULTS.md)); issuer и JWKS — как в [`docs/keycloak-stand-coordinates.md`](../../docs/keycloak-stand-coordinates.md) и [`docs/auth-jwt-keycloak-adapted.md`](../../docs/auth-jwt-keycloak-adapted.md).

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
- E2E / smoke: не выполнялся (опционально по задаче; реальный Keycloak на стенде)

Команды (фактически выполненные):

```bash
go vet ./...
go test ./...
make openapi-lint
make docs-build
```

## 6) Деплой

- Среда: нет (задача не требовала деплоя на dev)
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md) — не применялось
- Образы: не применялось
- Health / readiness: не проверялось (маршруты `/healthz` / `/readyz` — задача 006)
- Rollback: нет

## 7) Риски и ограничения

- Для работы сервиса в среде нужны корректные `KEYCLOAK_*` и доступ приложения до URL JWKS.
- Проверка алгоритма подписи зафиксирована на **RS256**; смена алгоритма в Keycloak потребует правки кода.
- **Выбор источника tenant:** реализован вариант **claim в access token** (`tenant_id` / `KEYCLOAK_TENANT_CLAIM`). Передача tenant через заголовок BFF не реализована; при необходимости — отдельное согласование с владельцами Hub и ADR/задача.

## 8) Что осталось

- [ ] Реализовать `/healthz` и `/readyz` (задача 006).
- [ ] Согласовать mapper `tenant_id` в Keycloak realm и проверить smoke на стенде с Hub (OIDC → Bearer к API).
