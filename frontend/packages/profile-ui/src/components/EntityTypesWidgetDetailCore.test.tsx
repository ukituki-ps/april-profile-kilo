import { render, screen, waitFor } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import { EntityTypesWidgetDetailCore } from "./EntityTypesWidgetDetailCore";
import type { EntityTypeFamilySummary, EntityTypesDataProvider } from "../providers/entityTypesDataProvider";
import type { ProfileDetails } from "../providers/profilesDataProvider";

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
  listFamilies: vi.fn(async (): Promise<EntityTypeFamilySummary[]> => []),
  getFamily: vi.fn(async () => ({ ...detail })),
  createFamily: vi.fn(),
  patchFamily: vi.fn(),
  deleteFamily: vi.fn(),
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
    items: [],
    totalCount: 0,
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

describe("EntityTypesWidgetDetailCore", () => {
  it("shows empty state when familyId is null", () => {
    const provider = buildProvider();
    render(
      <MantineProvider>
        <EntityTypesWidgetDetailCore
          hostContext={hostContext}
          provider={provider}
          familyId={null}
          onCatalogReload={vi.fn()}
          onFamilyDeleted={vi.fn()}
        />
      </MantineProvider>,
    );
    expect(screen.getByText(/Select a family from the list/i)).toBeInTheDocument();
  });

  it("loads family when familyId is set", async () => {
    const provider = buildProvider();
    render(
      <MantineProvider>
        <EntityTypesWidgetDetailCore
          hostContext={hostContext}
          provider={provider}
          familyId={famId}
          onCatalogReload={vi.fn()}
          onFamilyDeleted={vi.fn()}
        />
      </MantineProvider>,
    );
    await waitFor(() => {
      expect(provider.getFamily).toHaveBeenCalledWith(famId, expect.anything());
    });
  });
});
