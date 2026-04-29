import { ProfilesApiWidget } from "./ProfilesApiWidget";
import type { ProfilesApiWidgetProps } from "./ProfilesApiWidget";

export type ProfilesWidgetProps = ProfilesApiWidgetProps;

export function ProfilesWidget(props: ProfilesWidgetProps) {
  return <ProfilesApiWidget {...props} />;
}
