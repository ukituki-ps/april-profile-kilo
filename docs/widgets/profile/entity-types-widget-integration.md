# `entity-types-widget` — интеграция с host (props, события, ошибки)

> Продуктовая сборка и навигация по поверхностям: [`./entity-types-widget.md`](./entity-types-widget.md).

## Общие ссылки

- HostContext / версионирование / чеклист: [`../../WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md), [`../../VERSIONING_AND_COMPATIBILITY.md`](../../VERSIONING_AND_COMPATIBILITY.md), [`../../WIDGET_INTEGRATION_CHECKLIST.md`](../../WIDGET_INTEGRATION_CHECKLIST.md).
- Telemetry §9 (`widget: "entity_types"`): [`../../WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md) §9; типы — `src/observability.ts` в `@april/profile-ui`.
- Корреляция: [`../../WIDGET_OBSERVABILITY_GUIDE.md`](../../WIDGET_OBSERVABILITY_GUIDE.md).

## Публичные props

Публичные props (`EntityTypesWidgetProps` в `@april/profile-ui`, фасад = `EntityTypesApiWidget`):

| Prop | Обяз. | Описание |
|------|--------|----------|
| `hostContext` | да | `ProfileWidgetHostContext`: `tenant`, опционально `auth`, `telemetry.requestId` и др. (см. [`WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md)). |
| `apiBaseUrl` | да | Базовый URL Profile API (часто BFF: `/admin/profile/api`). |
| `accessToken` | нет | Bearer для сгенерированного клиента. |
| `pageSize` | нет | Размер страницы `GET /v1/entities` на вкладке **Upgrade** (по умолчанию `20`). |
| `providerContext` | нет | Переопределение `ProviderContext` без `AbortSignal` (тесты / нестандартный host). |
| `onAction` | нет | См. тип `EntityTypesWidgetAction` в пакете. |
| `onError` | нет | `{ message, requestId?, code? }` — без утечки внутренних деталей API. |
| `onObservability` | нет | `ProfileWidgetTelemetryEvent`; для виджета `widget: "entity_types"` и событий `draft_save_*`, `publish_*`, `upgrade_*`, `batch_upgrade_*`, плюс `list_*` / `details_*`. |
| `onOpenEntity` | нет | `(entityId) => void` — клик по `entity_id` в таблице апгрейда (навигация к `profiles-widget`). |

## События `onAction`

Тип `EntityTypesWidgetAction`:

- `family_created`, `family_patched`, `family_deleted`;
- `draft_saved`, `revision_published`;
- `entity_upgrade_requested`, `entity_upgrade_succeeded`, `entity_upgrade_failed`;
- `batch_upgrade_completed` (агрегаты `succeeded` / `failed` / `processed`).

## Ошибки

`onError`: нормализованный `{ code?, message, requestId? }`; при наличии `request_id` в теле ошибки API его имеет смысл прокинуть в `requestId` для корреляции с логами бэкенда.
