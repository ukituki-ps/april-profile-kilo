import { AprilIconCheck, AprilIconClose, AprilModal, CardListColumn, DensityProvider } from "@april/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionIcon, Alert, Box, Card, Loader, Stack, Text, TextInput } from "@mantine/core";
import { emitProfileWidgetTelemetry } from "../observability";
import type { ProfileWidgetObservabilityHandler } from "../observability";
import type { EntityTypesWidgetAction, ProfileWidgetHostContext } from "../types";
import type { ProfilesProviderErrorCode } from "../providers/profilesDataProvider";
import type { ProviderContext } from "../providers/profilesDataProvider";
import { isProfilesProviderError } from "../providers/profilesDataProvider";
import type { EntityTypeFamilySummary, EntityTypesDataProvider } from "../providers/entityTypesDataProvider";
import {
  EntityTypesDraftJsonEditor,
  parseEntityTypeDraftSchemaText,
  type DraftJsonEditorMode,
} from "./EntityTypesDraftJsonEditor";
import { EntityTypesWidgetDetailCore } from "./EntityTypesWidgetDetailCore";

export type EntityTypesWidgetCoreProps = {
  hostContext: ProfileWidgetHostContext;
  provider: EntityTypesDataProvider;
  providerContext?: Omit<ProviderContext, "signal">;
  /** Размер страницы сущностей на вкладке Upgrade детальной карточки. */
  pageSize?: number;
  onAction?: (action: EntityTypesWidgetAction) => void;
  onError?: (payload: { message: string; requestId?: string; code?: string }) => void;
  onObservability?: ProfileWidgetObservabilityHandler;
  /** Навигация хоста к профилю (например `profiles-widget`). */
  onOpenEntity?: (entityId: string) => void;
};

const DEFAULT_PAGE_SIZE = 20;

const mapSecureMessage = (code: ProfilesProviderErrorCode): string => {
  if (code === "unauthorized") {
    return "Authentication required. Please sign in again.";
  }
  if (code === "forbidden") {
    return "Access denied for this operation.";
  }
  if (code === "conflict") {
    return "The request conflicts with current server state.";
  }
  if (code === "validation") {
    return "Invalid request. Please check your input and try again.";
  }
  if (code === "not_found") {
    return "The requested resource was not found.";
  }
  if (code === "rate_limited") {
    return "Too many requests. Please wait and try again.";
  }
  if (code === "network") {
    return "Network error. Please check your connection and retry.";
  }
  return "Operation failed. Please try again.";
};

