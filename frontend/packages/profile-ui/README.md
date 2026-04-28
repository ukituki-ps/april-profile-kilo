# `@april/profile-ui`

Embeddable React widget package for AprilProfile scenarios in AprilHub/host apps.

## Observability (фаза 4a)

Все виджеты ниже принимают опциональный **`onObservability`**: колбэк с типом `ProfileWidgetTelemetryEvent` (`widget`, `event`, `request_id`, `correlation_id`, опционально `api_request_id`, `meta`). События: **`view_loaded`**, **`save_submitted`**, **`save_succeeded`**, **`save_failed`**. Идентификаторы берутся из `hostContext.telemetry.requestId` и опционально `correlationId` (см. `docs/WIDGET_OBSERVABILITY_GUIDE.md` §3.1). Типы и `emitProfileWidgetTelemetry` экспортируются из пакета.

## Public API

### `EntityProfileWidget`

Props:

- `hostContext` — host/widget v1 context (`tenant`, optional `auth`, optional telemetry fields).
- `entityId` — target entity UUID.
- `apiBaseUrl` — profile API base URL (for BFF flow usually `/admin/profile/api`).
- `accessToken?` — Bearer token passed to generated OpenAPI client.
- `onSaveSuccess?` — callback after successful `PUT /v1/entities/{entityID}`.
- `onError?` — callback with a normalized error message.
- `onObservability?` — единый контур событий (`view_loaded`, `save_*`), см. раздел «Observability».

### `ProfilesListWidget`

Props:

- `hostContext` — host/widget v1 context (`tenant`, optional `auth`, optional telemetry fields).
- `apiBaseUrl` — profile API base URL (for BFF flow usually `/admin/profile/api`).
- `accessToken?` — Bearer token for OpenAPI client.
- `entityIds` — initial entity IDs to load list rows (`GET /v1/entities/{entityID}` for each ID).
- `pageSize?` — client-side pagination size (default: `5`).
- `onAction?` — typed callback for CRUD actions (`created`, `updated`, `deleted`).
- `onError?` — callback with normalized error payload (`401/403/409` are mapped to predictable UX text).
- `onObservability?` — события наблюдаемости, см. раздел «Observability».

### `ProfileInstancesWidget`

Props:

- `hostContext` — host/widget v1 context (`tenant`, optional `auth`, optional telemetry fields).
- `profileId` — selected profile/type ID, all operations are scoped to this context.
- `instanceIds` — instance IDs to load (`GET /v1/entities/{entityID}` for each ID), hidden/unavailable rows are skipped.
- `apiBaseUrl` — profile API base URL (for BFF flow usually `/admin/profile/api`).
- `accessToken?` — Bearer token for OpenAPI client.
- `pageSize?` — client-side pagination size (default: `5`).
- `onAction?` — typed callback for CRUD actions (`created`, `updated`, `deleted`).
- `onOpenInstance?` — navigation callback for opening instance card.
- `onError?` — callback with normalized error payload.
- `onObservability?` — события наблюдаемости, см. раздел «Observability».

### `InstanceHistoryWidget`

Props:

- `hostContext` — host/widget v1 context (`tenant`, optional `auth`, optional telemetry fields).
- `entityId` — target instance ID for append-only history.
- `apiBaseUrl` — profile API base URL (for BFF flow usually `/admin/profile/api`).
- `accessToken?` — Bearer token for OpenAPI client.
- `onError?` — callback with normalized error payload.
- `onObservability?` — для истории эмитится только `view_loaded` (нет мутаций в текущем API).

Notes:

- Versions are loaded from `GET /v1/entities/{entityID}` + `GET /v1/entities/{entityID}/versions/{version}`.
- Diff supports comparison against current or previous version.
- Current API contract has no restore endpoint, so widget is intentionally read-only.

### `ConflictQueueWidget`

Props:

- `hostContext` — host/widget v1 context (`tenant`, optional `auth`, optional telemetry fields).
- `apiBaseUrl` — profile API base URL (for BFF flow usually `/admin/profile/api`).
- `accessToken?` — Bearer token for OpenAPI client (admin realm role required on API).
- `onError?` — callback with normalized error payload (`401/403/404/409` mapped to operator-safe copy).
- `onObservability?` — `view_loaded` после списка; `save_*` для resolve и merge.

Notes:

- Uses admin OpenAPI operations: list conflicts, resolve conflict, merge duplicate entities.
- After success, shows a short audit-oriented summary (entity/version from API responses).

### Generated OpenAPI API client

Package exports generated modules from `src/generated`:

- `OpenAPI` — runtime config (`BASE`, `TOKEN`, etc.).
- `ProfilesService` — public profile API methods generated from `openapi/openapi.yaml`.
- Admin routes (`AdminService` in `src/generated`) are used internally by `ConflictQueueWidget`; regenerate via `npm run generate:api` in this package when OpenAPI changes.

## Usage example

```tsx
import {
  ConflictQueueWidget,
  EntityProfileWidget,
  InstanceHistoryWidget,
  ProfileInstancesWidget,
  ProfilesListWidget,
} from "@april/profile-ui";

<EntityProfileWidget
  hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-1" } }}
  entityId="c7c5e6ea-8787-4ca0-a691-9f4fdc9830ff"
  apiBaseUrl="/admin/profile/api"
  accessToken={accessToken}
  onSaveSuccess={({ entityId, version }) => {
    console.log("saved", entityId, version);
  }}
/>;

<ProfilesListWidget
  hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-2" } }}
  apiBaseUrl="/admin/profile/api"
  accessToken={accessToken}
  entityIds={[
    "c7c5e6ea-8787-4ca0-a691-9f4fdc9830ff",
    "4f18363d-70e8-4814-9d12-5236b18877d0",
  ]}
  pageSize={10}
  onAction={(action) => {
    console.log("profiles list action", action.type);
  }}
/>;

<ProfileInstancesWidget
  hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-3" } }}
  profileId="89ac9958-fec8-43d7-8908-f0438e8e0e39"
  instanceIds={[
    "c7c5e6ea-8787-4ca0-a691-9f4fdc9830ff",
    "4f18363d-70e8-4814-9d12-5236b18877d0",
  ]}
  apiBaseUrl="/admin/profile/api"
  accessToken={accessToken}
  onAction={(action) => {
    console.log("instances action", action.type);
  }}
  onOpenInstance={(entityId) => {
    console.log("open instance", entityId);
  }}
/>;

<InstanceHistoryWidget
  hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-4" } }}
  entityId="c7c5e6ea-8787-4ca0-a691-9f4fdc9830ff"
  apiBaseUrl="/admin/profile/api"
  accessToken={accessToken}
  onError={(payload) => {
    console.log("history error", payload.message);
  }}
/>;

<ConflictQueueWidget
  hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-5" } }}
  apiBaseUrl="/admin/profile/api"
  accessToken={accessToken}
  onError={(payload) => {
    console.log("conflicts error", payload.message);
  }}
/>;
```

## Local commands

From `frontend/` root:

```bash
npm run lint -w @april/profile-ui
npm run test -w @april/profile-ui
npm run build -w @april/profile-ui
```

`build` runs OpenAPI regeneration before TypeScript compile.
