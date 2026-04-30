export type ProfileWidgetHostContext = {
  tenant: { id: string };
  auth?: {
    subject?: string;
    roles?: string[];
    tokenRef?: string;
  };
  theme?: "light" | "dark" | "system";
  locale?: string;
  telemetry?: {
    requestId: string;
    /** Опционально: сквозной correlation id (например edge / BFF); иначе в событиях подставляется `requestId`. */
    correlationId?: string;
    traceId?: string;
    spanId?: string;
  };
};

export type SaveSuccessPayload = {
  entityId: string;
  version: number;
};

export type ProfilesListItem = {
  entityId: string;
  entityTypeId: string;
  version: number;
  updatedAt: string;
  preview: string;
};

export type ProfilesListAction =
  | { type: "created"; item: ProfilesListItem }
  | { type: "updated"; item: ProfilesListItem }
  | { type: "deleted"; entityId: string };

export type ProfileInstanceListItem = {
  entityId: string;
  profileId: string;
  version: number;
  updatedAt: string;
  preview: string;
};

export type ProfileInstancesAction =
  | { type: "created"; item: ProfileInstanceListItem }
  | { type: "updated"; item: ProfileInstanceListItem }
  | { type: "deleted"; entityId: string };

export type EntityTypesWidgetAction =
  | { type: "family_created"; familyId: string; namespace: string; code: string }
  | { type: "family_patched"; familyId: string }
  | { type: "family_deleted"; familyId: string }
  | { type: "draft_saved"; familyId: string; draftSchemaVersion: number }
  | { type: "revision_published"; familyId: string }
  | { type: "entity_upgrade_requested"; entityId: string }
  | { type: "entity_upgrade_succeeded"; entityId: string }
  | { type: "entity_upgrade_failed"; entityId: string; message: string }
  | {
      type: "batch_upgrade_completed";
      entityTypeId: string;
      succeeded: number;
      failed: number;
      processed: number;
    };
