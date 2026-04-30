## 1) Итого

- Статус: выполнено
- Задача: 053 — бэкенд + OpenAPI: ревизии типов, апгрейд привязки `entity`, интеграция с профилями и outbox
- Ветка: `feature/task-053-phase-7-entity-type-revisions-backend-api-profile-integration` (создайте локально при коммите)
- Коммиты: один коммит на ветке `feature/task-053-phase-7-entity-type-revisions-backend-api-profile-integration` (см. `git log -1`)
- PR: не создавался автоматически

## 2) Что сделано

- [backend] Расширен каталог типов (`internal/entitytypes`): `Get`, `UpdateFamilyMeta`, `DeleteFamily` (только без ревизий и сущностей), `SaveDraft` с обязательным `if_draft_schema_version` и ошибкой `ErrDraftVersionConflict` → HTTP **409**, список и чтение ревизий; повторный `Publish` по-прежнему создаёт следующий `revision_no`.
- [backend] Профили: валидация документа по JSON Schema последней ревизии при **`Create`**; операции **`UpgradeEntityBinding`** и **`BatchUpgradeEntityBinding`** с валидацией, сменой `bound_entity_type_revision_id`, append-only `profile_versions` и outbox в одной транзакции на сущность; идемпотентность при уже актуальной ревизии.
- [backend] Событие outbox (`ProfileChangeEventV1`): добавлены необязательные поля `entity_type_revision_id`, `entity_type_revision_no` (ADR-0005, обратная совместимость через `omitempty`).
- [backend] HTTP (`internal/httpapi`): новые маршруты под OpenAPI; единый разбор ошибок каталога (`writeEntityTypeCatalogError`); **422** с массивом `issues` при `schema_validation_failed`; пустое тело POST upgrade = переход на последнюю опубликованную ревизию семейства.
- [openapi] `openapi/openapi.yaml` v0.3.0: полные пути и схемы, общие `components.responses` Unauthorized/ForbiddenTenant, параметр `EntityTypeIdPath`, расширен `Error.issues`.
- [frontend] Регенерация клиента `@april/profile-ui` (`npm run generate:api`).

## 3) Изменённые файлы (основные)

- `internal/entitytypes/catalog.go`, `catalog_more.go`, `errors.go`, `revision.go`
- `internal/profiles/service.go`, `service_upgrade.go`, `outbox.go`, `profile_event.go`, `schema_validate.go`, `schema_validate_test.go`
- `internal/httpapi/server.go`, `server_test.go`
- `internal/integrationtest/integration_test.go`
- `openapi/openapi.yaml`
- `go.mod`, `go.sum`
- `frontend/packages/profile-ui/src/generated/**`
- `tasks/053-phase-7-entity-type-revisions-backend-api-profile-integration/PLAN.md`, `REPORT.md`

## 4) Миграции и данные

- Миграции Atlas: **нет новых** (опора на 052).
- Обратимость: не применялась откат миграций в этой задаче.

## 5) Проверка качества

- Линтер OpenAPI: ok (`make openapi-lint`)
- Сборка Go: ok (`go build ./...`)
- Unit tests: ok (`go test ./...`)
- Integration tests: ok (`go test -tags=integration ./internal/integrationtest/...`)
- Frontend `@april/profile-ui`: ok (`npm run lint` / `npm run test`)

Команды:

```bash
go test ./...
go test -tags=integration ./internal/integrationtest/... -timeout 15m
make openapi-lint
cd frontend && npm run generate:api -w @april/profile-ui
cd frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui
```

## 6) Деплой

- Среда: не выполнялась (в постановке не требовалось).

## 7) Риски и ограничения

- Семантика JSON Schema зависит от черновика и дефолта компилятора v6; при жёстких требованиях к draft стоит явно задавать `$schema` в черновиках.
- `BatchUpgradeEntityBinding` выполняет по одной транзакции на сущность; частичный успех отражается в `results`.

## 8) Что осталось

- [ ] Задача **054** (виджет каталога типов в UI).
- [ ] Задача **055** (docs-site / handoff Hub).
