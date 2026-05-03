import { forwardRef } from "react";
import {
  ProfilesApiWidgetProfileDetail,
  type ProfilesApiWidgetProfileDetailProps,
} from "./ProfilesApiWidgetProfileDetail";
import type { ProfilesWidgetProfileDetailHandle } from "./ProfilesWidgetProfileDetailCore";

export type ProfilesWidgetProfileDetailProps = ProfilesApiWidgetProfileDetailProps;

export const ProfilesWidgetProfileDetail = forwardRef<
  ProfilesWidgetProfileDetailHandle,
  ProfilesWidgetProfileDetailProps
>(function ProfilesWidgetProfileDetail(props, ref) {
  return <ProfilesApiWidgetProfileDetail ref={ref} {...props} />;
});
