import { ProfilesWidget } from "./ProfilesWidget";
import type { ProfilesWidgetProps } from "./ProfilesWidget";

export type ProfilesListWidgetProps = ProfilesWidgetProps;

/**
 * Legacy alias for backward import compatibility.
 * New integrations should prefer ProfilesWidget.
 */
export function ProfilesListWidget(props: ProfilesListWidgetProps) {
  return <ProfilesWidget {...props} />;
}
