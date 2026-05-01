import { AprilJsonTreeEditor, CardListColumn, DensityProvider } from "@april/ui";
import {
  IconDeviceFloppy,
  IconEdit,
  IconSparkles,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EntityTypesDraftJsonEditor,
  ENTITY_TYPE_DRAFT_ROOT_JSON_SCHEMA,
  parseEntityTypeDraftSchemaText,
  type DraftJsonEditorMode,
} from "./EntityTypesDraftJsonEditor";
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { emitProfileWidgetTelemetry } from "../observability";
import type { ProfileWidgetObservabilityHandler } from "../observability";
import {
  extractProfileNameFromDocument,
  isDuplicateProfileName,
  listPrimaryLabel,
  listSecondaryLabel,
} from "../profileDisplay";
import type { ProfileWidgetHostContext, ProfilesListAction, ProfilesListItem } from "../types";
import type {
  ProfileDetails,
  ProfilesDataProvider,
  ProfilesListSort,
  ProfilesProviderErrorCode,
  ProviderContext,
} from "../providers/profilesDataProvider";
import { isProfilesProviderError } from "../providers/profilesDataProvider";

export type ProfilesWidgetCoreProps = {
  hostContext: ProfileWidgetHostContext;
  provider: ProfilesDataProvider;
  providerContext?: Omit<ProviderContext, "signal">;
  /** После загрузки каталога типов подставить это значение в модалку создания (удобно для тестов/host). */
  initialCreateEntityTypeId?: string | null;
  pageSize?: number;
  initialSearch?: string;
  initialTypeId?: string;
  initialSort?: ProfilesListSort;
  autoSelectFirst?: boolean;
  onAction?: (action: ProfilesListAction) => void;
  onError?: (payload: { message: string; requestId?: string; code?: string }) => void;
  onObservability?: ProfileWidgetObservabilityHandler;
  onOpenEntity?: (entityId: string) => void;
};

const DEFAULT_PAGE_SIZE = 20;

type PublishedSchemaPanelState =
  | { status: "unsupported" }
  | { status: "loading" }
  | { status: "ok"; data: Record<string, unknown> }
  | { status: "none" }
  | { status: "error"; message: string };

const mapSecureMessage = (code: ProfilesProviderErrorCode): string => {
  if (code === "unauthorized") {
    return "Authentication required. Please sign in again.";
  }
  if (code === "forbidden") {
    return "Access denied for this operation.";
  }
  if (code === "conflict") {
    return "The request conflicts with current profile state.";
  }
  if (code === "validation") {
    return "Invalid request. Please check your input and try again.";
  }
  if (code === "rate_limited") {
    return "Too many requests. Please wait and try again.";
  }
  if (code === "network") {
    return "Network error. Please check your connection and retry.";
  }
  return "Profile operation failed. Please try again.";
};

