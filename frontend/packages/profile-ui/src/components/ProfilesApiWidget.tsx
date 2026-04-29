import { useMemo } from "react";
import { ProfilesWidgetCore } from "./ProfilesWidgetCore";
import type { ProfilesWidgetCoreProps } from "./ProfilesWidgetCore";
import { createOpenApiProfilesProvider } from "../providers/openapiProfilesProvider";

export type ProfilesApiWidgetProps = Omit<ProfilesWidgetCoreProps, "provider"> & {
  apiBaseUrl: string;
  accessToken?: string;
};

export function ProfilesApiWidget({
  apiBaseUrl,
  accessToken,
  hostContext,
  pageSize,
  initialSearch,
  initialTypeId,
  onAction,
  onError,
  onObservability,
}: ProfilesApiWidgetProps) {
  const provider = useMemo(
    () => createOpenApiProfilesProvider({ apiBaseUrl, accessToken }),
    [accessToken, apiBaseUrl],
  );

  return (
    <ProfilesWidgetCore
      hostContext={hostContext}
      provider={provider}
      pageSize={pageSize}
      initialSearch={initialSearch}
      initialTypeId={initialTypeId}
      onAction={onAction}
      onError={onError}
      onObservability={onObservability}
    />
  );
}
