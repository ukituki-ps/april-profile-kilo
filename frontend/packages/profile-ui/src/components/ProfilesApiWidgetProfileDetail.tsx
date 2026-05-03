import { forwardRef, useMemo, useRef } from "react";
import { createOpenApiProfilesProvider } from "../providers/openapiProfilesProvider";
import type { ProviderContext } from "../providers/profilesDataProvider";
import {
  ProfilesWidgetProfileDetailCore,
  type ProfilesWidgetProfileDetailCoreProps,
  type ProfilesWidgetProfileDetailHandle,
} from "./ProfilesWidgetProfileDetailCore";

export type ProfilesApiWidgetProfileDetailProps = Omit<ProfilesWidgetProfileDetailCoreProps, "provider"> & {
  apiBaseUrl: string;
  accessToken?: string;
};

export const ProfilesApiWidgetProfileDetail = forwardRef<
  ProfilesWidgetProfileDetailHandle,
  ProfilesApiWidgetProfileDetailProps
>(function ProfilesApiWidgetProfileDetail(
  { apiBaseUrl, accessToken, hostContext, ...rest },
  ref,
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

  return (
    <ProfilesWidgetProfileDetailCore
      ref={ref}
      hostContext={hostContext}
      provider={provider}
      providerContext={providerContext}
      {...rest}
    />
  );
});
