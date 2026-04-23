import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, expect, it, vi, afterAll, afterEach, beforeAll } from "vitest";
import { EntityProfileWidget } from "./EntityProfileWidget";

const entityId = "c7c5e6ea-8787-4ca0-a691-9f4fdc9830ff";
const apiBaseUrl = "http://localhost:8080/admin/profile/api";

const server = setupServer(
  http.get(`${apiBaseUrl}/v1/entities/${entityId}`, () =>
    HttpResponse.json({
      entity_id: entityId,
      entity_type_id: "89ac9958-fec8-43d7-8908-f0438e8e0e39",
      version: 1,
      document: { first_name: "Jane" },
      created_at: "2026-04-23T10:00:00Z",
      external_refs: [],
    }),
  ),
  http.put(`${apiBaseUrl}/v1/entities/${entityId}`, async ({ request }) => {
    const body = (await request.json()) as { document: Record<string, unknown> };
    return HttpResponse.json({
      entity_id: entityId,
      entity_type_id: "89ac9958-fec8-43d7-8908-f0438e8e0e39",
      version: 2,
      document: body.document,
      created_at: "2026-04-23T10:00:00Z",
      external_refs: [],
    });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("EntityProfileWidget", () => {
  it("calls onSaveSuccess after successful save", async () => {
    const onSaveSuccess = vi.fn();

    render(
      <MantineProvider>
        <EntityProfileWidget
          hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-1" } }}
          entityId={entityId}
          apiBaseUrl={apiBaseUrl}
          onSaveSuccess={onSaveSuccess}
        />
      </MantineProvider>,
    );

    expect(await screen.findByText(/Current version: 1/i)).toBeInTheDocument();
    const editor = screen.getByLabelText(/Profile document \(JSON\)/i);
    fireEvent.change(editor, { target: { value: JSON.stringify({ first_name: "Alice" }) } });
    fireEvent.click(screen.getByRole("button", { name: /Save profile/i }));

    await waitFor(() => {
      expect(onSaveSuccess).toHaveBeenCalledWith({ entityId, version: 2 });
    });
    expect(await screen.findByText(/Current version: 2/i)).toBeInTheDocument();
  });

  it("shows validation error for invalid json", async () => {
    render(
      <MantineProvider>
        <EntityProfileWidget
          hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-2" } }}
          entityId={entityId}
          apiBaseUrl={apiBaseUrl}
        />
      </MantineProvider>,
    );

    expect(await screen.findByText(/Current version: 1/i)).toBeInTheDocument();
    const editor = screen.getByLabelText(/Profile document \(JSON\)/i);
    fireEvent.change(editor, { target: { value: "{not json}" } });
    fireEvent.click(screen.getByRole("button", { name: /Save profile/i }));
    expect(await screen.findByText(/Document must be valid JSON/i)).toBeInTheDocument();
  });
});
