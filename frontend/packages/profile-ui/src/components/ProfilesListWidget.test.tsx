import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { ReactNode } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ProfilesListWidget } from "./ProfilesListWidget";
import type { ProfilesListWidgetProps } from "./ProfilesListWidget";

vi.mock("@mantine/core", async () => {
  const actual = await vi.importActual<typeof import("@mantine/core")>("@mantine/core");
  return {
    ...actual,
    Modal: ({ opened, children }: { opened: boolean; children: ReactNode }) => (opened ? <div>{children}</div> : null),
  };
});

vi.mock("@april/ui", () => ({
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

const buildSnapshot = (entityId: string, version = 1, name = "Jane", typeId = entityTypeId) => ({
  entity_id: entityId,
  entity_type_id: typeId,
  version,
  document: { name },
  created_at: "2026-04-24T10:00:00Z",
  external_refs: [],
});

const server = setupServer(
  http.get(`${apiBaseUrl}/v1/entities/${e1}`, () => HttpResponse.json(buildSnapshot(e1, 1, "Jane A"))),
  http.get(`${apiBaseUrl}/v1/entities/${e2}`, () => HttpResponse.json(buildSnapshot(e2, 1, "Jane B"))),
  http.get(`${apiBaseUrl}/v1/entities/${e3}`, () => HttpResponse.json(buildSnapshot(e3, 1, "Jane C", entityTypeIdB))),
  http.get(`${apiBaseUrl}/v1/entities/new-entity`, () => HttpResponse.json(buildSnapshot("new-entity", 1, "Created"))),
  http.post(`${apiBaseUrl}/v1/entities`, async ({ request }) => {
    const body = (await request.json()) as { entity_type_id: string; document: { name?: string } };
    return HttpResponse.json(buildSnapshot("new-entity", 1, body.document.name ?? "Created"), { status: 201 });
  }),
  http.put(`${apiBaseUrl}/v1/entities/${e1}`, async ({ request }) => {
    const body = (await request.json()) as { document: { name?: string } };
    return HttpResponse.json(buildSnapshot(e1, 2, body.document.name ?? "Updated"));
  }),
  http.delete(`${apiBaseUrl}/v1/entities/${e2}`, () => new HttpResponse(null, { status: 204 })),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const renderWidget = (props?: Partial<ProfilesListWidgetProps>) =>
  render(
    <MantineProvider>
      <ProfilesListWidget
        hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-1" } }}
        apiBaseUrl={apiBaseUrl}
        entityIds={[e1, e2, e3]}
        {...props}
      />
    </MantineProvider>,
  );

const selectCard = (entityId: string) => {
  fireEvent.click(screen.getAllByText(entityId)[0]);
};

const fillCreateModal = (typeId: string, documentJson: string) => {
  const textboxes = screen.getAllByRole("textbox");
  const createTypeInput = textboxes.find((input) => input.getAttribute("placeholder") === "entity_type_id");
  const createDocumentInput = textboxes.find((input) => (input as HTMLInputElement).value.includes("New profile"));
  if (!createTypeInput || !createDocumentInput) {
    throw new Error("Create modal inputs not found");
  }
  fireEvent.change(createTypeInput, { target: { value: typeId } });
  fireEvent.change(createDocumentInput, { target: { value: documentJson } });
};

describe("ProfilesListWidget", () => {
  it("renders list with incremental loading and search", async () => {
    renderWidget({ pageSize: 2 });

    expect(await screen.findByText(e1)).toBeInTheDocument();
    expect(screen.getByText(e2)).toBeInTheDocument();
    expect(screen.queryByText(e3)).not.toBeInTheDocument();
    expect(screen.getByText(/Profile card/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Load more cards/i }));
    expect(await screen.findByText(e3)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search cards"), { target: { value: "Jane C" } });
    expect(await screen.findByText(e3)).toBeInTheDocument();
    expect(screen.queryByText(e1)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search cards"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /Open filter options/i }));
    expect(await screen.findByText(e3)).toBeInTheDocument();
    expect(screen.queryByText(e1)).not.toBeInTheDocument();
  });

  it(
    "supports create, update and delete actions",
    async () => {
      const onAction = vi.fn();
      renderWidget({ onAction });

      expect(await screen.findByText(e1)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Add new item/i }));
      fillCreateModal(entityTypeId, '{"name":"Created via test"}');
      fireEvent.click(screen.getByRole("button", { name: /Create profile/i }));

      expect(await screen.findByText("new-entity")).toBeInTheDocument();

      selectCard(e1);
      fireEvent.click(await screen.findByRole("button", { name: /Edit profile/i }));
      fireEvent.change(screen.getByLabelText("Updated document (JSON object)"), {
        target: { value: '{"name":"Updated via test"}' },
      });
      fireEvent.click(screen.getByRole("button", { name: /Save changes/i }));
      await screen.findByDisplayValue(/Updated via test/, {}, { timeout: 10_000 });

      selectCard(e2);
      fireEvent.click(screen.getByRole("button", { name: /Delete profile/i }));
      await waitFor(
        () => {
          expect(screen.queryByText(e2)).not.toBeInTheDocument();
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

    renderWidget();
    expect(await screen.findByText(e1)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Add new item/i }));
    fillCreateModal(entityTypeId, '{"name":"New profile"}');
    fireEvent.click(screen.getByRole("button", { name: /Create profile/i }));
    expect(await screen.findByText(/Authentication required/i)).toBeInTheDocument();

    selectCard(e1);
    fireEvent.click(screen.getByRole("button", { name: /Edit profile/i }));
    fireEvent.click(screen.getByRole("button", { name: /Save changes/i }));
    expect(await screen.findByText(/Access denied/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Delete profile/i }));
    expect(await screen.findByText(/conflicts with current profile state/i)).toBeInTheDocument();
  });
});
