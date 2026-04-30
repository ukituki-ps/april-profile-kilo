import { useMemo } from "react";
import { EntityTypesWidgetCore } from "./EntityTypesWidgetCore";
import type { EntityTypesWidgetCoreProps } from "./EntityTypesWidgetCore";
import { createOpenApiEntityTypesProvider } from "../providers/openapiEntityTypesProvider";
import type { ProviderContext } from "../providers/profilesDataProvider";

export type EntityTypesApiWidgetProps = Omit<EntityTypesWidgetCoreProps, "provider"> & {
  apiBaseUrl: string;
  accessToken?: string;
};

export function EntityTypesApiWidget({
  apiBaseUrl,
  accessToken,
  hostContext,
  providerContext,
  pageSize,
  onAction,
  onError,
  onObservability,
  onOpenEntity,
}: EntityTypesApiWidgetProps) {
  // Token must not affect provider identity — recreating the provider retriggers WidgetCore effects (duplicate GETs).
  // Bearer token is read per request from ProviderContext (`mergedProviderContext.auth.accessToken`).
  const provider = useMemo(() => createOpenApiEntityTypesProvider({ apiBaseUrl }), [apiBaseUrl]);
  const mergedProviderContext = useMemo<Omit<ProviderContext, "signal">>(
    () =>
      providerContext ?? {
        tenantId: hostContext.tenant.id,
        auth: {
          accessToken,
          subject: hostContext.auth?.subject,
          roles: hostContext.auth?.roles,
        },
        telemetry: {
          requestId: hostContext.telemetry?.requestId,
          correlationId: hostContext.telemetry?.correlationId,
        },
      },
    [accessToken, hostContext, providerContext],
  );

  return (
    <EntityTypesWidgetCore
      hostContext={hostContext}
      provider={provider}
      providerContext={mergedProviderContext}
      pageSize={pageSize}
      onAction={onAction}
      onError={onError}
      onObservability={onObservability}
      onOpenEntity={onOpenEntity}
    />
  );
}
