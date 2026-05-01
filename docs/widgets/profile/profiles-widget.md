# Карточка виджета: `profiles-widget` (сборка)

## 1) Мета

| Поле | Значение |
|------|----------|
| `profileId` | `entity-profile` |
| `widgetId` | `profiles-widget` |
| `packageName` | `@april/profile-ui` |
| `contractVersion` | `v1` |
| `lifecycleStatus` | `beta` |
| Владелец | команда AprilProfile (`april-profile`) + интеграция в AprilHub (`april-worker`) |

## 2) Назначение (master–detail)

Виджет **`ProfilesWidget`** — **сборка** из двух UX-поверхностей: **список** профилей сущностей слева и **карточка** выбранного профиля с версиями и JSON-документом справа. Нормативные детали вынесены в отдельные спецификации:

| Поверхность | Документ |
|-------------|----------|
| Список (поиск, пагинация, `GET /v1/entities`, `CardListColumn`) | [`profiles-widget-list.md`](./profiles-widget-list.md) |
| Карточка, версии, документ (RJSF / Tree / Source, save, create/delete) | [`profiles-widget-profile-detail.md`](./profiles-widget-profile-detail.md) |

Контейнер заполняет доступную высоту хоста (`flex`); layout DS-first: `CardListColumn` + колонка карточки на `flex`, `minWidth: 0`.

## 3) Контракт интеграции (обзор)