export function ProfilesWidgetCore({
  hostContext,
  provider,
  providerContext,
  initialCreateEntityTypeId = null,
  pageSize = DEFAULT_PAGE_SIZE,
  initialSearch = "",
  initialTypeId = "all",
  initialSort = "updated_desc",
  autoSelectFirst = false,
  onAction,
  onError,
  onObservability,
  onOpenEntity,
}: ProfilesWidgetCoreProps) {
  const [listLoading, setListLoading] = useState(true);
  const [listLoadingMore, setListLoadingMore] = useState(false);
  const [listErrorMessage, setListErrorMessage] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [detailsErrorMessage, setDetailsErrorMessage] = useState<string | null>(null);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);
  const [items, setItems] = useState<ProfilesListItem[]>([]);
  const itemsRef = useRef<ProfilesListItem[]>([]);
  itemsRef.current = items;
  const [query, setQuery] = useState(initialSearch);
  const [filterTypeId, setFilterTypeId] = useState(initialTypeId);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Record<string, unknown> | null>(null);
  const [headVersion, setHeadVersion] = useState<number | null>(null);
  const [viewedVersion, setViewedVersion] = useState<number | null>(null);
  const [versionDetailsByNum, setVersionDetailsByNum] = useState<Record<number, ProfileDetails>>({});
  const [editMode, setEditMode] = useState(false);
  const [editDraftMode, setEditDraftMode] = useState<DraftJsonEditorMode>("tree");
  const [editDraftValue, setEditDraftValue] = useState<Record<string, unknown>>({});
  const [editDraftSourceText, setEditDraftSourceText] = useState("{}");
  const [editApiIssues, setEditApiIssues] = useState<Array<{ path: string; message: string }> | null>(null);
  const [createTypeId, setCreateTypeId] = useState<string | null>(null);
  const [createProfileName, setCreateProfileName] = useState("New profile");
  const [createDraftMode, setCreateDraftMode] = useState<DraftJsonEditorMode>("tree");
  const [createDraftValue, setCreateDraftValue] = useState<Record<string, unknown>>({});
  const [createDraftSourceText, setCreateDraftSourceText] = useState("{}");
  const [createApiIssues, setCreateApiIssues] = useState<Array<{ path: string; message: string }> | null>(null);
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [busyEntityId, setBusyEntityId] = useState<string | null>(null);
  const [entityTypeOptions, setEntityTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [listCollapsed, setListCollapsed] = useState(false);
  const [profileDocumentTab, setProfileDocumentTab] = useState<"formData" | "schema">("formData");
  const [createDocumentTab, setCreateDocumentTab] = useState<"formData" | "schema">("formData");
  const [profilePublishedSchema, setProfilePublishedSchema] = useState<PublishedSchemaPanelState>({ status: "unsupported" });
  const [createPublishedSchema, setCreatePublishedSchema] = useState<PublishedSchemaPanelState>({ status: "unsupported" });
  const profileSchemaRequestRef = useRef(0);
  const createSchemaRequestRef = useRef(0);

  const requestId = hostContext.telemetry?.requestId;
  const preferredSelectionRef = useRef<string | null>(null);
  const listRequestIdRef = useRef(0);
  const detailsRequestIdRef = useRef(0);
  const listAbortControllerRef = useRef<AbortController | null>(null);
  const detailsAbortControllerRef = useRef<AbortController | null>(null);

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

  /** Latest auth token / tenant slice without retriggering list effects when only `accessToken` rotates. */
  const providerContextBaseRef = useRef(providerContextBase);
  providerContextBaseRef.current = providerContextBase;

  const typeOptions = useMemo(() => {
    const unique = [...new Set(items.map((item) => item.entityTypeId))];
    return [{ value: "all", label: "All types" }, ...unique.map((value) => ({ value, label: value }))];
  }, [items]);

  const selectedItem = selectedEntityId ? items.find((item) => item.entityId === selectedEntityId) ?? null : null;

  const historicalView = viewedVersion !== null && headVersion !== null && viewedVersion < headVersion;

  const editDraftSaveOk = useMemo(() => {
    if (editDraftMode === "source") {
      return parseEntityTypeDraftSchemaText(editDraftSourceText).ok;
    }
    return true;
  }, [editDraftMode, editDraftSourceText]);

  const createDraftSaveOk = useMemo(() => {
    if (createDraftMode === "source") {
      return parseEntityTypeDraftSchemaText(createDraftSourceText).ok;
    }
    return true;
  }, [createDraftMode, createDraftSourceText]);

  const reportError = (error: unknown, setter: (message: string) => void) => {
    if (isProfilesProviderError(error)) {
      const message = mapSecureMessage(error.code);
      setter(message);
      onError?.({ message, requestId: error.requestId ?? requestId, code: error.code });
      return;
    }
    const fallback = "Profile operation failed. Please try again.";
    setter(fallback);
    onError?.({ message: fallback, requestId, code: "unknown" });
  };

  const loadList = async ({ cursor, append }: { cursor?: string; append: boolean }) => {
    const requestIdRef = ++listRequestIdRef.current;
    listAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    listAbortControllerRef.current = abortController;
    const startedAt = performance.now();
    if (append) {
      setListLoadingMore(true);
    } else {
      setListErrorMessage(null);
      setMutationErrorMessage(null);
      if (itemsRef.current.length === 0) {
        setListLoading(true);
      } else {
        setListLoadingMore(true);
      }
    }
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "profiles_list",
      event: "list_requested",
      meta: {
        operation: "list_profiles",
        phase: "api",
        has_cursor: Boolean(cursor),
      },
    });
    try {
      const page = await provider.list(
        {
          search: query.trim() || undefined,
          entityTypeId: filterTypeId === "all" ? undefined : filterTypeId,
          limit: pageSize,
          cursor,
          sort: initialSort,
        },
        { ...providerContextBaseRef.current, signal: abortController.signal },
      );
      if (requestIdRef !== listRequestIdRef.current) {
        return;
      }

      let nextItems: ProfilesListItem[] = page.items;
      setItems((prev) => {
        if (!append) {
          nextItems = page.items;
          return page.items;
        }
        const existing = new Set(prev.map((item) => item.entityId));
        nextItems = [...prev, ...page.items.filter((item) => !existing.has(item.entityId))];
        return nextItems;
      });
      setNextCursor(page.nextCursor);
      setTotalCount(page.totalCount);
      setSelectedEntityId((prev) => {
        const preferred = preferredSelectionRef.current;
        if (preferred && nextItems.some((item) => item.entityId === preferred)) {
          preferredSelectionRef.current = null;
          return preferred;
        }
        if (prev && nextItems.some((item) => item.entityId === prev)) {
          return prev;
        }
        if (autoSelectFirst) {
          return nextItems[0]?.entityId ?? null;
        }
        return null;
      });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "list_succeeded",
        meta: {
          operation: "list_profiles",
          row_count: page.items.length,
          has_next_cursor: Boolean(page.nextCursor),
          latency_ms: Math.round(performance.now() - startedAt),
        },
      });
      if (!append) {
        emitProfileWidgetTelemetry(onObservability, hostContext, {
          widget: "profiles_list",
          event: "view_loaded",
          meta: { row_count: page.items.length, total_count: page.totalCount },
        });
      }
    } catch (error) {
      if (requestIdRef !== listRequestIdRef.current) {
        return;
      }
      if (abortController.signal.aborted) {
        return;
      }
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "list_failed",
        meta: {
          operation: "list_profiles",
          phase: "api",
          latency_ms: Math.round(performance.now() - startedAt),
          error_code: isProfilesProviderError(error) ? error.code : "unknown",
        },
      });
      reportError(error, (message) => setListErrorMessage(message));
    } finally {
      if (requestIdRef === listRequestIdRef.current) {
        setListLoading(false);
        setListLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    void loadList({ append: false });
    return () => {
      listAbortControllerRef.current?.abort();
    };
    // List reload: tenant + query deps only. `providerContextBase` (incl. accessToken) is read via ref so token rotation
    // does not duplicate GETs; `loadList` is intentionally omitted from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, hostContext.tenant.id, pageSize, query, filterTypeId, initialSort, autoSelectFirst]);

  const applyDetailsSnapshot = useCallback((details: ProfileDetails) => {
    setSelectedDocument(details.document);
    setHeadVersion(details.version);
    setViewedVersion(details.version);
    setEditDraftValue(structuredClone(details.document));
    setEditDraftSourceText(JSON.stringify(details.document, null, 2));
    setEditDraftMode("tree");
    setEditApiIssues(null);
    setEditMode(false);
  }, []);

  const loadVersionMap = useCallback(
    async (entityId: string, head: ProfileDetails, signal: AbortSignal, reqRef: number) => {
      const map: Record<number, ProfileDetails> = { [head.version]: head };
      if (!provider.getByVersion || head.version <= 1) {
        if (detailsRequestIdRef.current === reqRef) {
          setVersionDetailsByNum(map);
        }
        return;
      }
      setVersionsLoading(true);
      try {
        const olderVersions = Array.from({ length: head.version - 1 }, (_, index) => index + 1);
        const snapshots = await Promise.all(
          olderVersions.map((version) =>
            provider.getByVersion!(entityId, version, { ...providerContextBaseRef.current, signal }),
          ),
        );
        if (detailsRequestIdRef.current !== reqRef || signal.aborted) {
          return;
        }
        snapshots.forEach((snap) => {
          map[snap.version] = snap;
        });
        setVersionDetailsByNum(map);
      } catch (error) {
        if (signal.aborted || detailsRequestIdRef.current !== reqRef) {
          return;
        }
        reportError(error, (message) => setDetailsErrorMessage(message));
      } finally {
        if (detailsRequestIdRef.current === reqRef) {
          setVersionsLoading(false);
        }
      }
    },
    [provider],
  );

  useEffect(() => {
    if (!selectedEntityId) {
      setSelectedDocument(null);
      setHeadVersion(null);
      setViewedVersion(null);
      setVersionDetailsByNum({});
      setDetailsErrorMessage(null);
      setEditMode(false);
      setVersionsLoading(false);
      return;
    }
    const requestIdRef = ++detailsRequestIdRef.current;
    detailsAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    detailsAbortControllerRef.current = abortController;
    const startedAt = performance.now();
    setDetailsLoading(true);
    setDetailsErrorMessage(null);
    setVersionDetailsByNum({});
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "profiles_list",
      event: "details_requested",
      meta: {
        operation: "get_profile",
        phase: "api",
        entity_id: selectedEntityId,
      },
    });

    void provider
      .get(selectedEntityId, { ...providerContextBaseRef.current, signal: abortController.signal })
      .then(async (snapshot) => {
        if (requestIdRef !== detailsRequestIdRef.current) {
          return;
        }
        if (abortController.signal.aborted) {
          return;
        }
        applyDetailsSnapshot(snapshot);
        await loadVersionMap(selectedEntityId, snapshot, abortController.signal, requestIdRef);
      })
      .catch((error) => {
        if (requestIdRef !== detailsRequestIdRef.current) {
          return;
        }
        if (abortController.signal.aborted) {
          return;
        }
        emitProfileWidgetTelemetry(onObservability, hostContext, {
          widget: "profiles_list",
          event: "details_failed",
          meta: {
            operation: "get_profile",
            phase: "api",
            entity_id: selectedEntityId,
            latency_ms: Math.round(performance.now() - startedAt),
            error_code: isProfilesProviderError(error) ? error.code : "unknown",
          },
        });
        reportError(error, (message) => setDetailsErrorMessage(message));
      })
      .finally(() => {
        if (requestIdRef === detailsRequestIdRef.current) {
          setDetailsLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [hostContext.tenant.id, provider, requestId, selectedEntityId, onObservability, applyDetailsSnapshot, loadVersionMap]);

  useEffect(() => {
    setProfileDocumentTab("formData");
  }, [selectedEntityId]);

  useEffect(() => {
    if (!selectedItem?.entityTypeId || !provider.getEntityTypePublishedSchema) {
      setProfilePublishedSchema({ status: "unsupported" });
      return;
    }
    const req = ++profileSchemaRequestRef.current;
    const abortController = new AbortController();
    setProfilePublishedSchema({ status: "loading" });
    void provider
      .getEntityTypePublishedSchema(selectedItem.entityTypeId, {
        ...providerContextBaseRef.current,
        signal: abortController.signal,
      })
      .then((doc) => {
        if (req !== profileSchemaRequestRef.current || abortController.signal.aborted) {
          return;
        }
        if (doc == null) {
          setProfilePublishedSchema({ status: "none" });
        } else {
          setProfilePublishedSchema({ status: "ok", data: doc });
        }
      })
      .catch((error) => {
        if (req !== profileSchemaRequestRef.current || abortController.signal.aborted) {
          return;
        }
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        const message = isProfilesProviderError(error) ? mapSecureMessage(error.code) : "Failed to load schema.";
        setProfilePublishedSchema({ status: "error", message });
      });
    return () => {
      abortController.abort();
    };
  }, [selectedEntityId, selectedItem?.entityTypeId, provider]);

  useEffect(() => {
    if (!createModalOpened) {
      setCreatePublishedSchema({ status: "unsupported" });
      return;
    }
    if (!createTypeId || !provider.getEntityTypePublishedSchema) {
      setCreatePublishedSchema({ status: "unsupported" });
      return;
    }
    const req = ++createSchemaRequestRef.current;
    const abortController = new AbortController();
    setCreatePublishedSchema({ status: "loading" });
    void provider
      .getEntityTypePublishedSchema(createTypeId, { ...providerContextBaseRef.current, signal: abortController.signal })
      .then((doc) => {
        if (req !== createSchemaRequestRef.current || abortController.signal.aborted) {
          return;
        }
        if (doc == null) {
          setCreatePublishedSchema({ status: "none" });
        } else {
          setCreatePublishedSchema({ status: "ok", data: doc });
        }
      })
      .catch((error) => {
        if (req !== createSchemaRequestRef.current || abortController.signal.aborted) {
          return;
        }
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        const message = isProfilesProviderError(error) ? mapSecureMessage(error.code) : "Failed to load schema.";
        setCreatePublishedSchema({ status: "error", message });
      });
    return () => {
      abortController.abort();
    };
  }, [createModalOpened, createTypeId, provider]);

  const handleOpenCreateModal = () => {
    setMutationErrorMessage(null);
    setCreateDocumentTab("formData");
    setCreateProfileName("New profile");
    setCreateDraftValue({});
    setCreateDraftSourceText("{}");
    setCreateDraftMode("tree");
    setCreateApiIssues(null);
    const loadTypes = async () => {
      if (!provider.listEntityTypes) {
        setCreateTypeId(null);
        setCreateModalOpened(true);
        return;
      }
      try {
        const rows = await provider.listEntityTypes({ ...providerContextBaseRef.current });
        setEntityTypeOptions(rows.map((row) => ({ value: row.id, label: row.label })));
        const preferred =
          initialCreateEntityTypeId && rows.some((row) => row.id === initialCreateEntityTypeId)
            ? initialCreateEntityTypeId
            : rows[0]?.id ?? null;
        setCreateTypeId(preferred);
      } catch (error) {
        reportError(error, (message) => setMutationErrorMessage(message));
        setCreateTypeId(null);
      }
      setCreateModalOpened(true);
    };
    void loadTypes();
  };

  const handleCreate = async () => {
    setMutationErrorMessage(null);
    let parsed: Record<string, unknown>;
    if (createDraftMode === "source") {
      const sourceParsed = parseEntityTypeDraftSchemaText(createDraftSourceText);
      if (!sourceParsed.ok) {
        setMutationErrorMessage(sourceParsed.message);
        emitProfileWidgetTelemetry(onObservability, hostContext, {
          widget: "profiles_list",
          event: "save_failed",
          meta: { operation: "create_entity_profile", phase: "validation" },
        });
        return;
      }
      parsed = sourceParsed.value;
      setCreateDraftValue(sourceParsed.value);
    } else {
      parsed = createDraftValue;
    }
    const trimmedName = createProfileName.trim();
    if (!createTypeId || !trimmedName) {
      setMutationErrorMessage("Choose entity type and profile name.");
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_failed",
        meta: { operation: "create_entity_profile", phase: "validation" },
      });
      return;
    }

    const merged: Record<string, unknown> = { ...parsed, name: trimmedName };
    if (isDuplicateProfileName(trimmedName, items, null)) {
      setMutationErrorMessage("Profile name must be unique within the loaded list.");
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_failed",
        meta: { operation: "create_entity_profile", phase: "validation" },
      });
      return;
    }

    setBusyEntityId("create");
    setCreateApiIssues(null);
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "profiles_list",
      event: "save_submitted",
      meta: { operation: "create_entity_profile" },
    });

    try {
      const created = await provider.create({ entityTypeId: createTypeId, document: merged }, { ...providerContextBaseRef.current });
      const createdItem: ProfilesListItem = {
        entityId: created.entityId,
        entityTypeId: created.entityTypeId,
        version: created.version,
        updatedAt: created.updatedAt,
        preview: JSON.stringify(created.document),
      };
      onAction?.({ type: "created", item: createdItem });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_succeeded",
        meta: { operation: "create_entity_profile", entity_id: created.entityId },
      });
      preferredSelectionRef.current = created.entityId;
      setCreateModalOpened(false);
      await loadList({ append: false });
    } catch (error) {
      if (isProfilesProviderError(error) && error.schemaIssues?.length) {
        setCreateApiIssues(error.schemaIssues);
      } else {
        setCreateApiIssues(null);
      }
      reportError(error, (message) => setMutationErrorMessage(message));
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_failed",
        meta: { operation: "create_entity_profile", phase: "api" },
      });
    } finally {
      setBusyEntityId(null);
    }
  };

  const handleUpdate = async () => {
    if (!selectedEntityId || historicalView) {
      return;
    }
    setMutationErrorMessage(null);
    let parsed: Record<string, unknown>;
    if (editDraftMode === "source") {
      const sourceParsed = parseEntityTypeDraftSchemaText(editDraftSourceText);
      if (!sourceParsed.ok) {
        setMutationErrorMessage(sourceParsed.message);
        emitProfileWidgetTelemetry(onObservability, hostContext, {
          widget: "profiles_list",
          event: "save_failed",
          meta: { operation: "update_entity_profile", phase: "validation" },
        });
        return;
      }
      parsed = sourceParsed.value;
      setEditDraftValue(sourceParsed.value);
    } else {
      parsed = editDraftValue;
    }

    const nameFromDoc = extractProfileNameFromDocument(parsed);
    if (nameFromDoc && isDuplicateProfileName(nameFromDoc, items, selectedEntityId)) {
      setMutationErrorMessage("Profile name must be unique within the loaded list.");
      return;
    }

    setBusyEntityId(selectedEntityId);
    setEditApiIssues(null);
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "profiles_list",
      event: "save_submitted",
      meta: { operation: "update_entity_profile", entity_id: selectedEntityId },
    });

    try {
      const updated = await provider.update(
        selectedEntityId,
        { document: parsed, expectedVersion: viewedVersion ?? undefined },
        { ...providerContextBaseRef.current },
      );
      const updatedItem: ProfilesListItem = {
        entityId: updated.entityId,
        entityTypeId: updated.entityTypeId,
        version: updated.version,
        updatedAt: updated.updatedAt,
        preview: JSON.stringify(updated.document),
      };
      setItems((prev) => prev.map((item) => (item.entityId === selectedEntityId ? updatedItem : item)));
      applyDetailsSnapshot(updated);
      setVersionDetailsByNum({});
      onAction?.({ type: "updated", item: updatedItem });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_succeeded",
        meta: { operation: "update_entity_profile", entity_id: updatedItem.entityId, version: updatedItem.version },
      });
      await loadVersionMap(selectedEntityId, updated, new AbortController().signal, detailsRequestIdRef.current);
    } catch (error) {
      if (isProfilesProviderError(error) && error.schemaIssues?.length) {
        setEditApiIssues(error.schemaIssues);
      } else {
        setEditApiIssues(null);
      }
      reportError(error, (message) => setMutationErrorMessage(message));
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_failed",
        meta: { operation: "update_entity_profile", phase: "api", entity_id: selectedEntityId },
      });
    } finally {
      setBusyEntityId(null);
    }
  };

  const handleSaveHistoricalAsNew = async () => {
    if (!selectedEntityId || !historicalView || !selectedDocument) {
      return;
    }
    setMutationErrorMessage(null);
    setBusyEntityId(selectedEntityId);
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "profiles_list",
      event: "save_submitted",
      meta: { operation: "update_entity_profile_from_history", entity_id: selectedEntityId, from_version: viewedVersion },
    });
    try {
      const updated = await provider.update(selectedEntityId, { document: selectedDocument }, { ...providerContextBaseRef.current });
      const updatedItem: ProfilesListItem = {
        entityId: updated.entityId,
        entityTypeId: updated.entityTypeId,
        version: updated.version,
        updatedAt: updated.updatedAt,
        preview: JSON.stringify(updated.document),
      };
      setItems((prev) => prev.map((item) => (item.entityId === selectedEntityId ? updatedItem : item)));
      applyDetailsSnapshot(updated);
      setVersionDetailsByNum({});
      onAction?.({ type: "updated", item: updatedItem });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_succeeded",
        meta: {
          operation: "update_entity_profile_from_history",
          entity_id: updated.entityId,
          version: updated.version,
        },
      });
      await loadVersionMap(selectedEntityId, updated, new AbortController().signal, detailsRequestIdRef.current);
    } catch (error) {
      reportError(error, (message) => setMutationErrorMessage(message));
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_failed",
        meta: { operation: "update_entity_profile_from_history", phase: "api", entity_id: selectedEntityId },
      });
    } finally {
      setBusyEntityId(null);
    }
  };

  const handleDelete = async (entityId: string) => {
    setMutationErrorMessage(null);
    setBusyEntityId(entityId);
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "profiles_list",
      event: "save_submitted",
      meta: { operation: "delete_entity_profile", entity_id: entityId },
    });

    try {
      await provider.remove(entityId, { ...providerContextBaseRef.current });
      onAction?.({ type: "deleted", entityId });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_succeeded",
        meta: { operation: "delete_entity_profile", entity_id: entityId },
      });
      preferredSelectionRef.current = null;
      await loadList({ append: false });
    } catch (error) {
      reportError(error, (message) => setMutationErrorMessage(message));
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_failed",
        meta: { operation: "delete_entity_profile", phase: "api", entity_id: entityId },
      });
    } finally {
      setBusyEntityId(null);
    }
  };

  const onSelectVersion = (value: string | null) => {
    if (!value) {
      return;
    }
    const version = Number(value);
    if (Number.isNaN(version)) {
      return;
    }
    setViewedVersion(version);
    const detail = versionDetailsByNum[version];
    if (detail) {
      setSelectedDocument(detail.document);
      setEditDraftValue(structuredClone(detail.document));
      setEditDraftSourceText(JSON.stringify(detail.document, null, 2));
      setEditDraftMode("tree");
      setEditApiIssues(null);
      setEditMode(false);
    }
  };

  const versionSelectData = useMemo(() => {
    const nums = Object.keys(versionDetailsByNum)
      .map(Number)
      .sort((a, b) => b - a);
    return nums.map((v) => ({
      value: String(v),
      label: v === headVersion ? `v${v} (current)` : `v${v}`,
    }));
  }, [versionDetailsByNum, headVersion]);

  const displayNameForCard =
    selectedItem === null
      ? ""
      : extractProfileNameFromDocument(selectedDocument ?? undefined) ?? listPrimaryLabel(selectedItem);

  const listItems = items.map((item) => ({
    id: item.entityId,
    title: listPrimaryLabel(item),
    description: listSecondaryLabel(item),
    searchText: `${item.entityId} ${item.preview} ${item.entityTypeId} ${listPrimaryLabel(item)}`,
  }));

  const renderPublishedSchemaPanel = (state: PublishedSchemaPanelState) => {
    if (state.status === "unsupported") {
      return (
        <Text size="sm" c="dimmed" p="sm">
          Published schema is not available from this data provider.
        </Text>
      );
    }
    if (state.status === "loading") {
      return (
        <Box p="md" style={{ display: "flex", justifyContent: "center" }}>
          <Loader size="sm" />
        </Box>
      );
    }
    if (state.status === "error") {
      return (
        <Alert color="red" title="Schema">
          {state.message}
        </Alert>
      );
    }
    if (state.status === "none") {
      return (
        <Text size="sm" c="dimmed" p="sm">
          This entity type has no published schema yet.
        </Text>
      );
    }
    return (
      <Box style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <AprilJsonTreeEditor
          data={state.data}
          readOnly
          rootName="published_schema"
          validationSchema={ENTITY_TYPE_DRAFT_ROOT_JSON_SCHEMA}
          resolveValidationSchemaRefs={false}
          showSearch
        />
      </Box>
    );
  };

  if (listLoading) {
    return (
      <Box aria-label="profiles-list-loading" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Loader size="sm" />
        <Text size="sm">Loading profiles...</Text>
      </Box>
    );
  }

  return (
    <DensityProvider>
      <Stack gap="md" style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {listErrorMessage ? <Alert color="red">{listErrorMessage}</Alert> : null}
      {mutationErrorMessage ? <Alert color="red">{mutationErrorMessage}</Alert> : null}

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
        <Stack
          gap="xs"
          onClickCapture={(event) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest('button[aria-label="Collapse list"]')) {
              setListCollapsed(true);
              return;
            }
            if (target?.closest('button[aria-label="Expand list"]')) {
              setListCollapsed(false);
            }
          }}
          style={{
            flex: "0 0 auto",
            width: listCollapsed ? 72 : "clamp(280px, 30vw, 420px)",
            minWidth: listCollapsed ? 72 : 280,
            maxWidth: listCollapsed ? 72 : "44%",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <CardListColumn
              title="Profiles"
              items={listItems}
              mode="inline"
              heightMode="fill"
              withSort={false}
              withFilter
              withAdd
              searchValue={query}
              onSearchChange={setQuery}
              filterValue={{ type: filterTypeId === "all" ? undefined : filterTypeId }}
              filterField="type"
              filterLabel="Type"
              filterOptions={[{ value: "all", label: "All types" }, ...typeOptions.filter((option) => option.value !== "all")]}
              onFilterChange={(value) => setFilterTypeId(value.type ?? "all")}
              onAddItem={handleOpenCreateModal}
              totalItems={totalCount}
              loadedItemsCount={items.length}
              onReachListEnd={() => {
                if (!nextCursor || listLoadingMore) {
                  return;
                }
                void loadList({ append: true, cursor: nextCursor });
              }}
              defaultWidthPercent={listCollapsed ? 100 : 96}
              minWidthPercent={listCollapsed ? 100 : 90}
              maxWidthPercent={100}
              renderCard={(item) => {
                const source = items.find((current) => current.entityId === item.id);
                const selected = selectedEntityId === item.id;
                return (
                  <Card
                    withBorder
                    shadow={selected ? "sm" : undefined}
                    radius="md"
                    p="sm"
                    aria-label={`Profile row ${source?.entityId ?? item.id}`}
                    style={{ borderColor: selected ? "var(--mantine-color-blue-6)" : undefined, cursor: "pointer" }}
                    onClick={() => {
                      setSelectedEntityId(item.id);
                      setEditMode(false);
                      onOpenEntity?.(item.id);
                    }}
                  >
                    <Text fw={600} lineClamp={1}>
                      {item.title}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {item.description}
                    </Text>
                    {source ? (
                      <Text size="xs" mt="xs" lineClamp={1} c="dimmed" title={source.entityId}>
                        {source.entityId}
                      </Text>
                    ) : null}
                  </Card>
                );
              }}
            />
          </Box>
          {listLoadingMore ? (
            <Box style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Loader size="xs" />
              <Text size="xs" c="dimmed">
                Loading more profiles...
              </Text>
            </Box>
          ) : null}
        </Stack>

        <Stack gap="sm" style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {items.length === 0 ? <Alert color="gray">No profiles found for current query.</Alert> : null}
          {selectedItem ? (
            <>
              <Box style={{ flexShrink: 0 }}>
                <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
                  <Stack gap={4} style={{ flex: "1 1 200px", minWidth: 0 }}>
                    <Title order={5}>Profile</Title>
                    <Text size="sm" fw={600} lineClamp={1}>
                      {displayNameForCard}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {selectedItem.entityTypeId} · id {selectedItem.entityId}
                    </Text>
                    <Group gap="xs" wrap="wrap" align="center">
                      <Select
                        label="Version"
                        size="xs"
                        w={200}
                        disabled={detailsLoading || Object.keys(versionDetailsByNum).length === 0}
                        data={versionSelectData}
                        value={viewedVersion !== null ? String(viewedVersion) : null}
                        onChange={onSelectVersion}
                        rightSection={versionsLoading ? <Loader size="xs" /> : undefined}
                      />
                    </Group>
                  </Stack>
                  <Group gap={4} justify="flex-end" wrap="wrap">
                    {historicalView ? (
                      <Tooltip label="Save snapshot as new version (+1)">
                        <ActionIcon
                          color="teal"
                          variant="filled"
                          aria-label="Save snapshot as new version (+1)"
                          onClick={() => {
                            void handleSaveHistoricalAsNew();
                          }}
                          loading={busyEntityId === selectedEntityId}
                        >
                          <IconSparkles size={18} />
                        </ActionIcon>
                      </Tooltip>
                    ) : null}
                    {!historicalView && (
                      <>
                        {editMode ? (
                          <>
                            <Tooltip label="Save changes">
                              <ActionIcon
                                variant="filled"
                                aria-label="Save changes"
                                disabled={!editDraftSaveOk}
                                onClick={() => {
                                  void handleUpdate();
                                }}
                                loading={busyEntityId === selectedEntityId}
                              >
                                <IconDeviceFloppy size={18} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Cancel editing">
                              <ActionIcon
                                variant="default"
                                aria-label="Cancel editing"
                                onClick={() => {
                                  setEditMode(false);
                                  if (selectedDocument) {
                                    setEditDraftValue(structuredClone(selectedDocument));
                                    setEditDraftSourceText(JSON.stringify(selectedDocument, null, 2));
                                    setEditDraftMode("tree");
                                  }
                                  setEditApiIssues(null);
                                }}
                              >
                                <IconX size={18} />
                              </ActionIcon>
                            </Tooltip>
                          </>
                        ) : (
                          <Tooltip label="Edit profile">
                            <ActionIcon
                              variant="light"
                              aria-label="Edit profile"
                              onClick={() => {
                                setEditMode(true);
                                if (selectedDocument) {
                                  setEditDraftValue(structuredClone(selectedDocument));
                                  setEditDraftSourceText(JSON.stringify(selectedDocument, null, 2));
                                  setEditDraftMode("tree");
                                }
                                setEditApiIssues(null);
                              }}
                            >
                              <IconEdit size={18} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </>
                    )}
                    <Tooltip label="Delete profile">
                      <ActionIcon
                        color="red"
                        variant="light"
                        aria-label="Delete profile"
                        loading={busyEntityId === selectedEntityId}
                        onClick={() => {
                          if (selectedEntityId) {
                            void handleDelete(selectedEntityId);
                          }
                        }}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
              </Box>
              {historicalView ? (
                <Alert color="gray" title="Historical version">
                  You are viewing an older version (read-only JSON). Use “Save snapshot as new version (+1)” to append a new
                  head from this document.
                </Alert>
              ) : null}
              {detailsErrorMessage ? <Alert color="red">{detailsErrorMessage}</Alert> : null}
              {detailsLoading ? (
                <Box style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Loader size="sm" />
                  <Text size="sm">Loading selected profile...</Text>
                </Box>
              ) : (
                <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", minWidth: 0 }}>
                  {editMode && !historicalView ? (
                    <Stack gap="xs" style={{ flex: 1, minHeight: 0 }}>
                      <Text size="sm" fw={500}>
                        Updated document (JSON object)
                      </Text>
                      <Tabs
                        value={profileDocumentTab}
                        onChange={(v) => setProfileDocumentTab(v === "schema" ? "schema" : "formData")}
                        style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
                      >
                        <Tabs.List>
                          <Tabs.Tab value="formData">formData</Tabs.Tab>
                          <Tabs.Tab value="schema">schema</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panel
                          value="formData"
                          pt="xs"
                          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
                          data-testid="profiles-widget-edit-document"
                        >
                          <EntityTypesDraftJsonEditor
                            mode={editDraftMode}
                            onModeChange={setEditDraftMode}
                            value={editDraftValue}
                            onChange={setEditDraftValue}
                            sourceText={editDraftSourceText}
                            onSourceTextChange={setEditDraftSourceText}
                            rootName="profile_document"
                            serverValidationItems={editApiIssues ?? undefined}
                          />
                        </Tabs.Panel>
                        <Tabs.Panel value="schema" pt="xs" style={{ flex: 1, minHeight: 0, minWidth: 0, overflow: "hidden" }}>
                          {renderPublishedSchemaPanel(profilePublishedSchema)}
                        </Tabs.Panel>
                      </Tabs>
                    </Stack>
                  ) : (
                    <Stack gap="xs" style={{ flex: 1, minHeight: 0 }}>
                      <Text size="sm" fw={500}>
                        Profile document
                      </Text>
                      <Tabs
                        value={profileDocumentTab}
                        onChange={(v) => setProfileDocumentTab(v === "schema" ? "schema" : "formData")}
                        style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
                      >
                        <Tabs.List>
                          <Tabs.Tab value="formData">formData</Tabs.Tab>
                          <Tabs.Tab value="schema">schema</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panel value="formData" pt="xs" style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                          <AprilJsonTreeEditor
                            data={selectedDocument ?? {}}
                            readOnly
                            rootName="profile_document"
                            validationSchema={ENTITY_TYPE_DRAFT_ROOT_JSON_SCHEMA}
                            resolveValidationSchemaRefs={false}
                            showSearch
                          />
                        </Tabs.Panel>
                        <Tabs.Panel value="schema" pt="xs" style={{ flex: 1, minHeight: 0, minWidth: 0, overflow: "hidden" }}>
                          {renderPublishedSchemaPanel(profilePublishedSchema)}
                        </Tabs.Panel>
                      </Tabs>
                    </Stack>
                  )}
                </Box>
              )}
            </>
          ) : (
            <Alert color="gray">Select a profile from the left column.</Alert>
          )}
        </Stack>
      </Box>
      <Modal opened={createModalOpened} onClose={() => setCreateModalOpened(false)} title="Create profile">
        <Stack gap="xs">
          {provider.listEntityTypes ? (
            <Select
              label="Entity type"
              placeholder="Select type"
              data={entityTypeOptions}
              value={createTypeId}
              onChange={setCreateTypeId}
              searchable
              nothingFoundMessage="No types"
              comboboxProps={{ withinPortal: false }}
            />
          ) : (
            <TextInput
              label="Entity type ID"
              placeholder="Published entity type UUID"
              value={createTypeId ?? ""}
              onChange={(e) => setCreateTypeId(e.currentTarget.value || null)}
            />
          )}
          <TextInput label="Profile name" value={createProfileName} onChange={(e) => setCreateProfileName(e.currentTarget.value)} />
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Document (JSON object)
            </Text>
            <Tabs
              value={createDocumentTab}
              onChange={(v) => setCreateDocumentTab(v === "schema" ? "schema" : "formData")}
              style={{ minHeight: 220, display: "flex", flexDirection: "column" }}
            >
              <Tabs.List>
                <Tabs.Tab value="formData">formData</Tabs.Tab>
                <Tabs.Tab value="schema">schema</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="formData" pt="xs" style={{ flex: 1, minHeight: 0 }} data-testid="profiles-widget-create-document">
                <EntityTypesDraftJsonEditor
                  mode={createDraftMode}
                  onModeChange={setCreateDraftMode}
                  value={createDraftValue}
                  onChange={setCreateDraftValue}
                  sourceText={createDraftSourceText}
                  onSourceTextChange={setCreateDraftSourceText}
                  compact
                  showSearch={false}
                  rootName="profile_document"
                  serverValidationItems={createApiIssues ?? undefined}
                />
              </Tabs.Panel>
              <Tabs.Panel value="schema" pt="xs" style={{ flex: 1, minHeight: 160, overflow: "auto" }}>
                {renderPublishedSchemaPanel(createPublishedSchema)}
              </Tabs.Panel>
            </Tabs>
          </Stack>
          <Button
            onClick={() => void handleCreate()}
            loading={busyEntityId === "create"}
            disabled={!createDraftSaveOk}
          >
            Create profile
          </Button>
        </Stack>
      </Modal>
      </Stack>
    </DensityProvider>
  );
}
