# `@april/profile-ui`

Embeddable React widgets for AprilProfile in AprilHub/host apps. Публичная поверхность пакета: **`ProfilesWidget`** (`profiles-widget`) и **`EntityTypesWidget`** (`entity-types-widget`), плюс провайдеры/OpenAPI-клиент для кастомного wiring.

## Observability

Виджеты принимают опциональный **`onObservability`**: колбэк с типом `ProfileWidgetTelemetryEvent` (`widget`, `event`, `request_id`, `correlation_id`, опционально `api_request_id`, `meta`). Базовые события: **`view_loaded`**, **`list_requested`**, **`list_succeeded`**, **`list_failed`**, **`details_requested`**, **`details_failed`**, **`save_submitted`**, **`save_succeeded`**, **`save_failed`**. Для **`entity_types`** дополнительно: **`draft_save_*`**, **`publish_*`**, **`upgrade_*`**, **`batch_upgrade_*`** (см. `ProfileWidgetTelemetryEventName` в `src/observability.ts`). Идентификаторы — из `hostContext.telemetry.requestId` и опционально `correlationId` (см. `docs/WIDGET_OBSERVABILITY_GUIDE.md` §3.1). Экспортируются `emitProfileWidgetTelemetry`, `buildTelemetryIds` и типы событий.

Стабильные значения поля **`widget`**: `profiles_list`, `entity_types`.

## `ProfilesWidget`

Фасад над **`ProfilesApiWidget`** → **`ProfilesWidgetCore`** + `createOpenApiProfilesProvider`.

Props (см. также `ProfilesWidgetProps` в исходниках):

- `hostContext` — контекст host (`tenant`, опционально `auth`, telemetry).
- `apiBaseUrl`, `accessToken?` — база API и Bearer для OpenAPI-клиента.
- `pageSize?`, `initialSearch?`, `initialTypeId?`, `initialSort?`, `initialCreateEntityTypeId?`, `autoSelectFirst?`
- `onAction?`, `onError?`, `onOpenEntity?`, `onObservability?`

Поведение: master-detail (список профилей + карточка), server-side list/search/filter, CRUD, версии через провайдер.

Экспорты для кастомного wiring: **`ProfilesWidgetCore`**, **`ProfilesApiWidget`**, **`ProfilesDataProvider`**, **`createOpenApiProfilesProvider`**.

## `EntityTypesWidget`

Фасад каталога семейств типов (`widgetId`: `entity-types-widget`): **`EntityTypesWidgetCore`** + **`EntityTypesApiWidget`** + **`createOpenApiEntityTypesProvider`**.

Props: как у профилей по `hostContext` / `apiBaseUrl` / `accessToken`, плюс `pageSize?`, `providerContext?`, `onAction?`, `onError?`, `onObservability?`, `onOpenEntity?`.

Экспорты: **`EntityTypesWidgetCore`**, **`EntityTypesApiWidget`**, **`EntityTypesDataProvider`**, **`createOpenApiEntityTypesProvider`**.

## Generated OpenAPI client

- `OpenAPI` — runtime config (`BASE`, `TOKEN`, …).
- `ProfilesService` — публичные методы профилей из `openapi/openapi.yaml`.
- Регенерация: `npm run generate:api` в этом пакете при изменении OpenAPI.

## Usage example

```tsx
import { EntityTypesWidget, ProfilesWidget } from "@april/profile-ui";

<ProfilesWidget
  hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-1" } }}
  apiBaseUrl="/admin/profile/api"
  accessToken={accessToken}
  onAction={(action) => {
    console.log("profiles action", action.type);
  }}
/>;

<EntityTypesWidget
  hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-2" } }}
  apiBaseUrl="/admin/profile/api"
  accessToken={accessToken}
/>;
```

## Local commands

Из корня `frontend/`:

```bash
npm run lint -w @april/profile-ui
npm run test -w @april/profile-ui
npm run build -w @april/profile-ui
```

`build` перед компиляцией запускает регенерацию OpenAPI.
