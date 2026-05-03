import { render, screen, waitFor, within } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfilesWidgetCore } from "./ProfilesWidgetCore";
import type { ProfilesDataProvider, ProfilesProviderError } from "../providers/profilesDataProvider";

vi.mock("@mantine/core", async () => {
  const actual = await vi.importActual<typeof import("@mantine/core")>("@mantine/core");
  return {
    ...actual,
    Modal: ({
      opened,
      children,
      title,
    }: {
      opened: boolean;
      children?: ReactNode;
      title?: ReactNode;
    }) =>
      opened ? (
        <div role="dialog" aria-modal="true">
          {title != null && title !== false ? <div data-testid="mantine-modal-title">{title}</div> : null}
          <div>{children}</div>
        </div>
      ) : null,
  };
});

function pickTreeDocumentView(container: HTMLElement) {
  const detail = container.closest('[data-testid="profiles-widget-detail-column"]');
  const searchRoot = detail ?? container;
  const inSearch = within(searchRoot as HTMLElement).queryAllByRole("radio", { name: "Tree" });
  if (inSearch.length > 0) {
    fireEvent.click(inSearch[0]);
    return;
  }
  const dialog = document.querySelector('[role="dialog"]');
  if (dialog) {
    const inDialog = within(dialog as HTMLElement).queryAllByRole("radio", { name: "Tree" });
    if (inDialog.length > 0) {
      fireEvent.click(inDialog[0]);
      return;
    }
  }
  fireEvent.click(within(document.body).getAllByRole("radio", { name: "Tree" })[0]);
}

vi.mock("@mantine/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mantine/hooks")>();
  return {
    ...actual,
    useMediaQuery: vi.fn(() => false),
  };
});

vi.mock("@april/ui", async () => {
  const { AprilIconCheck, AprilIconClose, AprilModal } = await vi.importActual<typeof import("@april/ui")>("@april/ui");
  const { SegmentedControl } = await vi.importActual<typeof import("@mantine/core")>("@mantine/core");
  return {
    AprilModal,
    AprilVaulBottomSheet: ({
      opened,
      children,
      headerTitle,
      onClose,
    }: {
      opened: boolean;
      children?: ReactNode;
      headerTitle?: ReactNode;
      onClose?: () => void;
    }) =>
      opened ? (
        <div data-testid="profiles-widget-profile-overlay-sheet" role="dialog" aria-label="Profile detail sheet">
          <div>{headerTitle}</div>
          <button type="button" aria-label="Close profile sheet" onClick={onClose}>
            Close sheet
          </button>
          <div>{children}</div>
        </div>
      ) : null,
    APRIL_MOBILE_BOTTOM_SHEET_Z_INDEX: 350,
    AprilIconClose,
    AprilIconCheck,
    AprilGradientSegmentedControl: SegmentedControl,
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
  AprilJsonSchemaForm: ({
    formData,
    onChange,
  }: {
    formData: Record<string, unknown>;
    onChange: (next: Record<string, unknown>) => void;
  }) => (
    <textarea
      data-testid="mock-rjsf-form"
      value={JSON.stringify(formData)}
      onChange={(event) => {
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
    heightMode,
    mobileLayout,
    view,
    onSearchChange,
    onReachListEnd,
    onAddItem,
    onFilterChange,
    onSelectItem,
    onViewChange,
    renderCard,
    selectedItemId,
  }: {
    items: Array<{ id: string; title: string }>;
    heightMode?: string;
    mobileLayout?: string;
    view?: string;
    selectedItemId?: string | null;
    onSearchChange?: (value: string) => void;
    onReachListEnd?: () => void;
    onAddItem?: () => void;
    onFilterChange?: (value: Record<string, string | undefined>) => void;
    onSelectItem?: (id: string | null) => void;
    onViewChange?: (next: "list" | "grid") => void;
    renderCard?: (item: { id: string; title: string }) => ReactNode;
  }) => (
    <div
      aria-label="CardListColumn mock"
      data-height-mode={heightMode}
      data-mobile-layout={mobileLayout ?? ""}
      data-card-list-view={view ?? "list"}
      data-selected-item-id={selectedItemId ?? ""}
    >
      <button type="button" aria-label="Switch column view to grid" onClick={() => onViewChange?.("grid")}>
        View grid
      </button>
      <button type="button" aria-label="Switch column view to list" onClick={() => onViewChange?.("list")}>
        View list
      </button>
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
        <div key={item.id} onClick={() => onSelectItem?.(item.id)}>
          {renderCard ? renderCard(item) : item.id}
        </div>
      ))}
    </div>
  ),
  };
});

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
  getEntityTypePublishedSchema: vi.fn(async (typeId: string) => {
    if (typeId === "type-uuid-a") {
      return { type: "object", properties: { name: { type: "string" } } };
    }
    if (typeId === "type-uuid-b") {
      return { type: "object", properties: { code: { type: "string" } } };
    }
    if (typeId === "type-a" || typeId === "type-b") {
      return { type: "object", properties: { name: { type: "string" }, slot: { type: "string" } } };
    }
    return { type: "object" };
  }),
});

