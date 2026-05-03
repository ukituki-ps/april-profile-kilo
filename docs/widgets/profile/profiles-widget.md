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

Виджет **`ProfilesWidget`** — **составная сборка**: **список** профилей сущностей слева и **карточка** выбранного профиля с версиями и JSON-документом справа. Правая колонка и модалка создания реализованы отдельным публичным виджетом **`ProfilesWidgetProfileDetail`** (см. [`profiles-widget-profile-detail.md`](./profiles-widget-profile-detail.md)); `ProfilesWidget` монтирует его внутри и прокидывает выбранную строку и колбэки.

Контейнер заполняет доступную высоту хоста (`flex`); layout DS-first: `CardListColumn` + колонка карточки на `flex`, `minWidth: 0`.

## 3) Левая колонка: список профилей

> Нормативное содержание бывшего файла `profiles-widget-list.md` (файл исключён; ссылки ведут на этот раздел).

### Назначение

Левая колонка даёт **server-driven** список профилей сущностей: поиск, фильтр по типу сущности, курсорная пагинация, детерминированная сортировка. Строка показывает отображаемое имя (из `document.name` через `preview` / согласованное поле API), версию и идентификаторы, необходимые для выбора. Контейнер списка участвует в общем `flex`-layout виджета (`CardListColumn`); при повторной подгрузке списка не требуется полноэкранный лоадер, если список уже отображался (поведение согласовано с `ProfilesWidgetCore`).

### Контракт данных списка

- Источник списка **только** через provider/API: `GET /v1/entities` с query-параметрами. Входной проп **`entityIds`** как source of truth **не поддерживается** (см. ограничения ниже).
- Параметры списка со стороны host (через фасад виджета): `pageSize`, `initialSearch`, `initialTypeId`, `initialSort`, `autoSelectFirst` — см. тип `ProfilesWidgetProps` в пакете.

#### `GET /v1/entities` (task 043)

- Query:
  - `search` — поиск по `entity_id` и текстовому содержимому текущего `document`;
  - `entity_type_id` — фильтр по типу;
  - `limit` — размер страницы (`1..100`);
  - `cursor` — непрозрачный курсор следующей страницы;
  - `sort` — `updated_desc` / `updated_asc` (детерминированный порядок).
- Ответ:
  - `items[]` (`entity_id`, `entity_type_id`, `version`, `created_at`, `preview`);
  - `next_cursor` (`null` на конце списка);
  - `total_count`.
- Ошибки: `401/403/422/429/500` в envelope `code`, `message`, `request_id`.

### UI и дизайн-система

- Список строится на **`CardListColumn`** из `@april/ui` (≥ **0.1.7**); корень сборки оборачивается в **`DensityProvider`** (общий с виджетом детали).
- Уникальность **`document.name`**: клиентская проверка возможна **только** по уже загруженной странице списка; финальная уникальность — на сервере, когда контракт это отразит.

### Observability (список)

- Корреляция: [`../../WIDGET_OBSERVABILITY_GUIDE.md`](../../WIDGET_OBSERVABILITY_GUIDE.md).
- События, относящиеся к списку: `list_requested`, `list_succeeded`, `list_failed` (и общий `view_loaded` при первом показе); поле `widget` = `profiles_list` — см. [`../../WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md).

### Ограничения и anti-patterns (список)

- Нельзя использовать **`entityIds`** как источник истины для списка.
- Нельзя подменять server-side пагинацию **полной** client-side выборкой или имитацией «всех» строк.

## 4) Контракт интеграции (обзор)

- HostContext / props / events: [`../../WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md).
- Версионирование: [`../../VERSIONING_AND_COMPATIBILITY.md`](../../VERSIONING_AND_COMPATIBILITY.md).
- Чеклист host: [`../../WIDGET_INTEGRATION_CHECKLIST.md`](../../WIDGET_INTEGRATION_CHECKLIST.md).

Ключевые элементы (без дублирования длинных таблиц — см. типы **`ProfilesWidgetProps`**, **`ProfilesListAction`** в `@april/profile-ui`):

- Вход: `hostContext`, `apiBaseUrl` (или adapter), опционально `accessToken`, `initialCreateEntityTypeId`, `pageSize`, `initialSearch`, `initialTypeId`, `initialSort`, `autoSelectFirst`.
- Выход: `onAction`, `onError`, `onObservability`, `onOpenEntity`.
- Источник списка: только server-side API (раздел «Левая колонка» выше).

### Архитектура кода (task 042, расширение task 065)

```mermaid
flowchart LR
    Host[Host App / AprilHub] -->|hostContext, callbacks| Facade[ProfilesWidget facade]
    Facade --> Api[ProfilesApiWidget]
    Api --> Provider[ProfilesDataProvider]
    Api --> Core[ProfilesWidgetCore]
    Core -->|list| Provider
    Core --> Detail[ProfilesWidgetProfileDetailCore]
    Detail -->|get/create/update/delete| Provider
    Provider -->|OpenAPI SDK| BFF[/admin/profile/api]
```

- `ProfilesWidgetCore`: список слева + композиция **`ProfilesWidgetProfileDetailCore`** справа; без транспорта в Core.
- `ProfilesApiWidget`: wiring host + OpenAPI provider, `ProviderContext`, **`AbortController`** для отмены list/details при смене состояния.
- `ProfilesWidget`: публичный фасад embed для **сборки** master–detail.
- **`ProfilesWidgetProfileDetail`** / **`ProfilesApiWidgetProfileDetail`**: публичные фасады **только** правой колонки + создание (императивный `ref.openCreate()` и др.) — см. [`profiles-widget-profile-detail.md`](./profiles-widget-profile-detail.md).
- `update`: `Core` / деталь передают `expectedVersion` в провайдер.

