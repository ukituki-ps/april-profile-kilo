import { render, screen, waitFor, within } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { createRef } from "react";
import { MantineProvider } from "@mantine/core";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ProfilesDataProvider, ProfilesProviderError } from "../providers/profilesDataProvider";
import type { ProfilesListItem } from "../types";
import {
  ProfilesWidgetProfileDetailCore,
  type ProfilesWidgetProfileDetailHandle,
} from "./ProfilesWidgetProfileDetailCore";

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

vi.mock("@april/ui", async () => {
  const { AprilIconCheck, AprilIconClose, AprilModal } = await vi.importActual<typeof import("@april/ui")>("@april/ui");
  const { SegmentedControl } = await vi.importActual<typeof import("@mantine/core")>("@mantine/core");
  return {
    AprilModal,
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
    CardListColumn: () => null,
  };
});

const p1 = "Alpha profile";
const e1 = "c7c5e6ea-8787-4ca0-a691-9f4fdc9830ff";
const hostContext = { tenant: { id: "tenant-a" }, telemetry: { requestId: "req-1", correlationId: "corr-1" } } as const;

const docPreview = (name: string) => JSON.stringify({ name });

const listRow: ProfilesListItem = {
  entityId: e1,
  entityTypeId: "type-a",
  version: 1,
  updatedAt: "2026-04-24T10:00:00Z",
  preview: docPreview(p1),
};

const buildProvider = (): ProfilesDataProvider => ({
  list: vi.fn(async () => ({
    items: [listRow],
    totalCount: 1,
  })),
  get: vi.fn(async (entityId) => ({
    entityId,
    entityTypeId: "type-a",
    version: 2,
    updatedAt: "2026-04-24T10:00:00Z",
    document: { name: p1, slot: "current" },
  })),
  getByVersion: vi.fn(async (entityId, version) => ({
    entityId,
    entityTypeId: "type-a",
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
  getEntityTypePublishedSchema: vi.fn(async () => ({
    type: "object",
    properties: { name: { type: "string" }, slot: { type: "string" } },
  })),
});

describe("ProfilesWidgetProfileDetailCore", () => {
  it("hides edit/delete/save controls when documentEditingEnabled is false", async () => {
    const provider = buildProvider();
    render(
      <MantineProvider>
        <ProfilesWidgetProfileDetailCore
          hostContext={hostContext}
          provider={provider}
          entityId={e1}
          listItem={listRow}
          listItemsForDuplicateCheck={[listRow]}
          documentEditingEnabled={false}
          allowProfileDelete={false}
        />
      </MantineProvider>,
    );

    await screen.findByTestId("profiles-widget-detail-column");
    expect(screen.queryByRole("button", { name: /Edit profile/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Delete profile/i })).not.toBeInTheDocument();
  });

  it("opens create modal via imperative ref from outside the card", async () => {
    const provider = buildProvider();
    const ref = createRef<ProfilesWidgetProfileDetailHandle>();
    render(
      <MantineProvider>
        <>
          <button type="button" onClick={() => ref.current?.openCreate()}>
            External create
          </button>
          <ProfilesWidgetProfileDetailCore
            ref={ref}
            hostContext={hostContext}
            provider={provider}
            entityId={e1}
            listItem={listRow}
            listItemsForDuplicateCheck={[listRow]}
          />
        </>
      </MantineProvider>,
    );

    await screen.findByTestId("profiles-widget-detail-column");
    fireEvent.click(screen.getByRole("button", { name: /External create/i }));
    expect(await screen.findByLabelText("Profile name")).toBeInTheDocument();
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
    vi.mocked(provider.get).mockRejectedValueOnce(providerError);
    render(
      <MantineProvider>
        <ProfilesWidgetProfileDetailCore
          hostContext={hostContext}
          provider={provider}
          entityId={e1}
          listItem={listRow}
          listItemsForDuplicateCheck={[listRow]}
          onError={onError}
        />
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

  it("supports update when editing enabled", async () => {
    const provider = buildProvider();
    const onAction = vi.fn();
    render(
      <MantineProvider>
        <ProfilesWidgetProfileDetailCore
          hostContext={hostContext}
          provider={provider}
          entityId={e1}
          listItem={listRow}
          listItemsForDuplicateCheck={[listRow]}
          onAction={onAction}
        />
      </MantineProvider>,
    );

    await screen.findByTestId("profiles-widget-detail-column");
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
  });
});
