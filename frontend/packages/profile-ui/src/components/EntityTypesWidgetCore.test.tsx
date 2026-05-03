import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import type { KeyboardEvent, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { EntityTypesWidgetCore } from "./EntityTypesWidgetCore";
import type {
  EntityTypeFamilySummary,
  EntityTypesDataProvider,
} from "../providers/entityTypesDataProvider";
import type { ProviderContext } from "../providers/profilesDataProvider";
import type { ProfileDetails } from "../providers/profilesDataProvider";

vi.mock("@mantine/core", async () => {
  const actual = await vi.importActual<typeof import("@mantine/core")>("@mantine/core");
  return {
    ...actual,
    Modal: ({ opened, children }: { opened: boolean; children: ReactNode }) => (opened ? <div>{children}</div> : null),
  };
});

vi.mock("@april/ui", () => ({
  DensityProvider: ({ children }: { children: ReactNode }) => <div data-testid="density-provider">{children}</div>,
  CardListColumn: ({
    items,
    heightMode,
    onAddItem,
    onSelectItem,
    renderCard,
  }: {
    items: Array<{ id: string; title: string }>;
    heightMode?: string;
    onAddItem?: () => void;
    onSelectItem?: (id: string | null) => void;
    renderCard?: (item: { id: string; title: string }) => ReactNode;
  }) => (
    <div aria-label="CardListColumn mock" data-height-mode={heightMode}>
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
  AprilJsonTreeEditor: ({ data, readOnly }: { data: unknown; readOnly?: boolean }) => (
    <div data-testid="april-json-tree" data-readonly={readOnly ? "true" : "false"}>
      {JSON.stringify(data)}
    </div>
  ),
  AprilJsonCollectionTextEditor: ({
    value,
    onChange,
    onKeyDown,
  }: {
    value: string;
    onChange: (v: string) => void;
    onKeyDown?: (e: KeyboardEvent) => void;
  }) => (
    <textarea
      aria-label="JSON source editor"
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      onKeyDown={onKeyDown}
    />
  ),
  AprilJsonValidationSummary: () => null,
}));

const famId = "11111111-1111-1111-1111-111111111111";
const hostContext = { tenant: { id: "tenant-a" }, telemetry: { requestId: "req-1", correlationId: "corr-1" } } as const;

const detail = {
  id: famId,
  namespace: "ns",
  code: "person",
  status: "published" as const,
  draftSchemaVersion: 1,
  publishedSchemaVersion: 1,
  draftSchema: { type: "object" },
  publishedSchema: { type: "object" },
  createdAt: "2026-01-01T00:00:00Z",
  publishedAt: "2026-01-01T00:00:00Z",
};

const buildProvider = (): EntityTypesDataProvider => ({
  listFamilies: vi.fn(async (): Promise<EntityTypeFamilySummary[]> => [
    {
      id: famId,
      namespace: "ns",
      code: "person",
      status: "published" as const,
      draftSchemaVersion: 1,
      publishedSchemaVersion: 1,
    },
  ]),
  getFamily: vi.fn(async () => ({ ...detail })),
  createFamily: vi.fn(async () => ({ ...detail, id: "new-fam" })),
  patchFamily: vi.fn(async () => ({ ...detail })),
  deleteFamily: vi.fn(async () => undefined),
  saveDraft: vi.fn(async () => ({ ...detail, draftSchemaVersion: 2 })),
  publishDraft: vi.fn(async () => ({ ...detail, publishedSchemaVersion: 2 })),
  listRevisions: vi.fn(async () => [
    {
      id: "rev-1",
      familyId: famId,
      revisionNo: 1,
      schema: {},
      publishedAt: "2026-01-01T00:00:00Z",
    },
  ]),
  listProfilesForType: vi.fn(async () => ({
    items: [
      {
        entityId: "e1",
        entityTypeId: famId,
        version: 1,
        updatedAt: "2026-01-02T00:00:00Z",
        preview: "{}",
      },
    ],
    totalCount: 1,
  })),
  upgradeEntityProfileBinding: vi.fn(async (): Promise<ProfileDetails> => ({
    entityId: "e1",
    entityTypeId: famId,
    version: 2,
    updatedAt: "2026-01-02T00:00:00Z",
    document: {},
  })),
  batchUpgradeEntityBindings: vi.fn(async () => ({
    processed: 0,
    succeeded: 0,
    failed: 0,
    results: [],
  })),
});

describe("EntityTypesWidgetCore", () => {
  it("loads families and uses CardListColumn fill height", async () => {
    const provider = buildProvider();
    render(
      <MantineProvider>
        <EntityTypesWidgetCore hostContext={hostContext} provider={provider} />
      </MantineProvider>,
    );

    await screen.findByLabelText(`Entity type family ${famId}`);
    expect(screen.getByLabelText("CardListColumn mock")).toHaveAttribute("data-height-mode", "fill");
    expect(provider.listFamilies).toHaveBeenCalled();
  });

  it("shows draft conflict UI and reloads from server", async () => {
    const provider = buildProvider();
    const conflict = { code: "conflict" as const, message: "version", status: 409 };
    vi.mocked(provider.saveDraft).mockRejectedValueOnce(conflict);
    render(
      <MantineProvider>
        <EntityTypesWidgetCore hostContext={hostContext} provider={provider} />
      </MantineProvider>,
    );

    await screen.findByLabelText(`Entity type family ${famId}`);
    fireEvent.click(screen.getByLabelText(`Entity type family ${famId}`));
    await waitFor(() => {
      expect(provider.getFamily).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Save draft/i }));
    expect(await screen.findByText(/Reload the draft from the server/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Reload draft/i }));
    await waitFor(() => {
      expect(provider.getFamily).toHaveBeenCalledTimes(2);
    });
  });

  it("aborts stale listFamilies when unmounted", async () => {
    const staleSignals: AbortSignal[] = [];
    const provider: EntityTypesDataProvider = {
      ...buildProvider(),
      listFamilies: vi.fn((_ctx: ProviderContext): Promise<EntityTypeFamilySummary[]> => {
        staleSignals.push(_ctx.signal as AbortSignal);
        return new Promise(() => undefined);
      }),
    };
    const { unmount } = render(
      <MantineProvider>
        <EntityTypesWidgetCore hostContext={hostContext} provider={provider} />
      </MantineProvider>,
    );
    await waitFor(() => expect(staleSignals.length).toBeGreaterThan(0));
    unmount();
    expect(staleSignals[0]?.aborted).toBe(true);
  });
});
