## 1) Итого

- Статус: выполнено
- Задача: 052 — данные и миграции: семейства типов, ревизии схемы, привязка `entity`
- Ветка: (создать локально или продолжить в текущей) `feature/task-052-phase-7-entity-type-revisions-data-model-and-migrations`
- Коммиты: (зафиксировать после слиянием в историю Git)
- PR: не создавался автоматически

## 2) Что сделано

- [backend][БД] Добавлена миграция Atlas [`atlas/migrations/20260430120000_entity_type_families_and_revisions.sql`](../../atlas/migrations/20260430120000_entity_type_families_and_revisions.sql): таблицы `entity_type_families`, `entity_type_revisions`, `entity_type_drafts`; перенос строк из удаляемой `entity_types`; колонка `entities.bound_entity_type_revision_id NOT NULL`; перенаправление FK `entities.entity_type_id` на `entity_type_families`; таблица `entity_types` удалена как монолитный носитель схемы.
- [backend] Переписан каталог типов [`internal/entitytypes/catalog.go`](../../internal/entitytypes/catalog.go): создание через family+draft; публикация **создаёт новую ревизию** (повторный publish допустим); list/get через join с последней ревизией.
- [backend] Профиль: создание сущности привязывает **`bound_entity_type_revision_id`** к последней опубликованной ревизии семейства; проверка «тип опубликован» через наличие ревизий; outbox ключ `namespace/code` через `entity_type_families` ([`internal/profiles/service.go`](../../internal/profiles/service.go), [`internal/profiles/outbox.go`](../../internal/profiles/outbox.go)).
- [openapi] Убран ответ **409** у publish (повторная публикация больше не ошибка контракта); обновлён текст summary ([`openapi/openapi.yaml`](../../openapi/openapi.yaml)).
- [frontend] Регенерация клиента `@april/profile-ui` после OpenAPI (`npm run generate:api`).
- [tests] Интеграционные фикстуры переведены на новые таблицы ([`internal/integrationtest/integration_test.go`](../../internal/integrationtest/integration_test.go), [`internal/integrationtest/asyncjobs_integration_test.go`](../../internal/integrationtest/asyncjobs_integration_test.go)).

## 3) Изменённые файлы (основное)

- `atlas/migrations/20260430120000_entity_type_families_and_revisions.sql`
- `atlas/migrations/atlas.sum`
- `internal/entitytypes/catalog.go`
- `internal/httpapi/server.go`
- `internal/profiles/service.go`
- `internal/profiles/outbox.go`
- `internal/integrationtest/integration_test.go`
- `internal/integrationtest/asyncjobs_integration_test.go`
- `openapi/openapi.yaml`
- `frontend/packages/profile-ui/src/generated/**` (после генерации)

## 4) Миграции и данные

- Миграции Atlas: добавлены (см. файл выше).
- Таблицы: новые **`entity_type_families`**, **`entity_type_revisions`**, **`entity_type_drafts`**; изменена **`entities`** (+ `bound_entity_type_revision_id`, FK на ревизии и семейства); удалена **`entity_types`**.
- Обратимость: только через новую down-миграцию или восстановление из бэка; обратная миграция в этом изменении не поставлялась.

Инварианты при переносе:

- Если существует `entity`, у которого не удалось установить привязку к ревизии (нет опубликованных ревизий у семейства), миграция **останавливается с ошибкой**.

## 5) Проверка качества

- Linтер Go: через `gofmt` и `go test` (строгого golangci в этом запуске не вызывалось отдельно).
- Lint frontend workspace: выполнен `npm run lint -w @april/profile-ui`.
- Unit tests: `go test -count=1 ./...`.
- Integration tests: `go test -tags=integration -timeout=15m ./internal/integrationtest/... -count=1`.

Команды:

```bash
gofmt -w ...
go test -count=1 ./...
go test -tags=integration -timeout=15m ./internal/integrationtest/... -count=1
cd frontend/packages/profile-ui && npm run generate:api
cd frontend && npm run lint -w @april/profile-ui
```

## 6) Деплой

- Не выполнялся (вне объёма одной задачи без явной команды).

## 7) Риски и ограничения

- Семантика `POST /v1/entity-types/{id}/publish` изменена: каждый вызов создаёт новую строку ревизии схемы; клиентам, ожидавшим **409 повторной публикации**, нужно обновить контракт.
- Публичный API по-прежнему передаёт `entity_type_id` как идентификатор семейства (совместимо с прежними UUID `entity_types.id`).
- Отдельные операции **апгрейда привязки** и расширенный CRUD — в задачах **053–055**.

## 8) Что осталось

- [ ] Задача 053: операции апгрейда revision binding, возможное снятие дублирования `entity_type_id` названием API, доп. инварианты.
- [ ] Задачи 054–055: виджет, docs-site stories, финализация hub handoff при необходимости.
