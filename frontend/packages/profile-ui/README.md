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

### Generated OpenAPI API client

Package exports generated modules from `src/generated`:

- `OpenAPI` — runtime config (`BASE`, `TOKEN`, etc.).
- `DefaultService` — methods generated from `openapi/openapi.yaml`.

## Usage example

```tsx
import { EntityProfileWidget } from "@april/profile-ui";

<EntityProfileWidget
  hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-1" } }}
  entityId="c7c5e6ea-8787-4ca0-a691-9f4fdc9830ff"
  apiBaseUrl="/admin/profile/api"
  accessToken={accessToken}
  onSaveSuccess={({ entityId, version }) => {
    console.log("saved", entityId, version);
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
