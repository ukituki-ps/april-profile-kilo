import { render, screen, waitFor, within } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ProfilesWidgetCore } from "./ProfilesWidgetCore";
import type { ProfilesDataProvider, ProfilesProviderError } from "../providers/profilesDataProvider";

vi.mock("@mantine/core", async () => {
  const actual = await vi.importActual<typeof import("@mantine/core")>("@mantine/core");
  return {
    ...actual,
    Modal: ({ opened, children }: { opened: boolean; children: ReactNode }) => (opened ? <div>{children}</div> : null),
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
          /* ignore invalid JSON in tests */
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
  CardListColumn: ({
    items,
    heightMode,
    onSearchChange,
    onReachListEnd,
    onAddItem,
    onFilterChange,
    renderCard,
  }: {
    items: Array<{ id: string; title: string }>;
    heightMode?: string;
    onSearchChange?: (value: string) => void;
    onReachListEnd?: () => void;
    onAddItem?: () => void;
    onFilterChange?: (value: Record<string, string | undefined>) => void;
    renderCard?: (item: { id: string; title: string }) => ReactNode;
  }) => (
    <div aria-label="CardListColumn mock" data-height-mode={heightMode}>
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

const p1 = "Alpha profile";
const p2 = "Beta profile";
const p3 = "Gamma profile";

const e1 = "c7c5e6ea-8787-4ca0-a691-9f4fdc9830ff";
const e2 = "4f18363d-70e8-4814-9d12-5236b18877d0";
const e3 = "d6f55c6c-6ea8-4ad2-b42b-7e7eefaf55a3";
const hostContext = { tenant: { id: "tenant-a" }, telemetry: { requestId: "req-1", correlationId: "corr-1" } } as const;

const docPreview = (name: string) => JSON.stringify({ name });

const buildProvider = (): ProfilesDataProvider => ({
  list: vi.fn(async ({ search, entityTypeId, limit, cursor }) => {
    const source = [
      { entityId: e1, entityTypeId: "type-a", version: 1, updatedAt: "2026-04-24T10:00:00Z", preview: docPreview(p1) },
      { entityId: e2, entityTypeId: "type-a", version: 1, updatedAt: "2026-04-24T10:01:00Z", preview: docPreview(p2) },
      { entityId: e3, entityTypeId: "type-b", version: 1, updatedAt: "2026-04-24T10:02:00Z", preview: docPreview(p3) },
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
    version: 2,
    updatedAt: "2026-04-24T10:00:00Z",
    document: { name: p1, slot: "current" },
  })),
  getByVersion: vi.fn(async (entityId, version) => ({
    entityId,
    entityTypeId: entityId === e3 ? "type-b" : "type-a",
    version,
    updatedAt: "2026-04-24T10:00:00Z",
    document: { name: p1, slot: `v${version}` },
  })),
  listEntityTypes: vi.fn(async () => [
    { id: "type-uuid-a", label: "ns/code-a" },
    { id: "type-uuid-b", label: "ns/code-b" },
  ]),
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
    version: 3,
    updatedAt: "2026-04-24T11:00:00Z",
    document: { name: "Updated" },
  })),
  remove: vi.fn(async () => undefined),
});

describe("ProfilesWidgetCore", () => {
  it("uses pageSize=20 by default for initial list request", async () => {
    const provider = buildProvider();
    render(
      <MantineProvider>
        <ProfilesWidgetCore hostContext={hostContext} provider={provider} />
      </MantineProvider>,
    );

    await screen.findByLabelText(`Profile row ${e1}`);
    expect(provider.list).toHaveBeenCalledWith(expect.objectContaining({ limit: 20 }), expect.anything());
  });

  it("renders CardListColumn in fill height mode", async () => {
    const provider = buildProvider();
    render(
      <MantineProvider>
        <ProfilesWidgetCore hostContext={hostContext} provider={provider} />
      </MantineProvider>,
    );

    await screen.findByLabelText(`Profile row ${e1}`);
    expect(screen.getByLabelText("CardListColumn mock")).toHaveAttribute("data-height-mode", "fill");
  });

  it("loads list through provider and supports search/filter/pagination", async () => {
    const provider = buildProvider();
    render(
      <MantineProvider>
        <ProfilesWidgetCore
          hostContext={hostContext}
          provider={provider}
          pageSize={2}
          initialSort="updated_asc"
          autoSelectFirst
        />
      </MantineProvider>,
    );

    expect(await screen.findByLabelText(`Profile row ${e1}`)).toBeInTheDocument();
    expect(screen.getByLabelText(`Profile row ${e2}`)).toBeInTheDocument();
    expect(screen.queryByLabelText(`Profile row ${e3}`)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Load more cards/i }));
    expect(await screen.findByLabelText(`Profile row ${e3}`)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search cards"), { target: { value: "Gamma" } });
    expect(await screen.findByLabelText(`Profile row ${e3}`)).toBeInTheDocument();
    expect(screen.queryByLabelText(`Profile row ${e1}`)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search cards"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /Open filter options/i }));
    expect(await screen.findByLabelText(`Profile row ${e3}`)).toBeInTheDocument();
    expect(screen.queryByLabelText(`Profile row ${e1}`)).not.toBeInTheDocument();
    expect(provider.list).toHaveBeenCalledWith(expect.objectContaining({ sort: "updated_asc" }), expect.anything());
  });

  it("runs CRUD actions via provider and forwards expectedVersion", async () => {
    const provider = buildProvider();
    const onAction = vi.fn();
    const onOpenEntity = vi.fn();
    render(
      <MantineProvider>
        <ProfilesWidgetCore
          hostContext={hostContext}
          provider={provider}
          onAction={onAction}
          autoSelectFirst={false}
          onOpenEntity={onOpenEntity}
        />
      </MantineProvider>,
    );

    expect(await screen.findByLabelText(`Profile row ${e1}`)).toBeInTheDocument();
    expect(screen.getByText(/Select a profile from the left column/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Add new item/i }));
    expect(await screen.findByLabelText("Profile name")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Profile name"), { target: { value: "Unique created" } });
    fireEvent.change(within(screen.getByTestId("profiles-widget-create-document")).getByTestId("mock-json-tree-edit"), {
      target: { value: "{}" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create profile/i }));

    await waitFor(() => {
      expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: "created" }));
    });

    fireEvent.click(screen.getByLabelText(`Profile row ${e1}`));
    expect(onOpenEntity).toHaveBeenCalledWith(e1);
    fireEvent.click(await screen.findByRole("button", { name: /Edit profile/i }));
    fireEvent.change(within(screen.getByTestId("profiles-widget-edit-document")).getByTestId("mock-json-tree-edit"), {
      target: { value: '{"name":"Updated via test"}' },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save changes/i }));
    await waitFor(() => {
      expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: "updated" }));
    });
    expect(provider.update).toHaveBeenCalledWith(
      e1,
      expect.objectContaining({ expectedVersion: 2 }),
      expect.anything(),
    );

    fireEvent.click(screen.getByLabelText(`Profile row ${e1}`));
    fireEvent.click(screen.getByRole("button", { name: /Delete profile/i }));
    await waitFor(() => {
      expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: "deleted", entityId: e1 }));
    });
  });

  it("passes normalized code in onError payload", async () => {
    const provider = buildProvider();
    const onError = vi.fn();
    const providerError: ProfilesProviderError = {
      code: "forbidden",
      message: "raw backend message",
      requestId: "api-req-42",
      status: 403,
    };
    vi.mocked(provider.list).mockRejectedValueOnce(providerError);
    render(
      <MantineProvider>
        <ProfilesWidgetCore hostContext={hostContext} provider={provider} onError={onError} />
      </MantineProvider>,
    );

    expect(await screen.findByText(/Access denied for this operation/i)).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "forbidden",
        requestId: "api-req-42",
      }),
    );
  });

  it("aborts stale list request and emits list telemetry", async () => {
    const staleSignals: AbortSignal[] = [];
    let secondCall = false;
    const provider: ProfilesDataProvider = {
      ...buildProvider(),
      list: vi.fn((query, ctx) => {
        if (!secondCall && query.search) {
          secondCall = true;
          staleSignals.push(ctx.signal as AbortSignal);
          return new Promise(() => undefined);
        }
        return Promise.resolve({
          items: [
            {
              entityId: e3,
              entityTypeId: "type-b",
              version: 1,
              updatedAt: "2026-04-24T10:02:00Z",
              preview: docPreview(p3),
            },
          ],
          totalCount: 1,
        });
      }) as ProfilesDataProvider["list"],
    };
    const onObservability = vi.fn();
    const { unmount } = render(
      <MantineProvider>
        <ProfilesWidgetCore hostContext={hostContext} provider={provider} autoSelectFirst onObservability={onObservability} />
      </MantineProvider>,
    );

    expect(await screen.findByLabelText(`Profile row ${e3}`)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search cards"), { target: { value: "a" } });
    unmount();

    await waitFor(() => {
      expect(staleSignals[0]?.aborted).toBe(true);
    });

    expect(onObservability).toHaveBeenCalledWith(expect.objectContaining({ event: "list_requested" }));
    expect(onObservability).toHaveBeenCalledWith(expect.objectContaining({ event: "list_succeeded" }));
  });
});
