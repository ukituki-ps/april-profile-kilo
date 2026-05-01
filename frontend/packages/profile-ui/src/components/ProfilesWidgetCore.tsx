import { CardListColumn } from "@april/ui";
import {
  IconDeviceFloppy,
  IconEdit,
  IconRotateClockwise,
  IconSparkles,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from "@mantine/core";
import type { TextareaProps } from "@mantine/core";
import { emitProfileWidgetTelemetry } from "../observability";
import type { ProfileWidgetObservabilityHandler } from "../observability";
import {
  extractProfileNameFromDocument,
  isDuplicateProfileName,
  listPrimaryLabel,
  listSecondaryLabel,
  tryParsePreviewDocument,
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

const parseJsonObject = (value: string): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
};

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

/** Правая панель: `root` = внешний Input.Wrapper, `wrapper` = оболочка поля ввода (`Input`); оба с `height: 100%`. */
const profileDetailsDocumentTextareaStyles = {
  root: { flex: 1, display: "flex", flexDirection: "column" as const, minHeight: 0, height: "100%" },
  wrapper: { flex: 1, minHeight: 0, height: "100%" },
  input: { flex: 1, minHeight: 0, height: "100%", resize: "none" as const },
} satisfies TextareaProps["styles"];

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
  const [editDocument, setEditDocument] = useState("{}");
  const [createTypeId, setCreateTypeId] = useState<string | null>(null);
  const [createProfileName, setCreateProfileName] = useState("New profile");
  const [createDocument, setCreateDocument] = useState("{}");
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [busyEntityId, setBusyEntityId] = useState<string | null>(null);
  const [entityTypeOptions, setEntityTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [listCollapsed, setListCollapsed] = useState(false);

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
    setEditDocument(JSON.stringify(details.document, null, 2));
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

  const handleOpenCreateModal = () => {
    setMutationErrorMessage(null);
    setCreateProfileName("New profile");
    setCreateDocument("{}");
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
    const parsed = parseJsonObject(createDocument);
    const trimmedName = createProfileName.trim();
    if (!createTypeId || !parsed || !trimmedName) {
      setMutationErrorMessage("Choose entity type, profile name, and valid JSON document.");
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
    const parsed = parseJsonObject(editDocument);
    if (!parsed) {
      setMutationErrorMessage("Edit form expects JSON object document.");
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_failed",
        meta: { operation: "update_entity_profile", phase: "validation" },
      });
      return;
    }

    const nameFromDoc = extractProfileNameFromDocument(parsed);
    if (nameFromDoc && isDuplicateProfileName(nameFromDoc, items, selectedEntityId)) {
      setMutationErrorMessage("Profile name must be unique within the loaded list.");
      return;
    }

    setBusyEntityId(selectedEntityId);
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
      setEditDocument(JSON.stringify(detail.document, null, 2));
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

  if (listLoading) {
    return (
      <Box aria-label="profiles-list-loading" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Loader size="sm" />
        <Text size="sm">Loading profiles...</Text>
      </Box>
    );
  }

  return (
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
                                    setEditDocument(JSON.stringify(selectedDocument, null, 2));
                                  }
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
                                  setEditDocument(JSON.stringify(selectedDocument, null, 2));
                                }
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
                <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                  {editMode && !historicalView ? (
                    <Textarea
                      label="Updated document (JSON object)"
                      autosize={false}
                      styles={profileDetailsDocumentTextareaStyles}
                      value={editDocument}
                      onChange={(event) => setEditDocument(event.currentTarget.value)}
                    />
                  ) : (
                    <Textarea
                      label="Profile document"
                      value={JSON.stringify(selectedDocument ?? {}, null, 2)}
                      readOnly
                      autosize={false}
                      styles={profileDetailsDocumentTextareaStyles}
                    />
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
          <Textarea
            label="Document (JSON object)"
            autosize
            minRows={6}
            value={createDocument}
            onChange={(event) => setCreateDocument(event.currentTarget.value)}
          />
          <Button onClick={() => void handleCreate()} loading={busyEntityId === "create"}>
            Create profile
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
