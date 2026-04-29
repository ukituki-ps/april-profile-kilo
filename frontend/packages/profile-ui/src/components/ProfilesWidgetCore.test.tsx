import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ProfilesWidgetCore } from "./ProfilesWidgetCore";
import type { ProfilesDataProvider } from "../providers/profilesDataProvider";

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
      <button type="button" aria-label="Open filter options" onClick={() => onFilterChange?.({ type: "type-b" })}>
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

const e1 = "c7c5e6ea-8787-4ca0-a691-9f4fdc9830ff";
const e2 = "4f18363d-70e8-4814-9d12-5236b18877d0";
const e3 = "d6f55c6c-6ea8-4ad2-b42b-7e7eefaf55a3";

const buildProvider = (): ProfilesDataProvider => ({
  list: vi.fn(async ({ search, entityTypeId, limit, cursor }) => {
    const source = [
      { entityId: e1, entityTypeId: "type-a", version: 1, updatedAt: "2026-04-24T10:00:00Z", preview: "Jane A" },
      { entityId: e2, entityTypeId: "type-a", version: 1, updatedAt: "2026-04-24T10:01:00Z", preview: "Jane B" },
      { entityId: e3, entityTypeId: "type-b", version: 1, updatedAt: "2026-04-24T10:02:00Z", preview: "Jane C" },
    ];
    const filtered = source.filter((item) => {
      const searchHit = !search || `${item.entityId} ${item.preview}`.toLowerCase().includes(search.toLowerCase());
      const typeHit = !entityTypeId || item.entityTypeId === entityTypeId;
      return searchHit && typeHit;
    });
    const start = cursor === "cursor-2" ? 2 : 0;
    const page = filtered.slice(start, start + limit);
    return {
      items: page,
      nextCursor: start + limit < filtered.length ? "cursor-2" : undefined,
      totalCount: filtered.length,
    };
  }),
  get: vi.fn(async (entityId) => ({
    entityId,
    entityTypeId: entityId === e3 ? "type-b" : "type-a",
    version: 1,
    updatedAt: "2026-04-24T10:00:00Z",
    document: { name: `Doc ${entityId}` },
  })),
  create: vi.fn(async () => ({
    entityId: "new-entity",
    entityTypeId: "type-a",
    version: 1,
    updatedAt: "2026-04-24T11:00:00Z",
    document: { name: "Created" },
  })),
  update: vi.fn(async (entityId) => ({
    entityId,
    entityTypeId: "type-a",
    version: 2,
    updatedAt: "2026-04-24T11:00:00Z",
    document: { name: "Updated" },
  })),
  remove: vi.fn(async () => undefined),
});

describe("ProfilesWidgetCore", () => {
  it("loads list through provider and supports search/filter/pagination", async () => {
    const provider = buildProvider();
    render(
      <MantineProvider>
        <ProfilesWidgetCore hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-1" } }} provider={provider} pageSize={2} />
      </MantineProvider>,
    );

    expect(await screen.findByText(e1)).toBeInTheDocument();
    expect(screen.getByText(e2)).toBeInTheDocument();
    expect(screen.queryByText(e3)).not.toBeInTheDocument();

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

  it("runs CRUD actions via provider", async () => {
    const provider = buildProvider();
    const onAction = vi.fn();
    render(
      <MantineProvider>
        <ProfilesWidgetCore
          hostContext={{ tenant: { id: "tenant-a" }, telemetry: { requestId: "req-1" } }}
          provider={provider}
          onAction={onAction}
        />
      </MantineProvider>,
    );

    expect(await screen.findByText(e1)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Add new item/i }));
    const textboxes = screen.getAllByRole("textbox");
    const createTypeInput = textboxes.find((input) => input.getAttribute("placeholder") === "entity_type_id");
    const createDocumentInput = textboxes.find((input) => (input as HTMLInputElement).value.includes("New profile"));
    if (!createTypeInput || !createDocumentInput) {
      throw new Error("Create modal inputs not found");
    }
    fireEvent.change(createTypeInput, { target: { value: "type-a" } });
    fireEvent.change(createDocumentInput, { target: { value: '{"name":"Created via test"}' } });
    fireEvent.click(screen.getByRole("button", { name: /Create profile/i }));

    await waitFor(() => {
      expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: "created" }));
    });

    fireEvent.click(screen.getAllByText(e1)[0]);
    fireEvent.click(await screen.findByRole("button", { name: /Edit profile/i }));
    fireEvent.change(screen.getByLabelText("Updated document (JSON object)"), { target: { value: '{"name":"Updated via test"}' } });
    fireEvent.click(screen.getByRole("button", { name: /Save changes/i }));
    await waitFor(() => {
      expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: "updated" }));
    });

    fireEvent.click(screen.getAllByText(e1)[0]);
    fireEvent.click(screen.getByRole("button", { name: /Delete profile/i }));
    await waitFor(() => {
      expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: "deleted", entityId: e1 }));
    });
  });
});