export function EntityTypesWidgetCore({
  hostContext,
  provider,
  providerContext,
  pageSize = DEFAULT_PAGE_SIZE,
  onAction,
  onError,
  onObservability,
  onOpenEntity,
}: EntityTypesWidgetCoreProps) {
  const [listLoading, setListLoading] = useState(true);
  const [listErrorMessage, setListErrorMessage] = useState<string | null>(null);
  const [families, setFamilies] = useState<EntityTypeFamilySummary[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);

  const [createOpened, setCreateOpened] = useState(false);
  const [createNamespace, setCreateNamespace] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [createDraftSchema, setCreateDraftSchema] = useState<Record<string, unknown>>({});
  const [createDraftMode, setCreateDraftMode] = useState<DraftJsonEditorMode>("tree");
  const [createDraftSourceText, setCreateDraftSourceText] = useState("{}");
  const [createApiIssues, setCreateApiIssues] = useState<Array<{ path: string; message: string }> | null>(null);
  const [createFlowError, setCreateFlowError] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);

  const listRequestIdRef = useRef(0);
  const listAbortRef = useRef<AbortController | null>(null);

  const requestId = hostContext.telemetry?.requestId;

  const providerContextBase = useMemo<Omit<ProviderContext, "signal">>(
    () =>
      providerContext ?? {
        tenantId: hostContext.tenant.id,
        auth: {
          subject: hostContext.auth?.subject,
          roles: hostContext.auth?.roles,
        },
        telemetry: {
          requestId: hostContext.telemetry?.requestId,
          correlationId: hostContext.telemetry?.correlationId,
        },
      },
    [
      hostContext.tenant.id,
      hostContext.auth?.subject,
      hostContext.auth?.roles,
      hostContext.telemetry?.requestId,
      hostContext.telemetry?.correlationId,
      providerContext,
    ],
  );

  const providerContextBaseRef = useRef(providerContextBase);
  providerContextBaseRef.current = providerContextBase;

  const reportError = useCallback(
    (error: unknown, setter: (message: string) => void) => {
      if (isProfilesProviderError(error)) {
        const message = mapSecureMessage(error.code);
        setter(message);
        onError?.({ message, requestId: error.requestId ?? requestId, code: error.code });
        return;
      }
      const fallback = "Operation failed. Please try again.";
      setter(fallback);
      onError?.({ message: fallback, requestId, code: "unknown" });
    },
    [onError, requestId],
  );

  const loadFamilies = useCallback(async () => {
    const reqId = ++listRequestIdRef.current;
    listAbortRef.current?.abort();
    const ac = new AbortController();
    listAbortRef.current = ac;
    setListErrorMessage(null);
    setListLoading(true);
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "entity_types",
      event: "list_requested",
      meta: { scope: "families" },
    });
    const started = performance.now();
    try {
      const rows = await provider.listFamilies({ ...providerContextBaseRef.current, signal: ac.signal });
      if (reqId !== listRequestIdRef.current) {
        return;
      }
      setFamilies(rows);
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "entity_types",
        event: "list_succeeded",
        meta: { scope: "families", duration_ms: Math.round(performance.now() - started) },
      });
    } catch (error) {
      if ((error as Error)?.name === "AbortError") {
        return;
      }
      if (reqId !== listRequestIdRef.current) {
        return;
      }
      reportError(error, setListErrorMessage);
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "entity_types",
        event: "list_failed",
        meta: { scope: "families" },
      });
    } finally {
      if (reqId === listRequestIdRef.current) {
        setListLoading(false);
      }
    }
  }, [hostContext.tenant.id, onObservability, provider, reportError]);

  useEffect(() => {
    void loadFamilies();
    return () => {
      listAbortRef.current?.abort();
    };
  }, [loadFamilies]);

  const createDraftSaveOk = useMemo(() => {
    if (createDraftMode === "source") {
      return parseEntityTypeDraftSchemaText(createDraftSourceText).ok;
    }
    return true;
  }, [createDraftMode, createDraftSourceText]);

  const handleCreateFamily = async () => {
    let draftObj: Record<string, unknown>;
    if (createDraftMode === "source") {
      const parsed = parseEntityTypeDraftSchemaText(createDraftSourceText);
      if (!parsed.ok) {
        setCreateFlowError(parsed.message);
        return;
      }
      draftObj = parsed.value;
    } else {
      draftObj = createDraftSchema;
    }
    setCreateApiIssues(null);
    setCreateBusy(true);
    try {
      const created = await provider.createFamily(
        { namespace: createNamespace.trim(), code: createCode.trim(), draftSchema: draftObj },
        { ...providerContextBaseRef.current },
      );
      setCreateOpened(false);
      setCreateNamespace("");
      setCreateCode("");
      setCreateDraftSchema({});
      setCreateDraftSourceText("{}");
      setCreateDraftMode("tree");
      await loadFamilies();
      setSelectedFamilyId(created.id);
      onAction?.({
        type: "family_created",
        familyId: created.id,
        namespace: created.namespace,
        code: created.code,
      });
    } catch (error) {
      if (isProfilesProviderError(error) && error.schemaIssues?.length) {
        setCreateApiIssues(error.schemaIssues);
      }
      reportError(error, setCreateFlowError);
    } finally {
      setCreateBusy(false);
    }
  };

  const listItems = useMemo(
    () =>
      families.map((f) => ({
        id: f.id,
        title: `${f.namespace}/${f.code}`,
        description: `${f.status} · draft v${f.draftSchemaVersion}${
          f.publishedSchemaVersion != null ? ` · published v${f.publishedSchemaVersion}` : ""
        }`,
        searchText: `${f.id} ${f.namespace} ${f.code}`,
      })),
    [families],
  );

  if (listLoading) {
    return (
      <Box aria-label="entity-types-list-loading" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Loader size="sm" />
        <Text size="sm">Loading entity type families…</Text>
      </Box>
    );
  }

  return (
    <DensityProvider>
      <Stack gap="md" style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {listErrorMessage ? <Alert color="red">{listErrorMessage}</Alert> : null}
        {createFlowError ? <Alert color="red">{createFlowError}</Alert> : null}

        <Box
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            gap: "1rem",
          }}
        >
          <Box style={{ flex: "0 0 auto", width: "clamp(280px, 30vw, 420px)", minWidth: 280, maxWidth: "44%", minHeight: 0 }}>
            <CardListColumn
              title="Entity types"
              items={listItems}
              mode="inline"
              heightMode="fill"
              defaultWidthPercent={96}
              minWidthPercent={90}
              maxWidthPercent={100}
              withSort={false}
              withFilter={false}
              withAdd
              onAddItem={() => {
                setCreateFlowError(null);
                setCreateApiIssues(null);
                setCreateDraftSchema({});
                setCreateDraftSourceText("{}");
                setCreateDraftMode("tree");
                setCreateOpened(true);
              }}
              totalItems={families.length}
              loadedItemsCount={families.length}
              selectedItemId={selectedFamilyId}
              onSelectItem={(id) => {
                setSelectedFamilyId(id);
              }}
              renderCard={(item) => {
                const f = families.find((row) => row.id === item.id);
                const selected = selectedFamilyId === item.id;
                return (
                  <Card
                    withBorder
                    radius="md"
                    p="sm"
                    aria-label={`Entity type family ${item.id}`}
                    style={{
                      cursor: "pointer",
                      ...(selected
                        ? { borderColor: "var(--mantine-color-teal-filled)", borderWidth: 2 }
                        : { borderWidth: 1 }),
                    }}
                  >
                    <Text fw={600} lineClamp={1}>
                      {item.title}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {item.description}
                    </Text>
                    {f ? (
                      <Text size="xs" mt="xs" lineClamp={1} c="dimmed" title={f.id}>
                        {f.id}
                      </Text>
                    ) : null}
                  </Card>
                );
              }}
            />
          </Box>

          <EntityTypesWidgetDetailCore
            hostContext={hostContext}
            provider={provider}
            providerContext={providerContext}
            familyId={selectedFamilyId}
            pageSize={pageSize}
            onAction={onAction}
            onError={onError}
            onObservability={onObservability}
            onOpenEntity={onOpenEntity}
            onCatalogReload={() => void loadFamilies()}
            onFamilyDeleted={async () => {
              setSelectedFamilyId(null);
              await loadFamilies();
            }}
          />
        </Box>

        <AprilModal
          opened={createOpened}
          onClose={() => setCreateOpened(false)}
          centered
          size="md"
          headerTitle="New entity type family"
          headerActions={
            <>
              <ActionIcon
                variant="default"
                size="lg"
                onClick={() => setCreateOpened(false)}
                aria-label="Cancel"
                title="Cancel"
              >
                <AprilIconClose size={18} aria-hidden />
              </ActionIcon>
              <ActionIcon
                variant="filled"
                color="teal"
                size="lg"
                disabled={!createNamespace.trim() || !createCode.trim() || !createDraftSaveOk}
                loading={createBusy}
                onClick={() => void handleCreateFamily()}
                aria-label="Create entity type family"
                title="Create"
              >
                <AprilIconCheck size={18} aria-hidden />
              </ActionIcon>
            </>
          }
        >
          <Stack gap="sm">
            <TextInput label="Namespace" value={createNamespace} onChange={(e) => setCreateNamespace(e.currentTarget.value)} required />
            <TextInput label="Code" value={createCode} onChange={(e) => setCreateCode(e.currentTarget.value)} required />
            <Text size="sm" fw={500}>
              Initial draft schema
            </Text>
            <EntityTypesDraftJsonEditor
              mode={createDraftMode}
              onModeChange={setCreateDraftMode}
              value={createDraftSchema}
              onChange={setCreateDraftSchema}
              sourceText={createDraftSourceText}
              onSourceTextChange={setCreateDraftSourceText}
              compact
              showSearch={false}
              rootName="initial_draft"
              serverValidationItems={createApiIssues ?? undefined}
            />
          </Stack>
        </AprilModal>
      </Stack>
    </DensityProvider>
  );
}
