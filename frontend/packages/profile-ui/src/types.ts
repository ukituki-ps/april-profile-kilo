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
