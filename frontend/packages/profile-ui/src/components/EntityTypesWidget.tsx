import { EntityTypesApiWidget } from "./EntityTypesApiWidget";
import type { EntityTypesApiWidgetProps } from "./EntityTypesApiWidget";

export type EntityTypesWidgetProps = EntityTypesApiWidgetProps;

/**
 * Публичный фасад embed-виджета каталога типов сущностей (`widgetId`: `entity-types-widget`).
 * См. `docs/widgets/profile/entity-types-widget.md` (сборка) и под-спеки catalog / schema-admin / entities-upgrade / integration в том же каталоге.
 */
export function EntityTypesWidget(props: EntityTypesWidgetProps) {
  return <EntityTypesApiWidget {...props} />;
}
