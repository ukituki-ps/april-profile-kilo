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
