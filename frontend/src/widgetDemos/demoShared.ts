import type { ProfileWidgetHostContext, ProfilesListItem } from "@april/profile-ui";
import { isDemoMswEnabled } from "../mocks/demoEnv";

export function useDemoApiEnv() {
  const apiBaseUrl = import.meta.env.VITE_PROFILE_API_BASE_URL ?? "/admin/profile/api";
  const accessToken = import.meta.env.VITE_PROFILE_ACCESS_TOKEN;
  const demoMock = isDemoMswEnabled();
  return { apiBaseUrl, accessToken, demoMock };
}

/** Совпадает с MSW seed в `handlers.ts` (tenant id только для UI). */
export const DEMO_PROFILES_HOST: ProfileWidgetHostContext = {
  tenant: { id: "demo-tenant" },
  telemetry: { requestId: "local-demo-req-list" },
};

export const DEMO_ENTITY_TYPES_HOST: ProfileWidgetHostContext = {
  tenant: { id: "demo-tenant" },
  telemetry: { requestId: "local-demo-req-entity-types" },
};

const jp = (name: string) => JSON.stringify({ name });

/** Совпадает с MSW seed в `src/mocks/handlers.ts` (для standalone `ProfilesWidgetProfileDetail`). */
export const DEMO_PROFILE_SEED_E1 = "c7c5e6ea-8787-4ca0-a691-9f4fdc9830ff";
const DEMO_PROFILE_SEED_E2 = "4f18363d-70e8-4814-9d12-5236b18877d0";
const DEMO_PROFILE_SEED_E3 = "d6f55c6c-6ea8-4ad2-b42b-7e7eefaf55a3";
const DEMO_ENTITY_TYPE_A = "89ac9958-fec8-43d7-8908-f0438e8e0e39";
const DEMO_ENTITY_TYPE_B = "7fd4f598-c6a7-4b44-9fd8-e8cb2e65d6ad";

export const DEMO_PROFILES_SEED_LIST_ITEMS: ProfilesListItem[] = [
  {
    entityId: DEMO_PROFILE_SEED_E1,
    entityTypeId: DEMO_ENTITY_TYPE_A,
    version: 1,
    updatedAt: "2026-04-24T10:00:00Z",
    preview: jp("Acme Corp"),
  },
  {
    entityId: DEMO_PROFILE_SEED_E2,
    entityTypeId: DEMO_ENTITY_TYPE_A,
    version: 1,
    updatedAt: "2026-04-24T10:01:00Z",
    preview: jp("Contoso Ltd"),
  },
  {
    entityId: DEMO_PROFILE_SEED_E3,
    entityTypeId: DEMO_ENTITY_TYPE_B,
    version: 1,
    updatedAt: "2026-04-24T10:02:00Z",
    preview: jp("Order #1042"),
  },
];

/** Ссылка на markdown спеки в репозитории (develop). */
export function profileWidgetDocUrl(fileName: string): string {
  return `https://github.com/ukituki-ps/april-profile/blob/develop/docs/widgets/profile/${fileName}`;
}