### Расширяемость (перспектива, без обязательств текущего API)

Host или будущий **registry** смогут подставить альтернативный UI редактирования **документа** при том же списке и том же идентификаторе сущности, если явно зафиксирован контракт: выбор строки, `entityId`, мутации с `expectedVersion` и теми же колбэками безопасности.

## 5) Права доступа и безопасность

- Keycloak / BFF; ABAC на backend; виджет не дублирует IAM. Ошибки API — безопасные сообщения для UI.

## 6) Observability и качество

- Корреляция: [`../../WIDGET_OBSERVABILITY_GUIDE.md`](../../WIDGET_OBSERVABILITY_GUIDE.md). События списка — в разделе «Левая колонка»; события карточки/сохранения — в [`profiles-widget-profile-detail.md`](./profiles-widget-profile-detail.md).

### Release gate (task 047)

- `cd frontend && npm run lint -w @april/profile-ui`
- `cd frontend && npm run test -w @april/profile-ui`
- `cd frontend && npm run build -w @april/profile-ui`
- `go test ./...`
- Тесты: `ProfilesWidgetCore`, `ProfilesWidgetProfileDetailCore`, `openapiProfilesProvider`, smoke `ProfilesWidget` (CRUD, `401/403/409`).

## 7) Ограничения и known issues

- Публичный контракт не поддерживает `entityIds` как source of truth для списка.
- Anti-patterns: не переносить transport в `Core`; не подменять server-side пагинацию полной client-side выборкой (см. раздел про список).

## 8) Артефакты (TASK/PLAN/REPORT + smoke/e2e)

- Выделение `Profiles` из `widget-card`: [`../../../tasks/041-phase-5-widget-card-to-profiles-widget/TASK.md`](../../../tasks/041-phase-5-widget-card-to-profiles-widget/TASK.md), [`../../../tasks/041-phase-5-widget-card-to-profiles-widget/PLAN.md`](../../../tasks/041-phase-5-widget-card-to-profiles-widget/PLAN.md), [`../../../tasks/041-phase-5-widget-card-to-profiles-widget/REPORT.md`](../../../tasks/041-phase-5-widget-card-to-profiles-widget/REPORT.md).
- Production-first baseline: [`../../../tasks/042-phase-6-profiles-widget-production-architecture/TASK.md`](../../../tasks/042-phase-6-profiles-widget-production-architecture/TASK.md), [`../../../tasks/042-phase-6-profiles-widget-production-architecture/PLAN.md`](../../../tasks/042-phase-6-profiles-widget-production-architecture/PLAN.md), [`../../../tasks/042-phase-6-profiles-widget-production-architecture/REPORT.md`](../../../tasks/042-phase-6-profiles-widget-production-architecture/REPORT.md).
- API/SDK list: [`../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/TASK.md`](../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/TASK.md), [`../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/PLAN.md`](../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/PLAN.md), [`../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/REPORT.md`](../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/REPORT.md).
- Core/API refactor: [`../../../tasks/044-phase-6-profiles-widget-core-api-refactor/TASK.md`](../../../tasks/044-phase-6-profiles-widget-core-api-refactor/TASK.md), [`../../../tasks/044-phase-6-profiles-widget-core-api-refactor/PLAN.md`](../../../tasks/044-phase-6-profiles-widget-core-api-refactor/PLAN.md), [`../../../tasks/044-phase-6-profiles-widget-core-api-refactor/REPORT.md`](../../../tasks/044-phase-6-profiles-widget-core-api-refactor/REPORT.md).
- Базовый CRUD: [`../../../tasks/025-phase-4a-profile-profiles-list-crud-widget/TASK.md`](../../../tasks/025-phase-4a-profile-profiles-list-crud-widget/TASK.md).
- UX `widget-card`: [`../../../tasks/040-phase-5-widget-card-layout-modernization/TASK.md`](../../../tasks/040-phase-5-widget-card-layout-modernization/TASK.md).
- Embed UI + версии + имя (051): [`../../../tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/TASK.md`](../../../tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/TASK.md), [`../../../tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/PLAN.md`](../../../tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/PLAN.md), [`../../../tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/REPORT.md`](../../../tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/REPORT.md).
- JSON-документ на DS (058): [`../../../tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/TASK.md`](../../../tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/TASK.md) (зависит от [`057`](../../../tasks/057-phase-7-profile-ui-ds-json-entity-types-integration/TASK.md)).
- RJSF (059): [`../../../tasks/059-phase-7-profiles-widget-rjsf-document-form/TASK.md`](../../../tasks/059-phase-7-profiles-widget-rjsf-document-form/TASK.md), [`REPORT.md`](../../../tasks/059-phase-7-profiles-widget-rjsf-document-form/REPORT.md) (зависит от [`058`](../../../tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/TASK.md)).
- Разнесение спецификации list/detail (062): [`../../../tasks/062-docs-profiles-widget-spec-list-content-assembly/TASK.md`](../../../tasks/062-docs-profiles-widget-spec-list-content-assembly/TASK.md).
- Split npm detail + композиция (065): [`../../../tasks/065-profiles-widget-split-detail-composition/TASK.md`](../../../tasks/065-profiles-widget-split-detail-composition/TASK.md).
