import { render, screen, waitFor, within } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { ReactNode } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ProfilesWidget } from "./ProfilesWidget";
import type { ProfilesWidgetProps } from "./ProfilesWidget";

vi.mock("@mantine/core", async () => {
  const actual = await vi.importActual<typeof import("@mantine/core")>("@mantine/core");
  return {
    ...actual,
    Modal: ({ opened, children }: { opened: boolean; children: ReactNode }) =>
      opened ? (
        <div role="dialog" aria-modal="true">
          {children}
        </div>
      ) : null,
  };
});

vi.mock("@april/ui", () => ({
  DensityProvider: ({ children }: { children: ReactNode }) => <div data-testid="density-provider">{children}</div>,
  AprilJsonTreeEditor: ({
    data,
    setData,
    readOnly,
  }: {
    data: Record<string, unknown>;
    setData?: (next: Record<string, unknown> | unknown[]) => void;
    readOnly?: boolean;
  }) => (
    <textarea
      data-testid={readOnly ? "mock-json-tree-readonly" : "mock-json-tree-edit"}
      readOnly={readOnly}
      value={JSON.stringify(data, null, 2)}
      onChange={(event) => {
        if (readOnly) {
          return;
        }
        try {
          const parsed = JSON.parse(event.target.value) as unknown;
          if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
            setData?.(parsed as Record<string, unknown>);
          }
        } catch {
          /* ignore */
        }
      }}
    />
  ),
  AprilJsonCollectionTextEditor: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (next: string) => void;
  }) => <textarea data-testid="mock-json-source" value={value} onChange={(event) => onChange(event.target.value)} />,
  AprilJsonValidationSummary: () => null,
  AprilJsonSchemaForm: ({
    formData,
    onChange,
    readOnly,
  }: {
    formData: Record<string, unknown>;
    onChange: (next: Record<string, unknown>) => void;
    readOnly?: boolean;
  }) => (
    <textarea
      data-testid="mock-rjsf-form"
      readOnly={readOnly}
      value={JSON.stringify(formData)}
      onChange={(event) => {
        if (readOnly) {
          return;
        }
        try {
          const parsed = JSON.parse(event.target.value) as unknown;
          if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
            onChange(parsed as Record<string, unknown>);
          }
        } catch {
          /* ignore */
        }
      }}
    />
  ),
  CardListColumn: ({
    items,
    onSearchChange,
    onReachListEnd,
    onAddItem,
    onFilterChange,
    renderCard,
  }: {
    items: Array<{ id: string }>;
    onSearchChange?: (value: string) => void;
    onReachListEnd?: () => void;
    onAddItem?: () => void;
    onFilterChange?: (value: Record<string, string | undefined>) => void;
    renderCard?: (item: { id: string }) => ReactNode;
  }) => (
    <div>
      <input aria-label="Search cards" onChange={(event) => onSearchChange?.(event.currentTarget.value)} />
      <button
        type="button"
        aria-label="Open filter options"
        onClick={() => onFilterChange?.({ type: "7fd4f598-c6a7-4b44-9fd8-e8cb2e65d6ad" })}
      >
        Filter type-b
      </button>
      <button type="button" aria-label="Load more cards" onClick={onReachListEnd}>
        Load more
      </button>
      <button type="button" aria-label="Add new item" onClick={onAddItem}>
        Add
      </button>
      {items.map((item) => (
        <div key={item.id}>{renderCard ? renderCard(item) : item.id}</div>
      ))}
    </div>
  ),
}));

const apiBaseUrl = "http://localhost:8080/admin/profile/api";
const entityTypeId = "89ac9958-fec8-43d7-8908-f0438e8e0e39";
const entityTypeIdB = "7fd4f598-c6a7-4b44-9fd8-e8cb2e65d6ad";
const e1 = "c7c5e6ea-8787-4ca0-a691-9f4fdc9830ff";
const e2 = "4f18363d-70e8-4814-9d12-5236b18877d0";
const e3 = "d6f55c6c-6ea8-4ad2-b42b-7e7eefaf55a3";

const jp = (name: string) => JSON.stringify({ name });

const buildSnapshot = (entityId: string, version = 1, name = "Jane", typeId = entityTypeId) => ({
  entity_id: entityId,
  entity_type_id: typeId,
  version,
  document: { name },
  created_at: "2026-04-24T10:00:00Z",
  external_refs: [],
});

const entityTypeRow = (id: string, code: string) => ({
  id,
  namespace: "ns",
  code,
  status: "published" as const,
  draft_schema: {},
  draft_schema_version: 1,
  published_schema: {},
  published_schema_version: 1,
  published_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
});

let listItems = [
  { entity_id: e1, entity_type_id: entityTypeId, version: 1, created_at: "2026-04-24T10:00:00Z", preview: jp("Jane A") },
  { entity_id: e2, entity_type_id: entityTypeId, version: 1, created_at: "2026-04-24T10:01:00Z", preview: jp("Jane B") },
  { entity_id: e3, entity_type_id: entityTypeIdB, version: 1, created_at: "2026-04-24T10:02:00Z", preview: jp("Jane C") },
];

