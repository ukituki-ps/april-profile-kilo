---
sidebar_position: 251
---

# 054 — Виджет `entity-types-widget` в `@april/profile-ui`

## Проблема

Нужен был **production-first** embed для администрирования каталога типов: список семейств, работа с черновиком схемы, история ревизий, апгрейд привязки сущностей к ревизии — с теми же границами, что у `ProfilesWidget` (Core / Api / фасад, провайдер, отмена запросов, DS-first), без demo-first источников данных.

## Что сделали

- Реализовали **`EntityTypesWidgetCore`**, **`EntityTypesApiWidget`**, фасад **`EntityTypesWidget`** и OpenAPI-провайдер **`createOpenApiEntityTypesProvider`**.
- UI: master–detail с **`CardListColumn`** (`@april/ui`), вкладки Mantine (**Draft** / **Revisions** / **Upgrade**), моноширинный JSON-редактор черновика, обработка **409** черновика с «Reload draft», модалки create/patch/delete.
- Telemetry: `widget: "entity_types"` и события `draft_save_*`, `publish_*`, `upgrade_*`, `batch_upgrade_*` плюс list/details; колбэк **`onAction`** с типом **`EntityTypesWidgetAction`**.
- Версия пакета **`@april/profile-ui` 0.3.0** (minor: новые экспорты).

## Что это даёт

- AprilHub может встроить виджет с тем же **`hostContext` + `apiBaseUrl` + `accessToken`**, что и для списка профилей.
- Контракты зафиксированы в [`WIDGET_CONTRACTS.md`](https://github.com/ukituki-ps/april-profile/blob/develop/docs/WIDGET_CONTRACTS.md) §9 и в handoff [`entity-types-widget-hub-handoff.md`](https://github.com/ukituki-ps/april-profile/blob/develop/docs/integration/entity-types-widget-hub-handoff.md).

## Как проверить на стенде (smoke)

1. Развернуть AprilProfile + BFF с префиксом **`/admin/profile/api`** (как в задаче 020) и валидным JWT с **`tenant_id`**.
2. В host-приложении отрендерить **`EntityTypesWidget`** с `apiBaseUrl`, совпадающим с BFF, и `accessToken` из OIDC.
3. Сценарий: открыть список семейств → создать семейство → отредактировать черновик → **Save draft** → **Publish** → убедиться, что на вкладке **Revisions** появилась ревизия.
4. Создать/выбрать сущность этого типа с профилем → вкладка **Upgrade**: single upgrade и при необходимости **Upgrade all behind latest** / выбранные id — проверить отсутствие 502 из-за слишком короткого таймаута BFF (см. handoff).

## Ссылки на артефакты

- `tasks/054-phase-7-entity-types-widget-production-ui/TASK.md`
- `tasks/054-phase-7-entity-types-widget-production-ui/PLAN.md`
- `tasks/054-phase-7-entity-types-widget-production-ui/REPORT.md`
- Карточка виджета: `docs/widgets/profile/entity-types-widget.md`
- README пакета: `frontend/packages/profile-ui/README.md`
