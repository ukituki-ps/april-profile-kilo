# `profiles-widget` — карточка профиля и документ (правая колонка)

> Точка входа по виджету: [`./profiles-widget.md`](./profiles-widget.md). Список и контракт `GET /v1/entities`: [`./profiles-widget-list.md`](./profiles-widget-list.md).

## Назначение

После выбора строки в списке отображается **карточка профиля**: выбор версии (исторические версии read-only), сохранение нового снимка как **следующей версии (+1)** с передачей **`expectedVersion`** в провайдер (optimistic concurrency), просмотр и редактирование **JSON-документа** на компонентах **`@april/ui`**, действия через иконки, удаление профиля. **Создание** профиля — модалка: тип сущности из каталога `GET /v1/entity-types`, имя профиля и начальный документ.

## Контракт и провайдер

- Провайдер данных должен реализовать операции **get / create / update / delete** профиля; для версий — `GET /v1/entities/{id}/versions/{version}`; для типов в модалке создания — `GET /v1/entity-types`.
- Для сегмента **Schema** (read-only опубликованная схема) и для режима **Form** (RJSF) желательно наличие у провайдера **`getEntityTypePublishedSchema`** / данных с `GET /v1/entity-types/{id}` — см. реализацию OpenAPI-провайдера в пакете.
- Колбэки host: `onAction` (`created` / `updated` / `deleted`), `onError`, `onOpenEntity` — полная таблица и семантика в [`../../WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md) и типах пакета.

## Права и ошибки

- Источник прав: Keycloak (роли в контуре host/BFF); ABAC на backend; виджет показывает `401/403/409` безопасными сообщениями без утечки внутренних деталей (согласовано с общей карточкой виджета).

## Зависимости и JSON-документ (DS)

- `@april/profile-ui`, `@april/ui` (≥ **0.1.6**).
- **`DensityProvider`** в корне виджета (общий со списком).
- Поле **`document`**: один ряд сегментов **`EntityTypesDraftJsonEditor`**: **Form** (RJSF при валидной published-схеме) → **Tree** → **Source** → при наличии у провайдера **`getEntityTypePublishedSchema`** — **Schema** (read-only `published_schema` с `GET /v1/entity-types/{id}`). Режим просмотра без редактирования — те же сегменты в read-only.
- **`AprilJsonValidationSummary`** для **`schemaIssues`**. Стек согласован с задачами **057–059**; минимальная клиентская валидация корня документа: `{ "type": "object" }`.
- Поле **`name`** профиля — отдельный **`TextInput`**; при create значение объединяется с объектом документа.
- `@tabler/icons-react` для иконок действий в карточке (зависимость пакета).

## Observability

- События карточки и сохранения: `details_requested`, `details_failed`, `save_submitted`, `save_succeeded`, `save_failed`; `widget` = `profiles_list` (backward-compatible telemetry key) — см. [`../../WIDGET_OBSERVABILITY_GUIDE.md`](../../WIDGET_OBSERVABILITY_GUIDE.md).

## Связанные задачи

- JSON-документ на DS: [`../../../tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/TASK.md`](../../../tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/TASK.md).
- RJSF (`AprilJsonSchemaForm`): [`../../../tasks/059-phase-7-profiles-widget-rjsf-document-form/TASK.md`](../../../tasks/059-phase-7-profiles-widget-rjsf-document-form/TASK.md).