const server = setupServer(
  http.get(`${apiBaseUrl}/v1/entity-types`, () =>
    HttpResponse.json({
      items: [entityTypeRow(entityTypeId, "code-a"), entityTypeRow(entityTypeIdB, "code-b")],
    }),
  ),
  http.get(`${apiBaseUrl}/v1/entity-types/:entityTypeId`, ({ params }) => {
    const id = params.entityTypeId as string;
    const code = id === entityTypeIdB ? "code-b" : "code-a";
    return HttpResponse.json(entityTypeRow(id, code));
  }),
  http.get(`${apiBaseUrl}/v1/entities`, ({ request }) => {
    const url = new URL(request.url);
    const search = (url.searchParams.get("search") ?? "").toLowerCase();
    const type = url.searchParams.get("entity_type_id") ?? "";
    const limit = Number(url.searchParams.get("limit") ?? "5");
    const cursor = url.searchParams.get("cursor");

    const filtered = listItems.filter((item) => {
      const searchHit = !search || item.entity_id.toLowerCase().includes(search) || item.preview.toLowerCase().includes(search);
      const typeHit = !type || item.entity_type_id === type;
      return searchHit && typeHit;
    });

    const start = cursor === "cursor-2" ? 2 : 0;
    const page = filtered.slice(start, start + limit);
    const nextCursor = start + limit < filtered.length ? "cursor-2" : null;
    return HttpResponse.json({
      items: page,
      next_cursor: nextCursor,
      total_count: filtered.length,
    });
  }),
  http.get(`${apiBaseUrl}/v1/entities/${e1}`, () => HttpResponse.json(buildSnapshot(e1, 1, "Jane A"))),
  http.get(`${apiBaseUrl}/v1/entities/${e2}`, () => HttpResponse.json(buildSnapshot(e2, 1, "Jane B"))),
  http.get(`${apiBaseUrl}/v1/entities/${e3}`, () => HttpResponse.json(buildSnapshot(e3, 1, "Jane C", entityTypeIdB))),
  http.get(`${apiBaseUrl}/v1/entities/new-entity`, () => HttpResponse.json(buildSnapshot("new-entity", 1, "Created via test"))),
  http.get(`${apiBaseUrl}/v1/entities/${e1}/versions/1`, () => HttpResponse.json(buildSnapshot(e1, 1, "Jane A"))),
  http.get(`${apiBaseUrl}/v1/entities/${e2}/versions/1`, () => HttpResponse.json(buildSnapshot(e2, 1, "Jane B"))),
  http.get(`${apiBaseUrl}/v1/entities/${e3}/versions/1`, () => HttpResponse.json(buildSnapshot(e3, 1, "Jane C", entityTypeIdB))),
  http.get(`${apiBaseUrl}/v1/entities/new-entity/versions/1`, () =>
    HttpResponse.json(buildSnapshot("new-entity", 1, "Created via test")),
  ),
  http.post(`${apiBaseUrl}/v1/entities`, async ({ request }) => {
    const body = (await request.json()) as { entity_type_id: string; document: { name?: string } };
    const preview = JSON.stringify({ name: body.document.name ?? "Created" });
    listItems = [
      {
        entity_id: "new-entity",
        entity_type_id: body.entity_type_id,
        version: 1,
        created_at: "2026-04-24T10:03:00Z",
        preview,
      },
      ...listItems,
    ];
    return HttpResponse.json(buildSnapshot("new-entity", 1, body.document.name ?? "Created via test"), { status: 201 });
  }),
  http.put(`${apiBaseUrl}/v1/entities/${e1}`, async ({ request }) => {
    const body = (await request.json()) as { document: { name?: string } };
    return HttpResponse.json(buildSnapshot(e1, 2, body.document.name ?? "Updated"));
  }),
  http.delete(`${apiBaseUrl}/v1/entities/${e2}`, () => {
    listItems = listItems.filter((item) => item.entity_id !== e2);
    return new HttpResponse(null, { status: 204 });
  }),
);

beforeAll(() => server.listen());
afterEach(() => {
  listItems = [
    { entity_id: e1, entity_type_id: entityTypeId, version: 1, created_at: "2026-04-24T10:00:00Z", preview: jp("Jane A") },
    { entity_id: e2, entity_type_id: entityTypeId, version: 1, created_at: "2026-04-24T10:01:00Z", preview: jp("Jane B") },
    { entity_id: e3, entity_type_id: entityTypeIdB, version: 1, created_at: "2026-04-24T10:02:00Z", preview: jp("Jane C") },
  ];
  server.resetHandlers();
});
afterAll(() => server.close());

async function pickTreeDocumentView(container: HTMLElement) {
  if (within(container).queryByRole("button", { name: "Form" })) {
    fireEvent.click(within(container).getByTestId("draft-json-editor-more"));
    fireEvent.click(await screen.findByRole("menuitem", { name: /^Tree$/ }));
  } else {
    fireEvent.click(within(container).getByRole("button", { name: "Tree" }));
  }
}

