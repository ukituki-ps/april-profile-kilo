import { describe, expect, it } from "vitest";
import { buildTelemetryIds } from "./observability";
import type { ProfileWidgetHostContext } from "./types";

describe("buildTelemetryIds", () => {
  it("maps requestId and defaults correlation_id to requestId", () => {
    const host: ProfileWidgetHostContext = {
      tenant: { id: "t1" },
      telemetry: { requestId: "rid-1" },
    };
    expect(buildTelemetryIds(host)).toEqual({ request_id: "rid-1", correlation_id: "rid-1" });
  });

  it("keeps explicit correlationId when provided", () => {
    const host: ProfileWidgetHostContext = {
      tenant: { id: "t1" },
      telemetry: { requestId: "rid-1", correlationId: "corr-edge" },
    };
    expect(buildTelemetryIds(host)).toEqual({ request_id: "rid-1", correlation_id: "corr-edge" });
  });
});
