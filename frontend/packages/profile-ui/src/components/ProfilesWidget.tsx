import { ProfilesListWidget } from "./ProfilesListWidget";
import type { ProfilesListWidgetProps } from "./ProfilesListWidget";

export type ProfilesWidgetProps = ProfilesListWidgetProps;

export function ProfilesWidget(props: ProfilesWidgetProps) {
  return <ProfilesListWidget {...props} />;
}
