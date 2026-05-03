# Публичный виджет: `profiles-widget-profile-detail`

| Поле | Значение |
|------|----------|
| `profileId` | `entity-profile` |
| `widgetId` | `profiles-widget-profile-detail` (логический; в телеметрии см. ниже) |
| `packageName` | `@april/profile-ui` |
| Экспорты | **`ProfilesWidgetProfileDetail`**, **`ProfilesApiWidgetProfileDetail`**, **`ProfilesWidgetProfileDetailCore`** (+ типы пропсов и **`ProfilesWidgetProfileDetailHandle`**) |

> Сборка со списком слева: [`./profiles-widget.md`](./profiles-widget.md) (раздел про левую колонку и `GET /v1/entities`).

В составном **`profiles-widget`** при виде сетки у `CardListColumn` деталь может монтироваться в **`AprilModal`**; публичный контракт **`ProfilesWidgetProfileDetail`** / **`ProfilesWidgetProfileDetailCore`** от этого не меняется.

## Назначение (две части)

1. **Часть 1 — просмотр и опционально редактирование** выбранного профиля: карточка сущности, версии, сегменты Form / Tree / Source / Schema по текущей спеке. Host может отключить мутации документа и удаление: проп **`documentEditingEnabled`** (по умолчанию `true`) и **`allowProfileDelete`** (по умолчанию `true`).
2. **Часть 2 — создание профиля** (модалка: тип из каталога, имя, начальный документ). Открытие **не привязано только к UI части 1**: host вызывает **`ref.openCreate()`** / **`ref.closeCreate()`** на `forwardRef`-виджете (`ProfilesWidgetProfileDetailHandle`).

## Контракт и провайдер

- Провайдер данных должен реализовать операции **get / create / update / delete** профиля; для версий — `GET /v1/entities/{id}/versions/{version}`; для типов в модалке создания — `GET /v1/entity-types`.
- Для сегмента **Schema** (read-only опубликованная схема) и для режима **Form** (RJSF) желательно наличие у провайдера **`getEntityTypePublishedSchema`** / данных с `GET /v1/entity-types/{id}` — см. реализацию OpenAPI-провайдера в пакете.
- Вход (Core): **`entityId`**, **`listItem`** (строка списка для заголовка/метаданных), **`listItemsForDuplicateCheck`** (проверка имени по уже загруженным строкам), плюс общие поля host/provider как у сборки.
- Колбэки host: `onAction` (`created` / `updated` / `deleted`), `onError`, опционально `onListRevalidate`, `onEntityDeleted`, `onCreatedSelectEntity`, `onProfileUpdatedInList` — полная семантика в [`../../WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md) и типах пакета.

## Права и ошибки

- Источник прав: Keycloak (роли в контуре host/BFF); ABAC на backend; виджет показывает `401/403/409` безопасными сообщениями без утечки внутренних деталей (согласовано с общей карточкой виджета).

## Зависимости и JSON-документ (DS)

- `@april/profile-ui`, `@april/ui` (≥ **0.1.9**).
- **`DensityProvider`** в корне виджета детали.
- Поле **`document`**: один ряд сегментов **`EntityTypesDraftJsonEditor`**: **Form** (RJSF при валидной published-схеме) → **Tree** → **Source** → при наличии у провайдера **`getEntityTypePublishedSchema`** — **Schema** (read-only `published_schema` с `GET /v1/entity-types/{id}`). Режим просмотра без редактирования — те же сегменты в read-only.
- **`AprilJsonValidationSummary`** для **`schemaIssues`**. Стек согласован с задачами **057–059**; минимальная клиентская валидация корня документа: `{ "type": "object" }`.
- Поле **`name`** профиля — отдельный **`TextInput`**; при create значение объединяется с объектом документа.
- `@tabler/icons-react` для иконок действий в карточке (зависимость пакета).

## Observability

- События карточки и сохранения: `details_requested`, `details_failed`, `save_submitted`, `save_succeeded`, `save_failed`.
- Поле **`widget`** в payload по-прежнему **`profiles_list`** (совместимость с существующими дашбордами; отдельный `widgetId` для детального виджета не введён в типах пакета в рамках task 065) — см. [`../../WIDGET_OBSERVABILITY_GUIDE.md`](../../WIDGET_OBSERVABILITY_GUIDE.md).

## Демо в репозитории (`frontend`)

Маршрут **`/demo/surfaces/profiles-widget-profile-detail`**: **`ProfilesWidgetProfileDetail`** с фиксированной тестовой сущностью (сид совпадает с MSW `handlers.ts`), кнопка внешнего **`openCreate()`** и переключатель read-only. Данные — MSW при **`VITE_PROFILE_DEMO_MOCK=true`** (см. [`../../../frontend/README.md`](../../../frontend/README.md)).

## Будущее (вне объёма 065)

Другие доменные виджеты могут иметь **свой аналог** «детали профиля» с тем же UX-разбиением; в этой задаче зафиксирован только **паттерн композиции** и публичный API для **профильного** контура.

## Связанные задачи

- JSON-документ на DS: [`../../../tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/TASK.md`](../../../tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/TASK.md).
- RJSF (`AprilJsonSchemaForm`): [`../../../tasks/059-phase-7-profiles-widget-rjsf-document-form/TASK.md`](../../../tasks/059-phase-7-profiles-widget-rjsf-document-form/TASK.md).
- Split npm + композиция: [`../../../tasks/065-profiles-widget-split-detail-composition/TASK.md`](../../../tasks/065-profiles-widget-split-detail-composition/TASK.md).
