# Карточка виджета: `profiles-widget`

## 1) Мета

| Поле | Значение |
|------|----------|
| `profileId` | `entity-profile` |
| `widgetId` | `profiles-widget` |
| `packageName` | `@april/profile-ui` |
| `contractVersion` | `v1` |
| `lifecycleStatus` | `beta` |
| Владелец | команда AprilProfile (`april-profile`) + интеграция в AprilHub (`april-worker`) |

## 2) Назначение

Виджет `Profiles` предоставляет основной master-detail UX для управления профилями сущностей: слева список профилей с поиском/фильтрацией/дозагрузкой, справа карточка выбранного профиля с просмотром и редактированием, плюс создание нового профиля через модальное окно.

## 3) Контракт интеграции

- HostContext/props/events: [`../../WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md).
- Версионирование: [`../../VERSIONING_AND_COMPATIBILITY.md`](../../VERSIONING_AND_COMPATIBILITY.md).
- Интеграционный чеклист host: [`../../WIDGET_INTEGRATION_CHECKLIST.md`](../../WIDGET_INTEGRATION_CHECKLIST.md).

Ключевые контрактные элементы (Phase 6 baseline):

- Вход: `hostContext`, `apiBaseUrl` (или API adapter), опционально `accessToken`, `pageSize`, `initialSearch`, `initialFilter`.
- Источник данных: server-side list/search/filter/pagination через provider/API, без входного `entityIds` как source of truth.
- Выход: `onAction` (`created`/`updated`/`deleted`), `onError` с безопасным сообщением и `requestId`.
- Поведение: DS-first layout 25/75 (`CardListColumn` + профильная карточка), с консистентным list/detail lifecycle.

### Архитектурная схема ответственности (task 042)

```mermaid
flowchart LR
    Host[Host App / AprilHub] -->|hostContext, callbacks| Facade[ProfilesWidget facade]
    Facade --> Api[ProfilesApiWidget]
    Api --> Provider[ProfilesDataProvider]
    Api --> Core[ProfilesWidgetCore]
    Core -->|list/get/create/update/delete| Provider
    Provider -->|OpenAPI SDK| BFF[/admin/profile/api]
```

- `ProfilesWidgetCore`: UI/state machine, без знания транспортного слоя.
- `ProfilesApiWidget`: wiring host + OpenAPI provider.
- `ProfilesWidget`: публичный фасад для embed.

## 4) Права доступа и безопасность

- Источник прав: Keycloak (роли и claims в доверенном контуре host/BFF).
- ABAC/tenant-политики применяются backend-ом; виджет не дублирует IAM-логику.
- API-ошибки (`401/403/409`) отображаются через безопасные сообщения без утечки внутренних деталей.

## 5) Зависимости

- `@april/profile-ui` (workspace/npm пакет, semver).
- `@april/ui` (`CardListColumn`) как основной DS-компонент списка.
- OpenAPI методы list/get/create/update/delete профиля.

### Контракт list endpoint (task 043)

- `GET /v1/entities` с query:
  - `search` — поиск по `entity_id` и текстовому содержимому текущего `document`;
  - `entity_type_id` — фильтр по типу;
  - `limit` — размер страницы (`1..100`);
  - `cursor` — непрозрачный курсор следующей страницы;
  - `sort` — `updated_desc`/`updated_asc` (детерминированный порядок).
- Ответ:
  - `items[]` (`entity_id`, `entity_type_id`, `version`, `created_at`, `preview`);
  - `next_cursor` (`null` на конце списка);
  - `total_count`.
- Ошибки: `401/403/422/429/500` в envelope `code`, `message`, `request_id`.

## 6) Observability

- Корреляция по `requestId`/`X-Request-Id`: [`../../WIDGET_OBSERVABILITY_GUIDE.md`](../../WIDGET_OBSERVABILITY_GUIDE.md).
- События: `view_loaded`, `save_submitted`, `save_succeeded`, `save_failed` для `widget = profiles_list` (backward-compatible telemetry key).
- Минимальный smoke: загрузка списка, create/update/delete, обработка API-ошибок.

## 7) Ограничения и known issues

- Публичный контракт `ProfilesWidget` не поддерживает `entityIds`; источник списка только server-side list API.
- Anti-patterns для новых изменений:
  - нельзя возвращаться к `entityIds` как source of truth;
  - нельзя переносить transport/env-логику в `Core`;
  - нельзя подменять server-side пагинацию client-side имитацией полной выборкой.

## 8) Артефакты (TASK/PLAN/REPORT + smoke/e2e)

- Выделение `Profiles` из `widget-card`: [`../../../tasks/041-phase-5-widget-card-to-profiles-widget/TASK.md`](../../../tasks/041-phase-5-widget-card-to-profiles-widget/TASK.md), [`../../../tasks/041-phase-5-widget-card-to-profiles-widget/PLAN.md`](../../../tasks/041-phase-5-widget-card-to-profiles-widget/PLAN.md), [`../../../tasks/041-phase-5-widget-card-to-profiles-widget/REPORT.md`](../../../tasks/041-phase-5-widget-card-to-profiles-widget/REPORT.md).
- Production-first архитектурный baseline: [`../../../tasks/042-phase-6-profiles-widget-production-architecture/TASK.md`](../../../tasks/042-phase-6-profiles-widget-production-architecture/TASK.md), [`../../../tasks/042-phase-6-profiles-widget-production-architecture/PLAN.md`](../../../tasks/042-phase-6-profiles-widget-production-architecture/PLAN.md), [`../../../tasks/042-phase-6-profiles-widget-production-architecture/REPORT.md`](../../../tasks/042-phase-6-profiles-widget-production-architecture/REPORT.md).
- API/SDK readiness: [`../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/TASK.md`](../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/TASK.md), [`../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/PLAN.md`](../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/PLAN.md), [`../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/REPORT.md`](../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/REPORT.md).
- Реализация Core/API refactor: [`../../../tasks/044-phase-6-profiles-widget-core-api-refactor/TASK.md`](../../../tasks/044-phase-6-profiles-widget-core-api-refactor/TASK.md), [`../../../tasks/044-phase-6-profiles-widget-core-api-refactor/PLAN.md`](../../../tasks/044-phase-6-profiles-widget-core-api-refactor/PLAN.md), [`../../../tasks/044-phase-6-profiles-widget-core-api-refactor/REPORT.md`](../../../tasks/044-phase-6-profiles-widget-core-api-refactor/REPORT.md).
- Базовый CRUD-виджет (историческая база): [`../../../tasks/025-phase-4a-profile-profiles-list-crud-widget/TASK.md`](../../../tasks/025-phase-4a-profile-profiles-list-crud-widget/TASK.md).
- UX-модернизация `widget-card`: [`../../../tasks/040-phase-5-widget-card-layout-modernization/TASK.md`](../../../tasks/040-phase-5-widget-card-layout-modernization/TASK.md).
