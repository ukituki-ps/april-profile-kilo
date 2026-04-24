# `@april/profile-ui`

Embeddable React widget package for AprilProfile scenarios in AprilHub/host apps.

## Public API

### `EntityProfileWidget`

Props:

- `hostContext` — host/widget v1 context (`tenant`, optional `auth`, optional telemetry fields).
- `entityId` — target entity UUID.
- `apiBaseUrl` — profile API base URL (for BFF flow usually `/admin/profile/api`).
- `accessToken?` — Bearer token passed to generated OpenAPI client.
- `onSaveSuccess?` — callback after successful `PUT /v1/entities/{entityID}`.
- `onError?` — callback with a normalized error message.

### `ProfilesListWidget`

Props:

- `hostContext` — host/widget v1 context (`tenant`, optional `auth`, optional telemetry fields).
- `apiBaseUrl` — profile API base URL (for BFF flow usually `/admin/profile/api`).
- `accessToken?` — Bearer token for OpenAPI client.
- `entityIds` — initial entity IDs to load list rows (`GET /v1/entities/{entityID}` for each ID).
- `pageSize?` — client-side pagination size (default: `5`).
- `onAction?` — typed callback for CRUD actions (`created`, `updated`, `deleted`).
- `onError?` — callback with normalized error payload (`401/403/409` are mapped to predictable UX text).

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

### Generated OpenAPI API client

Package exports generated modules from `src/generated`:

- `OpenAPI` — runtime config (`BASE`, `TOKEN`, etc.).
- `ProfilesService` — profile API methods generated from `openapi/openapi.yaml`.

## Usage example

```tsx
import { EntityProfileWidget, ProfilesListWidget } from "@april/profile-ui";
import { ProfileInstancesWidget } from "@april/profile-ui";

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
```

## Local commands

From `frontend/` root:

```bash
npm run lint -w @april/profile-ui
npm run test -w @april/profile-ui
npm run build -w @april/profile-ui
```

`build` runs OpenAPI regeneration before TypeScript compile.
