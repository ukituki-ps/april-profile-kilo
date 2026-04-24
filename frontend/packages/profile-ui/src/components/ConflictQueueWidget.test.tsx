import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { ConflictQueueWidget } from "./ConflictQueueWidget";

const apiBaseUrl = "http://localhost:8080/admin/profile/api";
const conflictId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const entityId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

const conflictRow = {
  id: conflictId,
  entity_id: entityId,
  status: "open" as const,
  namespace: "core",
  field_key: "title",
  existing_value: { v: 1 },
  incoming_value: { v: 2 },
  existing_source: "hris",
  incoming_source: "crm",
  reason: "authority_mismatch",
  created_at: "2026-04-24T12:00:00Z",
};

const server = setupServer(
  http.get(`${apiBaseUrl}/v1/admin/profile-conflicts`, () =>
    HttpResponse.json({
      items: [
        conflictRow,
        {
          ...conflictRow,
          id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
          entity_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
          status: "resolved",
        },
      ],
    }),
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("ConflictQueueWidget", () => {
  it("renders conflict list and filters between open and all", async () => {
    render(
      <MantineProvider>
        <ConflictQueueWidget
          hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-cq-1" } }}
          apiBaseUrl={apiBaseUrl}
        />
      </MantineProvider>,
    );

    expect(await screen.findByText("authority_mismatch")).toBeInTheDocument();
    expect(screen.getByText("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")).toBeInTheDocument();
    expect(screen.queryByText("dddddddd-dddd-dddd-dddd-dddddddddddd")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "all" } });
    expect(await screen.findByText("dddddddd-dddd-dddd-dddd-dddddddddddd")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "open" } });
    await waitFor(() => {
      expect(screen.queryByText("dddddddd-dddd-dddd-dddd-dddddddddddd")).not.toBeInTheDocument();
    });
  });

  it("maps 403 on list load to access denied copy", async () => {
    server.use(
      http.get(`${apiBaseUrl}/v1/admin/profile-conflicts`, () =>
        HttpResponse.json({ code: "forbidden", message: "nope", request_id: "rid-403" }, { status: 403 }),
      ),
    );

    render(
      <MantineProvider>
        <ConflictQueueWidget
          hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-cq-2" } }}
          apiBaseUrl={apiBaseUrl}
        />
      </MantineProvider>,
    );

    expect(
      await screen.findByText(/Access denied\. Admin realm role/i),
    ).toBeInTheDocument();
    expect(screen.getByText("rid-403")).toBeInTheDocument();
  });

  it("submits resolve and shows audit summary", async () => {
    server.use(
      http.post(`${apiBaseUrl}/v1/admin/profile-conflicts/${conflictId}/resolve`, async ({ request }) => {
        const body = (await request.json()) as { resolution: unknown; notes?: string };
        expect(body.resolution).toEqual({ picked: true });
        expect(body.notes).toBe("from test");

        return HttpResponse.json({
          entity_id: entityId,
          entity_type_id: "etype-1",
          version: 7,
          document: { title: { picked: true } },
          created_at: "2026-04-24T12:05:00Z",
          external_refs: [],
        });
      }),
    );

    render(
      <MantineProvider>
        <ConflictQueueWidget
          hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-cq-3" } }}
          apiBaseUrl={apiBaseUrl}
        />
      </MantineProvider>,
    );

    await screen.findByText("authority_mismatch");
    fireEvent.click(screen.getByText("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));

    fireEvent.click(screen.getByRole("button", { name: /Resolve conflict/i }));

    const resolutionBox = await screen.findByLabelText(/Resolution value/i);
    fireEvent.change(resolutionBox, { target: { value: '{"picked":true}' } });
    fireEvent.change(screen.getByLabelText(/Notes \(optional\)/i), { target: { value: "from test" } });
    fireEvent.click(screen.getByRole("button", { name: /Confirm resolve/i }));

    const auditAlert = await screen.findByRole("alert", { name: /Last operation \(audit summary\)/i });
    expect(within(auditAlert).getByText(/Resolved conflict/i)).toBeInTheDocument();
    expect(within(auditAlert).getByText(/new profile version/i)).toBeInTheDocument();
    expect(within(auditAlert).getAllByText("7").length).toBeGreaterThanOrEqual(1);
  });

  it("shows merge collision message on 409", async () => {
    server.use(
      http.post(`${apiBaseUrl}/v1/admin/entities/merge`, () =>
        HttpResponse.json(
          { code: "mapping_collision", message: "external id clash", request_id: "rid-409" },
          { status: 409 },
        ),
      ),
    );

    render(
      <MantineProvider>
        <ConflictQueueWidget
          hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-cq-4" } }}
          apiBaseUrl={apiBaseUrl}
        />
      </MantineProvider>,
    );

    await screen.findByText("Conflict queue");
    fireEvent.click(screen.getByRole("button", { name: /Merge duplicate profiles/i }));

    fireEvent.change(await screen.findByLabelText(/Merge source entity UUID/i), {
      target: { value: "11111111-1111-1111-1111-111111111111" },
    });
    fireEvent.change(screen.getByLabelText(/Merge target entity UUID/i), {
      target: { value: "22222222-2222-2222-2222-222222222222" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Confirm merge/i }));

    expect(await screen.findByText("external id clash")).toBeInTheDocument();
    expect(screen.getByText("rid-409")).toBeInTheDocument();
  });
});
