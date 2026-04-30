import type { ProfileWidgetHostContext } from "./types";

/** Стабильные идентификаторы виджетов для логов/аналитики (snake_case). */
export type ProfileWidgetTelemetryKind = "profiles_list" | "entity_types";

/** Единый минимум событий фазы 4a для `@april/profile-ui`. */
export type ProfileWidgetTelemetryEventName =
  | "view_loaded"
  | "list_requested"
  | "list_succeeded"
  | "list_failed"
  | "details_requested"
  | "details_failed"
  | "save_submitted"
  | "save_succeeded"
  | "save_failed"
  /** Каталог семейств типов (задача 054). */
  | "draft_save_submitted"
  | "draft_save_succeeded"
  | "draft_save_failed"
  | "publish_submitted"
  | "publish_succeeded"
  | "publish_failed"
  | "upgrade_submitted"
  | "upgrade_succeeded"
  | "upgrade_failed"
  | "batch_upgrade_submitted"
  | "batch_upgrade_completed";

export type ProfileWidgetTelemetryEvent = {
  widget: ProfileWidgetTelemetryKind;
  event: ProfileWidgetTelemetryEventName;
  /** Корреляция host → BFF (`HostContext.telemetry.requestId`). */
  request_id?: string;
  /** Сквозная корреляция; при отсутствии в host совпадает с `request_id`. */
  correlation_id?: string;
  /** `request_id` из JSON-тела ошибки API, если отличается от host correlation. */
  api_request_id?: string;
  meta?: Record<string, string | number | boolean | null | undefined>;
};

export type ProfileWidgetObservabilityHandler = (event: ProfileWidgetTelemetryEvent) => void;

export function buildTelemetryIds(
  hostContext: ProfileWidgetHostContext,
): Pick<ProfileWidgetTelemetryEvent, "request_id" | "correlation_id"> {
  const t = hostContext.telemetry;
  const request_id = t?.requestId;
  const correlation_id = t?.correlationId ?? request_id;
  return { request_id, correlation_id };
}

/** Вызывает `onObservability`, если передан; иначе no-op (host подключает канал сам). */
export function emitProfileWidgetTelemetry(
  onObservability: ProfileWidgetObservabilityHandler | undefined,
  hostContext: ProfileWidgetHostContext,
  partial: Omit<ProfileWidgetTelemetryEvent, "request_id" | "correlation_id"> &
    Partial<Pick<ProfileWidgetTelemetryEvent, "api_request_id">>,
): void {
  if (!onObservability) {
    return;
  }
  const ids = buildTelemetryIds(hostContext);
  onObservability({
    ...ids,
    ...partial,
  });
}
