import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ProfileInstancesWidget } from "./ProfileInstancesWidget";

const profileId = "89ac9958-fec8-43d7-8908-f0438e8e0e39";
const otherProfileId = "13b4c949-8ed9-4f33-89fc-c97127c1d318";
const apiBaseUrl = "http://localhost:8080/admin/profile/api";
const ids = {
  visibleA: "c7c5e6ea-8787-4ca0-a691-9f4fdc9830ff",
  visibleB: "4f18363d-70e8-4814-9d12-5236b18877d0",
  hidden: "95a0d862-cb55-417f-af9e-ae92f5782bcb",
  created: "00000000-0000-0000-0000-000000000003",
};

const server = setupServer(
  http.get(`${apiBaseUrl}/v1/entities/${ids.visibleA}`, () =>
    HttpResponse.json({
      entity_id: ids.visibleA,
      entity_type_id: profileId,
      version: 2,
      document: { first_name: "Alice" },
      created_at: "2026-04-23T10:00:00Z",
      external_refs: [],
    }),
  ),
  http.get(`${apiBaseUrl}/v1/entities/${ids.visibleB}`, () =>
    HttpResponse.json({
      entity_id: ids.visibleB,
      entity_type_id: otherProfileId,
      version: 1,
      document: { first_name: "Bob" },
      created_at: "2026-04-23T10:00:00Z",
      external_refs: [],
    }),
  ),
  http.get(`${apiBaseUrl}/v1/entities/${ids.hidden}`, () => HttpResponse.json({}, { status: 404 })),
  http.post(`${apiBaseUrl}/v1/entities`, async ({ request }) => {
    const body = (await request.json()) as { entity_type_id: string; document: Record<string, unknown> };
    return HttpResponse.json({
      entity_id: ids.created,
      entity_type_id: body.entity_type_id,
      version: 1,
      document: body.document,
      created_at: "2026-04-23T10:00:00Z",
      external_refs: [],
    });
  }),
  http.put(`${apiBaseUrl}/v1/entities/${ids.visibleA}`, () => HttpResponse.json({ error: "forbidden" }, { status: 403 })),
  http.delete(`${apiBaseUrl}/v1/entities/${ids.visibleA}`, () => HttpResponse.json({}, { status: 204 })),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("ProfileInstancesWidget", () => {
  it("shows only instances from selected profile and emits create action", async () => {
    const onAction = vi.fn();
    const onOpenInstance = vi.fn();

    render(
      <MantineProvider>
        <ProfileInstancesWidget
          hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-1" } }}
          profileId={profileId}
          instanceIds={[ids.visibleA, ids.visibleB, ids.hidden]}
          apiBaseUrl={apiBaseUrl}
          onAction={onAction}
          onOpenInstance={onOpenInstance}
        />
      </MantineProvider>,
    );

    expect(await screen.findByText(ids.visibleA)).toBeInTheDocument();
    expect(screen.queryByText(ids.visibleB)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Open/i }));
    expect(onOpenInstance).toHaveBeenCalledWith(ids.visibleA);

    fireEvent.change(screen.getByLabelText(/Create document JSON/i), { target: { value: JSON.stringify({ first_name: "Carol" }) } });
    fireEvent.click(screen.getByRole("button", { name: /Create instance/i }));

    await waitFor(() => {
      expect(onAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "created",
          item: expect.objectContaining({ entityId: ids.created, profileId }),
        }),
      );
    });
  });

  it("switches to readonly mode when update is forbidden", async () => {
    render(
      <MantineProvider>
        <ProfileInstancesWidget
          hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-2" } }}
          profileId={profileId}
          instanceIds={[ids.visibleA]}
          apiBaseUrl={apiBaseUrl}
        />
      </MantineProvider>,
    );

    expect(await screen.findByText(ids.visibleA)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));
    expect(await screen.findByText(/Readonly mode/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create instance/i })).toBeDisabled();
  });

  it("shows denied banner when initial read is forbidden", async () => {
    server.use(http.get(`${apiBaseUrl}/v1/entities/${ids.visibleA}`, () => HttpResponse.json({ error: "forbidden" }, { status: 403 })));

    render(
      <MantineProvider>
        <ProfileInstancesWidget
          hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-3" } }}
          profileId={profileId}
          instanceIds={[ids.visibleA]}
          apiBaseUrl={apiBaseUrl}
        />
      </MantineProvider>,
    );

    expect(await screen.findByText(/Denied:/i)).toBeInTheDocument();
  });
});