- HostContext / props / events: [`../../WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md).
- Версионирование: [`../../VERSIONING_AND_COMPATIBILITY.md`](../../VERSIONING_AND_COMPATIBILITY.md).
- Чеклист host: [`../../WIDGET_INTEGRATION_CHECKLIST.md`](../../WIDGET_INTEGRATION_CHECKLIST.md).

Ключевые элементы (без дублирования длинных таблиц — см. типы **`ProfilesWidgetProps`**, **`ProfilesWidgetAction`** в `@april/profile-ui`):

- Вход: `hostContext`, `apiBaseUrl` (или adapter), опционально `accessToken`, `initialCreateEntityTypeId`, `pageSize`, `initialSearch`, `initialTypeId`, `initialSort`, `autoSelectFirst`.
- Выход: `onAction`, `onError`, `onObservability`, `onOpenEntity`.
- Источник списка: только server-side API (детали — в [`profiles-widget-list.md`](./profiles-widget-list.md)).

### Архитектура кода (task 042)

```mermaid
flowchart LR
    Host[Host App / AprilHub] -->|hostContext, callbacks| Facade[ProfilesWidget facade]
    Facade --> Api[ProfilesApiWidget]
    Api --> Provider[ProfilesDataProvider]
    Api --> Core[ProfilesWidgetCore]
    Core -->|list/get/create/update/delete| Provider
    Provider -->|OpenAPI SDK| BFF[/admin/profile/api]
```

- `ProfilesWidgetCore`: UI/state machine, без транспорта в Core.
- `ProfilesApiWidget`: wiring host + OpenAPI provider, `ProviderContext`, **`AbortController`** для отмены list/details при смене состояния.
- `ProfilesWidget`: публичный фасад для embed.
- `update`: `Core` передаёт `expectedVersion` в провайдер.

### Расширяемость (перспектива, без обязательств текущего API)

Host или будущий **registry** смогут подставить альтернативный UI редактирования **документа** при том же списке и том же идентификаторе сущности, если явно зафиксирован контракт: выбор строки, `entityId`, мутации с `expectedVersion` и теми же колбэками безопасности. Текущий пакет поставляет монолитную сборку **`ProfilesWidget`**; разбиение на отдельные npm-entry **не входит** в контракт `v1` до отдельной задачи.

## 4) Права доступа и безопасность

- Keycloak / BFF; ABAC на backend; виджет не дублирует IAM. Ошибки API — безопасные сообщения для UI.

## 5) Observability и качество

- Корреляция: [`../../WIDGET_OBSERVABILITY_GUIDE.md`](../../WIDGET_OBSERVABILITY_GUIDE.md). События списка vs карточки — в под-доках [`profiles-widget-list.md`](./profiles-widget-list.md) и [`profiles-widget-profile-detail.md`](./profiles-widget-profile-detail.md).

### Release gate (task 047)

- `cd frontend && npm run lint -w @april/profile-ui`
- `cd frontend && npm run test -w @april/profile-ui`
- `cd frontend && npm run build -w @april/profile-ui`
- `go test ./...`
- Тесты: `ProfilesWidgetCore`, `openapiProfilesProvider`, smoke `ProfilesWidget` (CRUD, `401/403/409`).

## 6) Ограничения и known issues

- Публичный контракт не поддерживает `entityIds` как source of truth для списка.
- Anti-patterns: не переносить transport в `Core`; не подменять server-side пагинацию полной client-side выборкой (см. [`profiles-widget-list.md`](./profiles-widget-list.md)).

## 7) Артефакты (TASK/PLAN/REPORT + smoke/e2e)

- Выделение `Profiles` из `widget-card`: [`../../../tasks/041-phase-5-widget-card-to-profiles-widget/TASK.md`](../../../tasks/041-phase-5-widget-card-to-profiles-widget/TASK.md), [`../../../tasks/041-phase-5-widget-card-to-profiles-widget/PLAN.md`](../../../tasks/041-phase-5-widget-card-to-profiles-widget/PLAN.md), [`../../../tasks/041-phase-5-widget-card-to-profiles-widget/REPORT.md`](../../../tasks/041-phase-5-widget-card-to-profiles-widget/REPORT.md).
- Production-first baseline: [`../../../tasks/042-phase-6-profiles-widget-production-architecture/TASK.md`](../../../tasks/042-phase-6-profiles-widget-production-architecture/TASK.md), [`../../../tasks/042-phase-6-profiles-widget-production-architecture/PLAN.md`](../../../tasks/042-phase-6-profiles-widget-production-architecture/PLAN.md), [`../../../tasks/042-phase-6-profiles-widget-production-architecture/REPORT.md`](../../../tasks/042-phase-6-profiles-widget-production-architecture/REPORT.md).
- API/SDK list: [`../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/TASK.md`](../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/TASK.md), [`../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/PLAN.md`](../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/PLAN.md), [`../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/REPORT.md`](../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/REPORT.md).
- Core/API refactor: [`../../../tasks/044-phase-6-profiles-widget-core-api-refactor/TASK.md`](../../../tasks/044-phase-6-profiles-widget-core-api-refactor/TASK.md), [`../../../tasks/044-phase-6-profiles-widget-core-api-refactor/PLAN.md`](../../../tasks/044-phase-6-profiles-widget-core-api-refactor/PLAN.md), [`../../../tasks/044-phase-6-profiles-widget-core-api-refactor/REPORT.md`](../../../tasks/044-phase-6-profiles-widget-core-api-refactor/REPORT.md).
- Базовый CRUD: [`../../../tasks/025-phase-4a-profile-profiles-list-crud-widget/TASK.md`](../../../tasks/025-phase-4a-profile-profiles-list-crud-widget/TASK.md).
- UX `widget-card`: [`../../../tasks/040-phase-5-widget-card-layout-modernization/TASK.md`](../../../tasks/040-phase-5-widget-card-layout-modernization/TASK.md).
- Embed UI + версии + имя (051): [`../../../tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/TASK.md`](../../../tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/TASK.md), [`../../../tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/PLAN.md`](../../../tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/PLAN.md), [`../../../tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/REPORT.md`](../../../tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/REPORT.md).
- JSON-документ на DS (058): [`../../../tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/TASK.md`](../../../tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/TASK.md) (зависит от [`057`](../../../tasks/057-phase-7-profile-ui-ds-json-entity-types-integration/TASK.md)).
- RJSF (059): [`../../../tasks/059-phase-7-profiles-widget-rjsf-document-form/TASK.md`](../../../tasks/059-phase-7-profiles-widget-rjsf-document-form/TASK.md), [`REPORT.md`](../../../tasks/059-phase-7-profiles-widget-rjsf-document-form/REPORT.md) (зависит от [`058`](../../../tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/TASK.md)).
- Разнесение спецификации list/detail: [`../../../tasks/062-docs-profiles-widget-spec-list-content-assembly/TASK.md`](../../../tasks/062-docs-profiles-widget-spec-list-content-assembly/TASK.md).
