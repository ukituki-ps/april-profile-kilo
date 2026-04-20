## 1) Итого

- Статус: ✅ выполнено
- Задача: Фаза 1 (часть 1) — Go-модуль, модульный монолит, Atlas, миграции, tenant и заготовка сущностей
- Ветка: `feature/phase-1-go-atlas-tenant`
- Коммиты: последний на ветке — `git log -1 --format=%H feature/phase-1-go-atlas-tenant`
- PR: не создавался

## 2) Что сделано

- **[backend]** Инициализирован модуль `github.com/ukituki-ps/april-profile`, структура монолита: `cmd/april-profile`, `internal/app` (запуск до SIGINT/SIGTERM без HTTP), `internal/version`.
- **[БД / Atlas]** Каталог `atlas/migrations/`, первая миграция: `tenants`, `entity_types`, `entities`, `profile_versions`, `external_id_mappings`, `profile_events` (соответствие ADR-0002/0003 и `DESIGN_AprilProfile` на уровне заготовки; без CRUD).
- **[infra]** В `docker-compose.yml` добавлен сервис `postgres` (PostgreSQL 17-alpine, профиль `db`), том `postgres_data`; в `.env.example` — `DATABASE_URL`, переменные Postgres, заготовки Keycloak.
- **[документация / CI]** `Makefile`: `go-vet`, `go-build`, `migrate-validate`, `migrate-apply` (Atlas через Docker-образ `arigaio/atlas:0.32.0`; `migrate-apply` с `--network host` для доступа к БД на `127.0.0.1`). Обновлены `README.md`, `docs/guides/VERSIONS.md`, `docs/TESTING_STRATEGY.md`. В `.github/workflows/ci.yml` и `bootstrap-ci.yml` — job/step для Go и `atlas migrate validate`.
- **Примечание:** бинарник `atlas`, установленный через `go install ariga.io/atlas/cmd/atlas@latest`, в среде проверки давал ошибку `postgres: unexpected number of rows: 1` к PostgreSQL 17; для воспроизводимости зафиксирован **официальный Docker-образ** Atlas (см. `ATLAS_IMAGE` в `Makefile`).

## 3) Изменённые файлы

- `.env.example`
- `.github/workflows/bootstrap-ci.yml`
- `.github/workflows/ci.yml`
- `.gitignore`
- `Makefile`
- `README.md`
- `docker-compose.yml`
- `docs/TESTING_STRATEGY.md`
- `docs/guides/VERSIONS.md`
- `task_list.md`
- `go.mod`
- `atlas.hcl`
- `atlas/migrations/20260420140000_initial.sql`
- `atlas/migrations/atlas.sum`
- `cmd/april-profile/main.go`
- `internal/app/run.go`
- `internal/version/version.go`
- `tasks/004-phase-1-go-mod-atlas-migrations-tenant/PLAN.md`
- `tasks/004-phase-1-go-mod-atlas-migrations-tenant/REPORT.md`

## 4) Миграции и данные

- Миграции Atlas: добавлены (`atlas/migrations/20260420140000_initial.sql`, checksum `atlas/migrations/atlas.sum`).
- Таблицы: `tenants`, `entity_types`, `entities`, `profile_versions`, `external_id_mappings`, `profile_events`; индексы по `tenant_id` / связкам для изоляции и выборок.
- Обратимость: откат — по политике Atlas / `DEPLOYMENT_STRATEGY` (на чистой dev-БД при необходимости `atlas migrate down` с тем же CLI-образом и `DATABASE_URL`).

## 5) Проверка качества

- Линтер: ok (`make openapi-lint`)
- Сборка: ok (`go vet ./...`, `go build ./...`, `make docs-build`)
- Unit tests: n/a (тестов пока нет)
- Integration tests: n/a (задача 009)
- E2E / smoke: n/a

Команды (фактически выполненные):

```bash
go vet ./...
go build -o bin/april-profile ./cmd/april-profile
make migrate-validate
docker compose --profile db up -d postgres
# применение миграции к локальному Postgres (проверено через образ arigaio/atlas:0.32.0 и сеть compose)
make openapi-lint
make docs-build
```

## 6) Деплой

- Среда: нет (в задаче не требовался)
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Health / readiness: не применялось (эндпоинты — задача 006)
- Rollback: нет

## 7) Риски и ограничения

- Имена таблиц и гранулярность полей JSON/версий могут уточняться в фазе 2 при появлении доменного API и OpenAPI.
- Версия образа Atlas 0.32.0 помечена upstream как устаревающая; при обновлении — проверить `migrate validate/apply` и при необходимости поднять `ATLAS_IMAGE` в `Makefile` и CI.

## 8) Что осталось

- [ ] JWT / `tenant_id` из доверенного контекста — [`005-phase-1-keycloak-jwt-tenant-context`](../005-phase-1-keycloak-jwt-tenant-context/TASK.md)
- [ ] `/healthz`, `/readyz`, OpenAPI — [`006-phase-1-health-openapi-system`](../006-phase-1-health-openapi-system/TASK.md)
- [ ] Docker/ghcr/деплой — [`007-phase-1-docker-ghcr-compose-deploy`](../007-phase-1-docker-ghcr-compose-deploy/TASK.md)
