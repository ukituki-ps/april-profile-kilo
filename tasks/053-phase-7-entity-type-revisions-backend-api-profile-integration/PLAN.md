# План: бэкенд + OpenAPI — ревизии типов, апгрейд привязки, профили (053)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-30
- **Статус плана:** согласован с реализацией

## Исходные допущения

- Миграции 052 применены: `entity_type_families`, `entity_type_revisions`, `entity_type_drafts`, `entities.bound_entity_type_revision_id`.
- Конфликт редактирования черновика по сервису: **HTTP 409** (`draft_version_conflict`), едино с другими конфликтами домена.
- Новая версия профиля при **апгрейде привязки** создаётся **только если** `bound_entity_type_revision_id` меняется; идемпотентный повтор цели — без новой версии.
- Валидация документа против схемы ревизии: **github.com/santhosh-tekuri/jsonschema/v6**; ошибки **422** с массивом `issues` (`path`, `message`).
- Удаление семейства типа: только при отсутствии опубликованных ревизий **и** сущностей (жёстная политика безопасности).

## Порядок работ (факт)

1. Расширить `internal/entitytypes`: Get, PATCH метаданных, DELETE, SaveDraft с `if_draft_schema_version`, List/Get ревизий.
2. `internal/profiles`: JSON Schema validate при Create и Upgrade; `UpgradeEntityBinding`, `BatchUpgradeEntityBinding`; outbox payload — `entity_type_revision_id`, `entity_type_revision_no`.
3. `internal/httpapi`: маршруты, маппинг ошибок, пустое тело POST upgrade = latest ревизия.
4. OpenAPI + регенерация SDK `@april/profile-ui`.
5. Интеграционные и unit-тесты критичных ветвей.

## Затрагиваемые области

| Область | Изменения |
|--------|-----------|
| Backend Go | `entitytypes`, `profiles`, `httpapi` |
| OpenAPI | `openapi/openapi.yaml`, `components` responses/parameters |
| Frontend | `frontend/packages/profile-ui/src/generated` (codegen) |

## Проверка

- `go test ./...`
- `go test -tags=integration ./internal/integrationtest/...`
- `make openapi-lint`
- `cd frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui`

## Риски

- Семантика JSON Schema между draft-версиями и рантаймом jsonschema — при расхождении смотреть `$schema` в черновиках (сейчас опираемся на дефолт компилятора v6).