describe("ProfilesWidgetCore", () => {
  beforeEach(() => {
    vi.mocked(useMediaQuery).mockReturnValue(false);
  });
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

  it("passes mobileLayout auto to CardListColumn by default", async () => {
    const provider = buildProvider();
    render(
      <MantineProvider>
        <ProfilesWidgetCore hostContext={hostContext} provider={provider} />
      </MantineProvider>,
    );
    await screen.findByLabelText("CardListColumn mock");
    expect(screen.getByLabelText("CardListColumn mock")).toHaveAttribute("data-mobile-layout", "auto");
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
    expect(screen.getByText(/No profile selected/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Add new item/i }));
    expect(await screen.findByLabelText("Profile name")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Profile name"), { target: { value: "Unique created" } });
    const createDoc = await screen.findByTestId("profiles-widget-create-document");
    await pickTreeDocumentView(createDoc);
    fireEvent.change(within(createDoc).getByTestId("mock-json-tree-edit"), {
      target: { value: "{}" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create profile/i }));

    await waitFor(() => {
      expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: "created" }));
    });

    fireEvent.click(screen.getByLabelText(`Profile row ${e1}`));
    expect(onOpenEntity).toHaveBeenCalledWith(e1);
    fireEvent.click(await screen.findByRole("button", { name: /Edit profile/i }));
    const editDoc = await screen.findByTestId("profiles-widget-edit-document");
    await pickTreeDocumentView(editDoc);
    fireEvent.change(within(editDoc).getByTestId("mock-json-tree-edit"), {
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

  it("offers Form mode when published schema is available and saves document from Form", async () => {
    const provider = buildProvider();
    render(
      <MantineProvider>
        <ProfilesWidgetCore hostContext={hostContext} provider={provider} autoSelectFirst />
      </MantineProvider>,
    );

    await screen.findByLabelText(`Profile row ${e1}`);
    fireEvent.click(screen.getByRole("button", { name: /Edit profile/i }));

    const editPanel = await screen.findByTestId("profiles-widget-edit-document");
    expect(screen.getByRole("radio", { name: "Form" })).toBeInTheDocument();

    const formField = within(editPanel).getByTestId("mock-rjsf-form");
    fireEvent.change(formField, {
      target: { value: JSON.stringify({ name: "From form", slot: "current" }) },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save changes/i }));

    await waitFor(() => {
      expect(provider.update).toHaveBeenCalledWith(
        e1,
        expect.objectContaining({
          document: expect.objectContaining({ name: "From form" }),
        }),
        expect.anything(),
      );
    });
  });

  it("does not show Form segment when getEntityTypePublishedSchema is missing", async () => {
    const provider = buildProvider();
    delete provider.getEntityTypePublishedSchema;

    render(
      <MantineProvider>
        <ProfilesWidgetCore hostContext={hostContext} provider={provider} autoSelectFirst />
      </MantineProvider>,
    );

    await screen.findByLabelText(`Profile row ${e1}`);
    fireEvent.click(screen.getByRole("button", { name: /Edit profile/i }));

    await screen.findByTestId("profiles-widget-edit-document");
    expect(screen.queryByRole("radio", { name: "Form" })).not.toBeInTheDocument();
  });

  it("in grid view hides inline detail and opens profile in modal after row selection", async () => {
    const provider = buildProvider();
    render(
      <MantineProvider>
        <ProfilesWidgetCore hostContext={hostContext} provider={provider} autoSelectFirst={false} />
      </MantineProvider>,
    );

    await screen.findByLabelText(`Profile row ${e1}`);
    expect(screen.getByTestId("profiles-widget-detail-column")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Switch column view to grid/i }));
    expect(screen.getByLabelText("CardListColumn mock")).toHaveAttribute("data-card-list-view", "grid");
    expect(screen.queryByTestId("profiles-widget-detail-column")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(`Profile row ${e1}`));
    await waitFor(() => {
      expect(screen.getAllByRole("dialog", { hidden: true }).length).toBeGreaterThan(0);
    });
    const gridDialog = screen.getAllByRole("dialog", { hidden: true }).find((el) =>
      within(el).queryByTestId("profiles-widget-detail-column"),
    );
    expect(gridDialog).toBeTruthy();
    expect(within(gridDialog as HTMLElement).getByTestId("profiles-widget-detail-column")).toBeInTheDocument();
    expect(screen.queryByTestId("profiles-widget-profile-overlay-sheet")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Switch column view to list/i }));
    await waitFor(() => {
      expect(
        screen.queryAllByRole("dialog", { hidden: true }).filter((el) =>
          within(el).queryByTestId("profiles-widget-detail-column"),
        ),
      ).toHaveLength(0);
    });
    expect(screen.getByTestId("profiles-widget-detail-column")).toBeInTheDocument();
  });

  it("on narrow viewport opens grid profile detail in bottom sheet instead of modal", async () => {
    vi.mocked(useMediaQuery).mockReturnValue(true);
    const provider = buildProvider();
    render(
      <MantineProvider>
        <ProfilesWidgetCore hostContext={hostContext} provider={provider} autoSelectFirst={false} />
      </MantineProvider>,
    );

    await screen.findByLabelText(`Profile row ${e1}`);
    fireEvent.click(screen.getByRole("button", { name: /Switch column view to grid/i }));
    fireEvent.click(screen.getByLabelText(`Profile row ${e1}`));

    await waitFor(() => {
      expect(screen.getByTestId("profiles-widget-profile-overlay-sheet")).toBeInTheDocument();
    });
    const sheet = screen.getByTestId("profiles-widget-profile-overlay-sheet");
    expect(within(sheet).getByTestId("profiles-widget-detail-column")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Close profile sheet/i }));
    await waitFor(() => {
      expect(screen.queryByTestId("profiles-widget-profile-overlay-sheet")).not.toBeInTheDocument();
    });
  });

  it("opens create flow from Add in grid view inside profile modal", async () => {
    const provider = buildProvider();
    render(
      <MantineProvider>
        <ProfilesWidgetCore hostContext={hostContext} provider={provider} autoSelectFirst={false} />
      </MantineProvider>,
    );

    await screen.findByLabelText(`Profile row ${e1}`);
    fireEvent.click(screen.getByRole("button", { name: /Switch column view to grid/i }));
    fireEvent.click(screen.getByRole("button", { name: /Add new item/i }));

    await waitFor(() => {
      expect(
        screen.getAllByRole("dialog", { hidden: true }).some((el) =>
          within(el).queryByTestId("profiles-widget-detail-column"),
        ),
      ).toBe(true);
    });
    await waitFor(() => {
      expect(screen.getByLabelText("Profile name")).toBeInTheDocument();
    });
  });
});