const renderWidget = (props?: Partial<ProfilesWidgetProps>) =>
  render(
    <MantineProvider>
      <ProfilesWidget
        hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-1" } }}
        apiBaseUrl={apiBaseUrl}
        autoSelectFirst
        initialCreateEntityTypeId={entityTypeId}
        {...props}
      />
    </MantineProvider>,
  );

const selectCard = (entityId: string) => {
  fireEvent.click(screen.getByLabelText(`Profile row ${entityId}`));
};

const fillCreateModal = async (profileName: string, documentJson: string) => {
  expect(await screen.findByLabelText("Profile name")).toBeInTheDocument();
  await userEvent.clear(screen.getByLabelText("Profile name"));
  await userEvent.type(screen.getByLabelText("Profile name"), profileName);
  const createDoc = await screen.findByTestId("profiles-widget-create-document");
  await pickTreeDocumentView(createDoc);
  fireEvent.change(within(createDoc).getByTestId("mock-json-tree-edit"), {
    target: { value: documentJson },
  });
};

describe("ProfilesWidget", () => {
  it("renders list with incremental loading and search", async () => {
    renderWidget({ pageSize: 2 });

    expect(await screen.findByLabelText(`Profile row ${e1}`)).toBeInTheDocument();
    expect(screen.getByLabelText(`Profile row ${e2}`)).toBeInTheDocument();
    expect(screen.queryByLabelText(`Profile row ${e3}`)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Load more cards/i }));
    expect(await screen.findByLabelText(`Profile row ${e3}`)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search cards"), { target: { value: "Jane C" } });
    expect(await screen.findByLabelText(`Profile row ${e3}`)).toBeInTheDocument();
    expect(screen.queryByLabelText(`Profile row ${e1}`)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search cards"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /Open filter options/i }));
    expect(await screen.findByLabelText(`Profile row ${e3}`)).toBeInTheDocument();
    expect(screen.queryByLabelText(`Profile row ${e1}`)).not.toBeInTheDocument();
  });

  it(
    "supports create, update and delete actions",
    async () => {
      const onAction = vi.fn();
      renderWidget({ onAction });

      expect(await screen.findByLabelText(`Profile row ${e1}`)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Add new item/i }));
      await fillCreateModal("Created via test", "{}");
      fireEvent.click(screen.getByRole("button", { name: /Create profile/i }));

      expect(await screen.findByTitle("new-entity")).toBeInTheDocument();

      selectCard(e1);
      fireEvent.click(await screen.findByRole("button", { name: /Edit profile/i }));
      const editDoc = await screen.findByTestId("profiles-widget-edit-document");
      await pickTreeDocumentView(editDoc);
      fireEvent.change(within(editDoc).getByTestId("mock-json-tree-edit"), {
        target: { value: '{"name":"Updated via test"}' },
      });
      fireEvent.click(screen.getByRole("button", { name: /Save changes/i }));
      await screen.findByDisplayValue(/Updated via test/, {}, { timeout: 10_000 });

      selectCard(e2);
      fireEvent.click(screen.getByRole("button", { name: /Delete profile/i }));
      await waitFor(
        () => {
          expect(screen.queryByLabelText(`Profile row ${e2}`)).not.toBeInTheDocument();
        },
        { timeout: 10_000 },
      );

      expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: "created" }));
      expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: "updated" }));
      expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: "deleted", entityId: e2 }));
    },
    25_000,
  );

  it("maps 401/403/409 to secure messages", async () => {
    const onError = vi.fn();
    server.use(
      http.post(`${apiBaseUrl}/v1/entities`, () =>
        HttpResponse.json({ code: "unauthorized", message: "raw backend message" }, { status: 401 }),
      ),
      http.put(`${apiBaseUrl}/v1/entities/${e1}`, () =>
        HttpResponse.json({ code: "forbidden", message: "raw backend message" }, { status: 403 }),
      ),
      http.delete(`${apiBaseUrl}/v1/entities/${e1}`, () =>
        HttpResponse.json({ code: "conflict", message: "raw backend message" }, { status: 409 }),
      ),
    );

    renderWidget({ onError });
    expect(await screen.findByLabelText(`Profile row ${e1}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Add new item/i }));
    await fillCreateModal("Err case unique 401", "{}");
    fireEvent.click(screen.getByRole("button", { name: /Create profile/i }));
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: "unauthorized" })));
    expect(screen.getByText(/Authentication required/i)).toBeInTheDocument();

    selectCard(e1);
    fireEvent.click(screen.getByRole("button", { name: /Edit profile/i }));
    fireEvent.click(screen.getByRole("button", { name: /Save changes/i }));
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: "forbidden" })));
    expect(screen.getByText(/Access denied/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Delete profile/i }));
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: "conflict" })));
    expect(screen.getByText(/conflicts with current profile state/i)).toBeInTheDocument();
  });
});
