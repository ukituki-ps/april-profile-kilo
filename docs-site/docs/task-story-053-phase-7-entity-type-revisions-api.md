---
sidebar_position: 250
---

# 053 — API и OpenAPI: каталог типов, ревизии, публикация и апгрейд привязки

## Проблема

После миграций данных (052) нужен был **полный админский HTTP-контракт**: CRUD семейства, черновик с optimistic concurrency, публикация ревизии, чтение истории ревизий, а также **явный апгрейд** привязки сущности к целевой ревизии с валидацией документа профиля и записью новой версии профиля при необходимости.

## Что сделали

- Расширили **`openapi/openapi.yaml`**: пути под `/v1/entity-types/...` (список, создание, get/patch/delete, draft PUT, publish, список и get ревизий).
- Добавили операции профилей: **`POST /v1/entities/{entityID}/upgrade-entity-type-revision`** и **`POST /v1/entities/batch-upgrade-entity-type-revision`** (пакетный сценарий, в т.ч. `only_behind_latest`).
- Реализовали handlers в Go, связку с доменом профилей и интеграционные тесты.
- Обновили generated SDK потребителей (в т.ч. `@april/profile-ui` при `npm run build` пакета).

## Что это даёт

- Один источник правды для UI и BFF: OpenAPI + SDK.
- Хост может проксировать конечный список путей без догадок (см. also [`entity-types-widget-hub-handoff`](https://github.com/ukituki-ps/april-profile/blob/develop/docs/integration/entity-types-widget-hub-handoff.md)).

## Как проверить без чтения кода

1. Открыть `openapi/openapi.yaml` в репозитории и найти теги **`EntityTypes`** и соответствующие операции **`Profiles`** для batch/single upgrade.
2. Прочитать `tasks/053-phase-7-entity-type-revisions-backend-api-profile-integration/REPORT.md` — итоговый список сценариев и ссылок на тесты.
3. Для точных кодов ошибок и тел запросов — только OpenAPI (дублировать полную спецификацию в этой story не требуется).

## Ссылки на артефакты

- `tasks/053-phase-7-entity-type-revisions-backend-api-profile-integration/TASK.md`
- `tasks/053-phase-7-entity-type-revisions-backend-api-profile-integration/PLAN.md`
- `tasks/053-phase-7-entity-type-revisions-backend-api-profile-integration/REPORT.md`
- OpenAPI: `openapi/openapi.yaml`
