import { useMemo, useRef } from "react";
import { ProfilesWidgetCore } from "./ProfilesWidgetCore";
import type { ProfilesWidgetCoreProps } from "./ProfilesWidgetCore";
import { createOpenApiProfilesProvider } from "../providers/openapiProfilesProvider";
import type { ProviderContext } from "../providers/profilesDataProvider";

export type ProfilesApiWidgetProps = Omit<ProfilesWidgetCoreProps, "provider"> & {
  apiBaseUrl: string;
  accessToken?: string;
};

export function ProfilesApiWidget({
  apiBaseUrl,
  accessToken,
  hostContext,
  layout,
  initialCreateEntityTypeId,
  pageSize,
  initialSearch,
  initialTypeId,
  initialSort,
  autoSelectFirst,
  onAction,
  onError,
  onObservability,
  onOpenEntity,
}: ProfilesApiWidgetProps) {
  // Stable provider: token comes from `providerContext` per request, not from provider instance identity.
  const provider = useMemo(() => createOpenApiProfilesProvider({ apiBaseUrl }), [apiBaseUrl]);
  // Keycloak updates `accessToken` often; it must NOT recreate this object (WidgetCore effects + useMemo churn).
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;
  const providerContext = useMemo<Omit<ProviderContext, "signal">>(
    () => ({
      tenantId: hostContext.tenant.id,
      auth: {
        get accessToken(): string | undefined {
          return accessTokenRef.current;
        },
        subject: hostContext.auth?.subject,
        roles: hostContext.auth?.roles,
      },
      telemetry: {
        requestId: hostContext.telemetry?.requestId,
        correlationId: hostContext.telemetry?.correlationId,
      },
    }),
    [
      hostContext.tenant.id,
      hostContext.auth?.subject,
      hostContext.auth?.roles,
      hostContext.telemetry?.requestId,
      hostContext.telemetry?.correlationId,
    ],
  );

  return (
    <ProfilesWidgetCore
      hostContext={hostContext}
      provider={provider}
      providerContext={providerContext}
      layout={layout}
      initialCreateEntityTypeId={initialCreateEntityTypeId}
      pageSize={pageSize}
      initialSearch={initialSearch}
      initialTypeId={initialTypeId}
      initialSort={initialSort}
      autoSelectFirst={autoSelectFirst}
      onAction={onAction}
      onError={onError}
      onObservability={onObservability}
      onOpenEntity={onOpenEntity}
    />
  );
}
