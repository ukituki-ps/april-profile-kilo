import { useMemo, useRef } from "react";
import {
  createOpenApiEntityTypesProvider,
  createOpenApiProfilesProvider,
} from "@april/profile-ui";
import type { ProfileWidgetHostContext, ProviderContext } from "@april/profile-ui";

/**
 * Дублирует wiring из `ProfilesApiWidget`: стабильный OpenAPI-провайдер + `ProviderContext` с токеном через ref.
 * При изменении ApiWidget — синхронизировать вручную.
 */
export function useOpenApiProfilesEmbed(
  apiBaseUrl: string,
  accessToken: string | undefined,
  hostContext: ProfileWidgetHostContext,
) {
  const provider = useMemo(() => createOpenApiProfilesProvider({ apiBaseUrl }), [apiBaseUrl]);
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
  return { provider, providerContext };
}

/**
 * Дублирует wiring из `EntityTypesApiWidget` без кастомного `providerContext`.
 */
export function useOpenApiEntityTypesEmbed(
  apiBaseUrl: string,
  accessToken: string | undefined,
  hostContext: ProfileWidgetHostContext,
) {
  const provider = useMemo(() => createOpenApiEntityTypesProvider({ apiBaseUrl }), [apiBaseUrl]);
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
  return { provider, providerContext };
}
