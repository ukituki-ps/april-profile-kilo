import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { InstanceHistoryWidget } from "./InstanceHistoryWidget";

const apiBaseUrl = "http://localhost:8080/admin/profile/api";
const entityId = "c7c5e6ea-8787-4ca0-a691-9f4fdc9830ff";

const versionPayload = (version: number, document: Record<string, unknown>) => ({
  entity_id: entityId,
  entity_type_id: "89ac9958-fec8-43d7-8908-f0438e8e0e39",
  version,
  document,
  created_at: `2026-04-2${version}T10:00:00Z`,
  external_refs: [{ source_system: "hris", external_id: `ext-${version}` }],
});

const server = setupServer(
  http.get(`${apiBaseUrl}/v1/entities/${entityId}`, () =>
    HttpResponse.json(
      versionPayload(3, { first_name: "Carol", department: "Ops", _meta: { updated_by: "operator-3" } }),
    ),
  ),
  http.get(`${apiBaseUrl}/v1/entities/${entityId}/versions/1`, () =>
    HttpResponse.json(versionPayload(1, { first_name: "Alice", _meta: { updated_by: "operator-1" } })),
  ),
  http.get(`${apiBaseUrl}/v1/entities/${entityId}/versions/2`, () =>
    HttpResponse.json(versionPayload(2, { first_name: "Bob", _meta: { updated_by: "operator-2" } })),
  ),
  http.get(`${apiBaseUrl}/v1/entities/${entityId}/versions/3`, () =>
    HttpResponse.json(
      versionPayload(3, { first_name: "Carol", department: "Ops", _meta: { updated_by: "operator-3" } }),
    ),
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("InstanceHistoryWidget", () => {
  it("renders timeline and diff against previous version", async () => {
    render(
      <MantineProvider>
        <InstanceHistoryWidget
          hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-history-1" } }}
          entityId={entityId}
          apiBaseUrl={apiBaseUrl}
        />
      </MantineProvider>,
    );

    expect(await screen.findByText("Selected version: v3")).toBeInTheDocument();
    expect(screen.getByText("operator-3")).toBeInTheDocument();
    expect(screen.getByText("department")).toBeInTheDocument();
    expect(screen.getByText(/undefined/)).toBeInTheDocument();
    expect(
      screen.getByText(/Restore is unavailable in the current API contract/i),
    ).toBeInTheDocument();
  });

  it("switches selected version and compares with current version", async () => {
    render(
      <MantineProvider>
        <InstanceHistoryWidget
          hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-history-2" } }}
          entityId={entityId}
          apiBaseUrl={apiBaseUrl}
        />
      </MantineProvider>,
    );

    await screen.findByText("Selected version: v3");
    const viewButtons = screen.getAllByRole("button", { name: "View" });
    fireEvent.click(viewButtons[2]);

    expect(await screen.findByText("Selected version: v1")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Compare with"), {
      target: { value: "current" },
    });
    expect(await screen.findByText("Diff against current version")).toBeInTheDocument();
    expect(screen.getByText("first_name")).toBeInTheDocument();
  });
});
