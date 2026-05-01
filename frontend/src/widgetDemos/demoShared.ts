import type { ProfileWidgetHostContext } from "@april/profile-ui";
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

/** Ссылка на markdown спеки в репозитории (develop). */
export function profileWidgetDocUrl(fileName: string): string {
  return `https://github.com/ukituki-ps/april-profile/blob/develop/docs/widgets/profile/${fileName}`;
}
