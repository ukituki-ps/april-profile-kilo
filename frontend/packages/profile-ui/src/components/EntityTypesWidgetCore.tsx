import {
  AprilIconCheck,
  AprilIconClose,
  AprilIconTrash,
  AprilJsonTreeEditor,
  AprilModal,
  CardListColumn,
  DensityProvider,
} from "@april/ui";
import {
  IconDeviceFloppy,
  IconRocket,
  IconTrash,
  IconArrowUp,
  IconUsersGroup,
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Group,
  Loader,
  ScrollArea,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { emitProfileWidgetTelemetry } from "../observability";
import type { ProfileWidgetObservabilityHandler } from "../observability";
import type { EntityTypesWidgetAction, ProfileWidgetHostContext, ProfilesListItem } from "../types";
import type { ProfilesProviderErrorCode } from "../providers/profilesDataProvider";
import type { ProviderContext } from "../providers/profilesDataProvider";
import { isProfilesProviderError } from "../providers/profilesDataProvider";
import type {
  EntityTypeFamilyDetail,
  EntityTypeFamilySummary,
  EntityTypeRevisionRow,
  EntityTypesDataProvider,
} from "../providers/entityTypesDataProvider";
import {
  EntityTypesDraftJsonEditor,
  parseEntityTypeDraftSchemaText,
  type DraftJsonEditorMode,
} from "./EntityTypesDraftJsonEditor";

export type EntityTypesWidgetCoreProps = {
  hostContext: ProfileWidgetHostContext;
  provider: EntityTypesDataProvider;
  providerContext?: Omit<ProviderContext, "signal">;
  /** Размер страницы списка сущностей на вкладке Upgrade. */
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
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErrorMessage, setDetailErrorMessage] = useState<string | null>(null);
  const [familyDetail, setFamilyDetail] = useState<EntityTypeFamilyDetail | null>(null);
  const [draftSchema, setDraftSchema] = useState<Record<string, unknown>>({});
  const [draftMode, setDraftMode] = useState<DraftJsonEditorMode>("tree");
  const [draftSourceText, setDraftSourceText] = useState("{}");
  const [draftConflict, setDraftConflict] = useState(false);
  const [mutationMessage, setMutationMessage] = useState<string | null>(null);
  const [draftApiIssues, setDraftApiIssues] = useState<Array<{ path: string; message: string }> | null>(null);

  const [revisions, setRevisions] = useState<EntityTypeRevisionRow[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>("draft");

  const [upgradeEntities, setUpgradeEntities] = useState<ProfilesListItem[]>([]);
  const [upgradeNextCursor, setUpgradeNextCursor] = useState<string | undefined>(undefined);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeLoadingMore, setUpgradeLoadingMore] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [selectedEntityIds, setSelectedEntityIds] = useState<Set<string>>(() => new Set());
  const [targetRevisionId, setTargetRevisionId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [createOpened, setCreateOpened] = useState(false);
  const [createNamespace, setCreateNamespace] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [createDraftSchema, setCreateDraftSchema] = useState<Record<string, unknown>>({});
  const [createDraftMode, setCreateDraftMode] = useState<DraftJsonEditorMode>("tree");
  const [createDraftSourceText, setCreateDraftSourceText] = useState("{}");
  const [createApiIssues, setCreateApiIssues] = useState<Array<{ path: string; message: string }> | null>(null);

  const [patchOpened, setPatchOpened] = useState(false);
  const [patchNamespace, setPatchNamespace] = useState("");
  const [patchCode, setPatchCode] = useState("");

  const [deleteOpened, setDeleteOpened] = useState(false);

  const listRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);
  const listAbortRef = useRef<AbortController | null>(null);
  const detailAbortRef = useRef<AbortController | null>(null);

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

  const applyFamilyDetail = useCallback((detail: EntityTypeFamilyDetail) => {
    setFamilyDetail(detail);
    setDraftSchema(detail.draftSchema);
    setDraftSourceText(JSON.stringify(detail.draftSchema, null, 2));
    setDraftMode("tree");
    setDraftConflict(false);
    setMutationMessage(null);
    setDraftApiIssues(null);
  }, []);

  const loadFamilyDetail = useCallback(
    async (familyId: string) => {
      const reqId = ++detailRequestIdRef.current;
      detailAbortRef.current?.abort();
      const ac = new AbortController();
      detailAbortRef.current = ac;
      setDetailErrorMessage(null);
      setDetailLoading(true);
      setRevisions([]);
      setRevisionsLoading(true);
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "entity_types",
        event: "details_requested",
        meta: { family_id: familyId },
      });
      try {
        const [detail, revs] = await Promise.all([
          provider.getFamily(familyId, { ...providerContextBaseRef.current, signal: ac.signal }),
          provider.listRevisions(familyId, { ...providerContextBaseRef.current, signal: ac.signal }),
        ]);
        if (reqId !== detailRequestIdRef.current) {
          return;
        }
        applyFamilyDetail(detail);
        const sorted = [...revs].sort((a, b) => a.revisionNo - b.revisionNo);
        setRevisions(sorted);
        const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;
        setTargetRevisionId(latest?.id ?? null);
        setSelectedRevisionId(latest?.id ?? null);
      } catch (error) {
        if ((error as Error)?.name === "AbortError") {
          return;
        }
        if (reqId !== detailRequestIdRef.current) {
          return;
        }
        reportError(error, setDetailErrorMessage);
        setFamilyDetail(null);
        emitProfileWidgetTelemetry(onObservability, hostContext, {
          widget: "entity_types",
          event: "details_failed",
          meta: { family_id: familyId },
        });
      } finally {
        if (reqId === detailRequestIdRef.current) {
          setDetailLoading(false);
          setRevisionsLoading(false);
        }
      }
    },
    [applyFamilyDetail, hostContext.tenant.id, onObservability, provider, reportError],
  );

  useEffect(() => {
    if (!selectedFamilyId) {
      setFamilyDetail(null);
      setDraftSchema({});
      setDraftSourceText("{}");
      setDraftMode("tree");
      setDraftApiIssues(null);
      setRevisions([]);
      setSelectedRevisionId(null);
      setUpgradeEntities([]);
      setUpgradeNextCursor(undefined);
      setSelectedEntityIds(new Set());
      return;
    }
    void loadFamilyDetail(selectedFamilyId);
    return () => {
      detailAbortRef.current?.abort();
    };
  }, [loadFamilyDetail, selectedFamilyId]);

  const reloadRevisionsOnly = useCallback(async () => {
    if (!selectedFamilyId) {
      return;
    }
    setRevisionsLoading(true);
    try {
      const revs = await provider.listRevisions(selectedFamilyId, { ...providerContextBaseRef.current });
      const sorted = [...revs].sort((a, b) => a.revisionNo - b.revisionNo);
      setRevisions(sorted);
      const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;
      setTargetRevisionId((current) => {
        if (current && sorted.some((r) => r.id === current)) {
          return current;
        }
        return latest?.id ?? null;
      });
      setSelectedRevisionId((current) => {
        if (current && sorted.some((r) => r.id === current)) {
          return current;
        }
        return latest?.id ?? null;
      });
    } catch (error) {
      reportError(error, setDetailErrorMessage);
    } finally {
      setRevisionsLoading(false);
    }
  }, [provider, reportError, selectedFamilyId]);

  const loadUpgradePage = useCallback(
    async ({ append, cursor }: { append: boolean; cursor?: string }) => {
      if (!selectedFamilyId) {
        return;
      }
      if (append) {
        setUpgradeLoadingMore(true);
      } else {
        setUpgradeLoading(true);
        setUpgradeError(null);
      }
      try {
        const page = await provider.listProfilesForType(
          selectedFamilyId,
          {
            limit: pageSize,
            cursor: append ? cursor : undefined,
            sort: "updated_desc",
          },
          { ...providerContextBaseRef.current },
        );
        setUpgradeEntities((prev) => (append ? [...prev, ...page.items] : page.items));
        setUpgradeNextCursor(page.nextCursor);
      } catch (error) {
        reportError(error, setUpgradeError);
      } finally {
        setUpgradeLoading(false);
        setUpgradeLoadingMore(false);
      }
    },
    [pageSize, provider, reportError, selectedFamilyId],
  );

  useEffect(() => {
    if (activeTab !== "upgrade" || !selectedFamilyId) {
      return;
    }
    setUpgradeEntities([]);
    setUpgradeNextCursor(undefined);
    setSelectedEntityIds(new Set());
    void loadUpgradePage({ append: false });
  }, [activeTab, loadUpgradePage, selectedFamilyId]);

  const draftSaveParseOk = useMemo(() => {
    if (draftMode === "source") {
      return parseEntityTypeDraftSchemaText(draftSourceText).ok;
    }
    return true;
  }, [draftMode, draftSourceText]);

  const createDraftSaveOk = useMemo(() => {
    if (createDraftMode === "source") {
      return parseEntityTypeDraftSchemaText(createDraftSourceText).ok;
    }
    return true;
  }, [createDraftMode, createDraftSourceText]);

  const selectedRevision = useMemo(
    () => revisions.find((r) => r.id === selectedRevisionId) ?? null,
    [revisions, selectedRevisionId],
  );

  const handleSaveDraft = async () => {
    if (!selectedFamilyId || !familyDetail) {
      return;
    }
    let schemaPayload = draftSchema;
    if (draftMode === "source") {
      const parsed = parseEntityTypeDraftSchemaText(draftSourceText);
      if (!parsed.ok) {
        setMutationMessage(parsed.message);
        return;
      }
      schemaPayload = parsed.value;
      setDraftSchema(parsed.value);
    }
    setMutationMessage(null);
    setDraftApiIssues(null);
    setDraftConflict(false);
    setBusy("save-draft");
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "entity_types",
      event: "draft_save_submitted",
      meta: { family_id: selectedFamilyId },
    });
    try {
      const updated = await provider.saveDraft(
        selectedFamilyId,
        { draftSchema: schemaPayload, ifDraftSchemaVersion: familyDetail.draftSchemaVersion },
        { ...providerContextBaseRef.current },
      );
      applyFamilyDetail(updated);
      void reloadRevisionsOnly();
      onAction?.({ type: "draft_saved", familyId: selectedFamilyId, draftSchemaVersion: updated.draftSchemaVersion });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "entity_types",
        event: "draft_save_succeeded",
        meta: { family_id: selectedFamilyId },
      });
      await loadFamilies();
    } catch (error) {
      if (isProfilesProviderError(error) && error.schemaIssues?.length) {
        setDraftApiIssues(error.schemaIssues);
      } else {
        setDraftApiIssues(null);
      }
      if (isProfilesProviderError(error) && error.code === "conflict") {
        setDraftConflict(true);
        setMutationMessage(mapSecureMessage("conflict"));
      } else {
        reportError(error, setMutationMessage);
      }
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "entity_types",
        event: "draft_save_failed",
        meta: { family_id: selectedFamilyId },
      });
    } finally {
      setBusy(null);
    }
  };

  const handlePublish = async () => {
    if (!selectedFamilyId) {
      return;
    }
    setMutationMessage(null);
    setDraftApiIssues(null);
    setBusy("publish");
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "entity_types",
      event: "publish_submitted",
      meta: { family_id: selectedFamilyId },
    });
    try {
      const updated = await provider.publishDraft(selectedFamilyId, { ...providerContextBaseRef.current });
      applyFamilyDetail(updated);
      await reloadRevisionsOnly();
      onAction?.({ type: "revision_published", familyId: selectedFamilyId });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "entity_types",
        event: "publish_succeeded",
        meta: { family_id: selectedFamilyId },
      });
      await loadFamilies();
      if (activeTab === "upgrade") {
        void loadUpgradePage({ append: false });
      }
    } catch (error) {
      if (isProfilesProviderError(error) && error.schemaIssues?.length) {
        setDraftApiIssues(error.schemaIssues);
      }
      reportError(error, setMutationMessage);
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "entity_types",
        event: "publish_failed",
        meta: { family_id: selectedFamilyId },
      });
    } finally {
      setBusy(null);
    }
  };

  const handleReloadDraftFromServer = async () => {
    if (!selectedFamilyId) {
      return;
    }
    setBusy("reload");
    try {
      const detail = await provider.getFamily(selectedFamilyId, { ...providerContextBaseRef.current });
      applyFamilyDetail(detail);
      await reloadRevisionsOnly();
    } catch (error) {
      reportError(error, setMutationMessage);
    } finally {
      setBusy(null);
    }
  };

  const handleCreateFamily = async () => {
    let draftObj: Record<string, unknown>;
    if (createDraftMode === "source") {
      const parsed = parseEntityTypeDraftSchemaText(createDraftSourceText);
      if (!parsed.ok) {
        setMutationMessage(parsed.message);
        return;
      }
      draftObj = parsed.value;
    } else {
      draftObj = createDraftSchema;
    }
    setCreateApiIssues(null);
    setBusy("create");
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
      reportError(error, setMutationMessage);
    } finally {
      setBusy(null);
    }
  };

  const handlePatchFamily = async () => {
    if (!selectedFamilyId) {
      return;
    }
    setBusy("patch");
    try {
      await provider.patchFamily(
        selectedFamilyId,
        { namespace: patchNamespace.trim(), code: patchCode.trim() },
        { ...providerContextBaseRef.current },
      );
      setPatchOpened(false);
      await loadFamilies();
      await loadFamilyDetail(selectedFamilyId);
      onAction?.({ type: "family_patched", familyId: selectedFamilyId });
    } catch (error) {
      reportError(error, setMutationMessage);
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteFamily = async () => {
    if (!selectedFamilyId) {
      return;
    }
    setBusy("delete");
    try {
      const deletedId = selectedFamilyId;
      await provider.deleteFamily(deletedId, { ...providerContextBaseRef.current });
      setDeleteOpened(false);
      setSelectedFamilyId(null);
      await loadFamilies();
      onAction?.({ type: "family_deleted", familyId: deletedId });
    } catch (error) {
      reportError(error, setMutationMessage);
    } finally {
      setBusy(null);
    }
  };

  const targetRevisionSelectData = useMemo(
    () =>
      revisions.map((r) => ({
        value: r.id,
        label: `Revision ${r.revisionNo} (${r.id.slice(0, 8)}…)`,
      })),
    [revisions],
  );

  const selectedTargetRevision = useMemo(
    () => revisions.find((r) => r.id === targetRevisionId) ?? null,
    [revisions, targetRevisionId],
  );

  const handleSingleUpgrade = async (entityId: string) => {
    if (!selectedFamilyId) {
      return;
    }
    setUpgradeError(null);
    setBusy(`up-${entityId}`);
    onAction?.({ type: "entity_upgrade_requested", entityId });
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "entity_types",
      event: "upgrade_submitted",
      meta: { entity_id: entityId, family_id: selectedFamilyId },
    });
    try {
      const body =
        selectedTargetRevision === null
          ? undefined
          : { entityTypeRevisionId: selectedTargetRevision.id };
      await provider.upgradeEntityProfileBinding(entityId, body, { ...providerContextBaseRef.current });
      onAction?.({ type: "entity_upgrade_succeeded", entityId });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "entity_types",
        event: "upgrade_succeeded",
        meta: { entity_id: entityId },
      });
      void loadUpgradePage({ append: false });
    } catch (error) {
      const msg = isProfilesProviderError(error) ? mapSecureMessage(error.code) : "Upgrade failed.";
      onAction?.({ type: "entity_upgrade_failed", entityId, message: msg });
      reportError(error, setUpgradeError);
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "entity_types",
        event: "upgrade_failed",
        meta: { entity_id: entityId },
      });
    } finally {
      setBusy(null);
    }
  };

  const handleBatchUpgradeSelected = async () => {
    if (!selectedFamilyId || selectedEntityIds.size === 0) {
      return;
    }
    setBusy("batch");
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "entity_types",
      event: "batch_upgrade_submitted",
      meta: { mode: "selected", count: selectedEntityIds.size },
    });
    try {
      const result = await provider.batchUpgradeEntityBindings(
        {
          entityTypeId: selectedFamilyId,
          entityIds: [...selectedEntityIds],
          targetEntityTypeRevisionId: selectedTargetRevision?.id,
        },
        { ...providerContextBaseRef.current },
      );
      onAction?.({
        type: "batch_upgrade_completed",
        entityTypeId: selectedFamilyId,
        succeeded: result.succeeded,
        failed: result.failed,
        processed: result.processed,
      });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "entity_types",
        event: "batch_upgrade_completed",
        meta: { succeeded: result.succeeded, failed: result.failed },
      });
      setSelectedEntityIds(new Set());
      void loadUpgradePage({ append: false });
    } catch (error) {
      reportError(error, setUpgradeError);
    } finally {
      setBusy(null);
    }
  };

  const handleBatchUpgradeBehind = async () => {
    if (!selectedFamilyId) {
      return;
    }
    setBusy("batch-behind");
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "entity_types",
      event: "batch_upgrade_submitted",
      meta: { mode: "behind_latest" },
    });
    try {
      const result = await provider.batchUpgradeEntityBindings(
        {
          entityTypeId: selectedFamilyId,
          onlyBehindLatest: true,
          limit: 500,
          targetEntityTypeRevisionId: selectedTargetRevision?.id,
        },
        { ...providerContextBaseRef.current },
      );
      onAction?.({
        type: "batch_upgrade_completed",
        entityTypeId: selectedFamilyId,
        succeeded: result.succeeded,
        failed: result.failed,
        processed: result.processed,
      });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "entity_types",
        event: "batch_upgrade_completed",
        meta: { succeeded: result.succeeded, failed: result.failed, mode: "behind_latest" },
      });
      void loadUpgradePage({ append: false });
    } catch (error) {
      reportError(error, setUpgradeError);
    } finally {
      setBusy(null);
    }
  };

  const toggleEntitySelected = (entityId: string) => {
    setSelectedEntityIds((prev) => {
      const next = new Set(prev);
      if (next.has(entityId)) {
        next.delete(entityId);
      } else {
        next.add(entityId);
      }
      return next;
    });
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
      {mutationMessage ? <Alert color="red">{mutationMessage}</Alert> : null}

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
              setMutationMessage(null);
              setCreateApiIssues(null);
              setCreateDraftSchema({});
              setCreateDraftSourceText("{}");
              setCreateDraftMode("tree");
              setCreateOpened(true);
            }}
            totalItems={families.length}
            loadedItemsCount={families.length}
            renderCard={(item) => {
              const f = families.find((row) => row.id === item.id);
              const selected = selectedFamilyId === item.id;
              return (
                <Card
                  withBorder
                  shadow={selected ? "sm" : undefined}
                  radius="md"
                  p="sm"
                  aria-label={`Entity type family ${item.id}`}
                  style={{ borderColor: selected ? "var(--mantine-color-blue-6)" : undefined, cursor: "pointer" }}
                  onClick={() => {
                    setSelectedFamilyId(item.id);
                    setActiveTab("draft");
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

        <Stack gap="sm" style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {!selectedFamilyId ? (
            <Alert color="gray">Select a family from the list or create a new one.</Alert>
          ) : detailLoading ? (
            <Group gap="sm">
              <Loader size="sm" />
              <Text size="sm">Loading family…</Text>
            </Group>
          ) : detailErrorMessage ? (
            <Alert color="red">{detailErrorMessage}</Alert>
          ) : familyDetail ? (
            <>
              <Group justify="space-between" align="flex-start" wrap="wrap">
                <Stack gap={4} style={{ minWidth: 0 }}>
                  <Title order={5}>Family</Title>
                  <Text size="sm" fw={600} lineClamp={1}>
                    {familyDetail.namespace}/{familyDetail.code}
                  </Text>
                  <Text size="xs" c="dimmed">
                    id {familyDetail.id}
                  </Text>
                </Stack>
                <Group gap="xs">
                  <Button size="xs" variant="light" onClick={() => {
                    setPatchNamespace(familyDetail.namespace);
                    setPatchCode(familyDetail.code);
                    setPatchOpened(true);
                  }}>
                    Edit namespace/code
                  </Button>
                  <Button size="xs" color="red" variant="light" onClick={() => setDeleteOpened(true)}>
                    Delete family
                  </Button>
                </Group>
              </Group>

              <Tabs value={activeTab} onChange={(v) => setActiveTab(v ?? "draft")} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                <Tabs.List>
                  <Tabs.Tab value="draft">Draft</Tabs.Tab>
                  <Tabs.Tab value="revisions">Revisions</Tabs.Tab>
                  <Tabs.Tab value="upgrade" leftSection={<IconArrowUp size={14} />}>
                    Upgrade
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="draft" pt="sm" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                  {draftConflict ? (
                    <Alert color="yellow" mb="sm" title="Draft was changed elsewhere">
                      <Group justify="space-between" align="center" wrap="wrap">
                        <Text size="sm">Reload the draft from the server, then re-apply your edits.</Text>
                        <Button size="xs" onClick={() => void handleReloadDraftFromServer()} loading={busy === "reload"}>
                          Reload draft
                        </Button>
                      </Group>
                    </Alert>
                  ) : null}
                  <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                    <Text size="sm" fw={500} mb="xs">
                      Draft JSON Schema
                    </Text>
                    <EntityTypesDraftJsonEditor
                      mode={draftMode}
                      onModeChange={setDraftMode}
                      value={draftSchema}
                      onChange={setDraftSchema}
                      sourceText={draftSourceText}
                      onSourceTextChange={setDraftSourceText}
                      serverValidationItems={draftApiIssues ?? undefined}
                    />
                  </Box>
                  <Group mt="sm" justify="flex-end">
                    <Tooltip label="Save draft (optimistic concurrency)">
                      <Button
                        leftSection={<IconDeviceFloppy size={16} />}
                        onClick={() => void handleSaveDraft()}
                        loading={busy === "save-draft"}
                        disabled={!draftSaveParseOk}
                      >
                        Save draft
                      </Button>
                    </Tooltip>
                    <Tooltip label="Publish draft as new immutable revision">
                      <Button
                        leftSection={<IconRocket size={16} />}
                        color="teal"
                        onClick={() => void handlePublish()}
                        loading={busy === "publish"}
                      >
                        Publish
                      </Button>
                    </Tooltip>
                  </Group>
                </Tabs.Panel>

                <Tabs.Panel value="revisions" pt="sm" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: "sm" }}>
                  {revisionsLoading ? (
                    <Loader size="sm" />
                  ) : revisions.length === 0 ? (
                    <Alert color="gray">No published revisions yet. Publish a draft to create revision 1.</Alert>
                  ) : (
                    <>
                      <ScrollArea style={{ flex: "0 0 auto", maxHeight: "42%" }}>
                        <Table striped highlightOnHover withTableBorder>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>No.</Table.Th>
                              <Table.Th>Published</Table.Th>
                              <Table.Th>Revision id</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {revisions.map((r) => (
                              <Table.Tr
                                key={r.id}
                                onClick={() => setSelectedRevisionId(r.id)}
                                style={{
                                  cursor: "pointer",
                                  backgroundColor: r.id === selectedRevisionId ? "var(--mantine-color-blue-light)" : undefined,
                                }}
                              >
                                <Table.Td>{r.revisionNo}</Table.Td>
                                <Table.Td>{r.publishedAt}</Table.Td>
                                <Table.Td>
                                  <Text size="xs" ff="monospace">
                                    {r.id}
                                  </Text>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </ScrollArea>
                      {selectedRevision ? (
                        <Box style={{ flex: 1, minHeight: 160, overflow: "auto" }}>
                          <Text size="sm" fw={500} mb="xs">
                            Schema snapshot (revision {selectedRevision.revisionNo}, read-only)
                          </Text>
                          <AprilJsonTreeEditor
                            data={selectedRevision.schema}
                            readOnly
                            rootName={`revision_${selectedRevision.revisionNo}`}
                            resolveValidationSchemaRefs={false}
                            showSearch
                          />
                        </Box>
                      ) : null}
                    </>
                  )}
                </Tabs.Panel>

                <Tabs.Panel value="upgrade" pt="sm" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: "sm" }}>
                  <Alert icon={<IconUsersGroup size={18} />} color="blue" variant="light">
                    Profiles of this entity type. Select a target revision (default: latest). Upgrade validates the document
                    against the target schema.
                  </Alert>
                  <Select
                    label="Target revision"
                    description="Empty list until at least one revision is published."
                    data={targetRevisionSelectData}
                    value={targetRevisionId}
                    onChange={setTargetRevisionId}
                    clearable={false}
                    disabled={revisions.length === 0}
                  />
                  {upgradeError ? <Alert color="red">{upgradeError}</Alert> : null}
                  <Group>
                    <Button
                      size="xs"
                      onClick={() => void handleBatchUpgradeSelected()}
                      disabled={selectedEntityIds.size === 0 || revisions.length === 0}
                      loading={busy === "batch"}
                    >
                      Upgrade selected ({selectedEntityIds.size})
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => void handleBatchUpgradeBehind()}
                      disabled={revisions.length === 0}
                      loading={busy === "batch-behind"}
                    >
                      Upgrade all behind latest
                    </Button>
                  </Group>
                  {upgradeLoading ? (
                    <Loader size="sm" />
                  ) : (
                    <ScrollArea style={{ flex: 1, minHeight: 120 }}>
                      <Table striped withTableBorder>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th w={40} />
                            <Table.Th>Entity</Table.Th>
                            <Table.Th>Version</Table.Th>
                            <Table.Th w={100}>Actions</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {upgradeEntities.map((row) => (
                            <Table.Tr key={row.entityId}>
                              <Table.Td>
                                <Checkbox
                                  aria-label={`Select ${row.entityId}`}
                                  checked={selectedEntityIds.has(row.entityId)}
                                  onChange={() => toggleEntitySelected(row.entityId)}
                                />
                              </Table.Td>
                              <Table.Td>
                                <Text
                                  size="sm"
                                  style={{ cursor: onOpenEntity ? "pointer" : undefined }}
                                  onClick={() => onOpenEntity?.(row.entityId)}
                                >
                                  {row.entityId}
                                </Text>
                              </Table.Td>
                              <Table.Td>{row.version}</Table.Td>
                              <Table.Td>
                                <Tooltip label="Upgrade this entity">
                                  <ActionIcon
                                    size="sm"
                                    variant="light"
                                    aria-label={`Upgrade entity ${row.entityId}`}
                                    loading={busy === `up-${row.entityId}`}
                                    disabled={revisions.length === 0}
                                    onClick={() => void handleSingleUpgrade(row.entityId)}
                                  >
                                    <IconArrowUp size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </ScrollArea>
                  )}
                  {upgradeNextCursor ? (
                    <Button
                      size="xs"
                      variant="default"
                      loading={upgradeLoadingMore}
                      onClick={() => void loadUpgradePage({ append: true, cursor: upgradeNextCursor })}
                    >
                      Load more
                    </Button>
                  ) : null}
                </Tabs.Panel>
              </Tabs>
            </>
          ) : null}
        </Stack>
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
              loading={busy === "create"}
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

      <AprilModal
        opened={patchOpened}
        onClose={() => setPatchOpened(false)}
        centered
        size="md"
        headerTitle="Edit namespace / code"
        headerActions={
          <>
            <ActionIcon
              variant="default"
              size="lg"
              onClick={() => setPatchOpened(false)}
              aria-label="Cancel"
              title="Cancel"
            >
              <AprilIconClose size={18} aria-hidden />
            </ActionIcon>
            <ActionIcon
              variant="filled"
              color="teal"
              size="lg"
              loading={busy === "patch"}
              onClick={() => void handlePatchFamily()}
              aria-label="Save namespace and code"
              title="Save"
            >
              <AprilIconCheck size={18} aria-hidden />
            </ActionIcon>
          </>
        }
      >
        <Stack gap="sm">
          <TextInput label="Namespace" value={patchNamespace} onChange={(e) => setPatchNamespace(e.currentTarget.value)} />
          <TextInput label="Code" value={patchCode} onChange={(e) => setPatchCode(e.currentTarget.value)} />
        </Stack>
      </AprilModal>

      <AprilModal
        opened={deleteOpened}
        onClose={() => setDeleteOpened(false)}
        centered
        size="md"
        headerTitle="Delete family?"
        headerActions={
          <>
            <ActionIcon
              variant="default"
              size="lg"
              onClick={() => setDeleteOpened(false)}
              aria-label="Cancel"
              title="Cancel"
            >
              <AprilIconClose size={18} aria-hidden />
            </ActionIcon>
            <ActionIcon
              color="red"
              size="lg"
              loading={busy === "delete"}
              onClick={() => void handleDeleteFamily()}
              aria-label="Delete entity type family"
              title="Delete"
            >
              <AprilIconTrash size={18} aria-hidden />
            </ActionIcon>
          </>
        }
      >
        <Text size="sm" mb="md">
          Allowed only when there are no published revisions and no entities. Server returns 409 otherwise.
        </Text>
      </AprilModal>
    </Stack>
    </DensityProvider>
  );
}
