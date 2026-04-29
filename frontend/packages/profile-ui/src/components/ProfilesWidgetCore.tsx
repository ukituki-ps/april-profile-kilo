import { CardListColumn } from "@april/ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Card, Loader, Modal, Stack, Text, TextInput, Textarea, Title } from "@mantine/core";
import { emitProfileWidgetTelemetry } from "../observability";
import type { ProfileWidgetObservabilityHandler } from "../observability";
import type { ProfileWidgetHostContext, ProfilesListAction, ProfilesListItem } from "../types";
import type {
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

const DEFAULT_PAGE_SIZE = 5;

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

export function ProfilesWidgetCore({
  hostContext,
  provider,
  providerContext,
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
  const [detailsErrorMessage, setDetailsErrorMessage] = useState<string | null>(null);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);
  const [items, setItems] = useState<ProfilesListItem[]>([]);
  const [query, setQuery] = useState(initialSearch);
  const [filterTypeId, setFilterTypeId] = useState(initialTypeId);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Record<string, unknown> | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editDocument, setEditDocument] = useState("{}");
  const [createTypeId, setCreateTypeId] = useState("");
  const [createDocument, setCreateDocument] = useState('{"name":"New profile"}');
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [busyEntityId, setBusyEntityId] = useState<string | null>(null);

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
    [hostContext, providerContext],
  );

  const typeOptions = useMemo(() => {
    const unique = [...new Set(items.map((item) => item.entityTypeId))];
    return [{ value: "all", label: "All types" }, ...unique.map((value) => ({ value, label: value }))];
  }, [items]);

  const selectedItem = selectedEntityId ? items.find((item) => item.entityId === selectedEntityId) ?? null : null;

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
      setListLoading(true);
      setListErrorMessage(null);
      setMutationErrorMessage(null);
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
        { ...providerContextBase, signal: abortController.signal },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      listAbortControllerRef.current?.abort();
    };
  }, [provider, hostContext, pageSize, query, filterTypeId, initialSort, autoSelectFirst, providerContextBase]);

  useEffect(() => {
    if (!selectedEntityId) {
      setSelectedDocument(null);
      setSelectedVersion(null);
      setDetailsErrorMessage(null);
      setEditMode(false);
      return;
    }
    const requestIdRef = ++detailsRequestIdRef.current;
    detailsAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    detailsAbortControllerRef.current = abortController;
    const startedAt = performance.now();
    setDetailsLoading(true);
    setDetailsErrorMessage(null);
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
      .get(selectedEntityId, { ...providerContextBase, signal: abortController.signal })
      .then((snapshot) => {
        if (requestIdRef !== detailsRequestIdRef.current) {
          return;
        }
        setSelectedDocument(snapshot.document);
        setSelectedVersion(snapshot.version);
        setEditDocument(JSON.stringify(snapshot.document, null, 2));
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
  }, [hostContext, provider, requestId, selectedEntityId, onObservability, providerContextBase]);

  const handleCreate = async () => {
    setMutationErrorMessage(null);
    const parsed = parseJsonObject(createDocument);
    if (!createTypeId.trim() || !parsed) {
      setMutationErrorMessage("Create form expects entity type ID and JSON object document.");
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
      const created = await provider.create(
        { entityTypeId: createTypeId.trim(), document: parsed },
        { ...providerContextBase },
      );
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
    if (!selectedEntityId) {
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

    setBusyEntityId(selectedEntityId);
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "profiles_list",
      event: "save_submitted",
      meta: { operation: "update_entity_profile", entity_id: selectedEntityId },
    });

    try {
      const updated = await provider.update(
        selectedEntityId,
        { document: parsed, expectedVersion: selectedVersion ?? undefined },
        { ...providerContextBase },
      );
      const updatedItem: ProfilesListItem = {
        entityId: updated.entityId,
        entityTypeId: updated.entityTypeId,
        version: updated.version,
        updatedAt: updated.updatedAt,
        preview: JSON.stringify(updated.document),
      };
      setItems((prev) => prev.map((item) => (item.entityId === selectedEntityId ? updatedItem : item)));
      setSelectedDocument(updated.document);
      setSelectedVersion(updated.version);
      setEditMode(false);
      onAction?.({ type: "updated", item: updatedItem });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_succeeded",
        meta: { operation: "update_entity_profile", entity_id: updatedItem.entityId, version: updatedItem.version },
      });
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

  const handleDelete = async (entityId: string) => {
    setMutationErrorMessage(null);
    setBusyEntityId(entityId);
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "profiles_list",
      event: "save_submitted",
      meta: { operation: "delete_entity_profile", entity_id: entityId },
    });

    try {
      await provider.remove(entityId, { ...providerContextBase });
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

  const listItems = items.map((item) => ({
    id: item.entityId,
    title: item.entityId,
    description: `${item.entityTypeId} · v${item.version}`,
    searchText: `${item.entityId} ${item.preview} ${item.entityTypeId}`,
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
    <Stack gap="md">
      <Title order={4}>Profiles list widget</Title>
      <Text size="sm" c="dimmed">
        Tenant: {hostContext.tenant.id}
      </Text>
      {listErrorMessage ? <Alert color="red">{listErrorMessage}</Alert> : null}
      {mutationErrorMessage ? <Alert color="red">{mutationErrorMessage}</Alert> : null}

      <Box style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        <Stack gap="xs" style={{ width: "25%", minWidth: 280 }}>
          <CardListColumn
            title="Profiles"
            items={listItems}
            mode="inline"
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
            onAddItem={() => setCreateModalOpened(true)}
            totalItems={totalCount}
            loadedItemsCount={items.length}
            onReachListEnd={() => {
              if (!nextCursor || listLoadingMore) {
                return;
              }
              void loadList({ append: true, cursor: nextCursor });
            }}
            defaultWidthPercent={100}
            minWidthPercent={100}
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
                    <Text size="xs" mt="xs" lineClamp={2}>
                      {source.preview}
                    </Text>
                  ) : null}
                </Card>
              );
            }}
          />
          {listLoadingMore ? (
            <Box style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Loader size="xs" />
              <Text size="xs" c="dimmed">
                Loading more profiles...
              </Text>
            </Box>
          ) : null}
        </Stack>

        <Stack gap="sm" style={{ width: "75%" }}>
          {items.length === 0 ? <Alert color="gray">No profiles found for current query.</Alert> : null}
          {selectedItem ? (
            <>
              <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                <Stack gap={2}>
                  <Title order={5}>Profile card</Title>
                  <Text size="sm" c="dimmed">
                    {selectedItem.entityId} · {selectedItem.entityTypeId} · v{selectedVersion ?? selectedItem.version}
                  </Text>
                </Stack>
                <Box style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {editMode ? (
                    <>
                      <Button onClick={handleUpdate} loading={busyEntityId === selectedEntityId}>
                        Save changes
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => {
                          setEditMode(false);
                          if (selectedDocument) {
                            setEditDocument(JSON.stringify(selectedDocument, null, 2));
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="light"
                      onClick={() => {
                        setEditMode(true);
                        if (selectedDocument) {
                          setEditDocument(JSON.stringify(selectedDocument, null, 2));
                        }
                      }}
                    >
                      Edit profile
                    </Button>
                  )}
                  <Button
                    color="red"
                    variant="light"
                    loading={busyEntityId === selectedEntityId}
                    onClick={() => {
                      if (selectedEntityId) {
                        void handleDelete(selectedEntityId);
                      }
                    }}
                  >
                    Delete profile
                  </Button>
                </Box>
              </Box>
              {detailsErrorMessage ? <Alert color="red">{detailsErrorMessage}</Alert> : null}
              {detailsLoading ? (
                <Box style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Loader size="sm" />
                  <Text size="sm">Loading selected profile...</Text>
                </Box>
              ) : editMode ? (
                <Textarea
                  label="Updated document (JSON object)"
                  autosize
                  minRows={10}
                  value={editDocument}
                  onChange={(event) => setEditDocument(event.currentTarget.value)}
                />
              ) : (
                <Textarea label="Profile document" value={JSON.stringify(selectedDocument ?? {}, null, 2)} minRows={10} readOnly />
              )}
            </>
          ) : (
            <Alert color="gray">Select a profile from the left column.</Alert>
          )}
        </Stack>
      </Box>
      <Modal opened={createModalOpened} onClose={() => setCreateModalOpened(false)} title="Create profile">
        <Stack gap="xs">
          <TextInput
            label="Entity type ID"
            placeholder="entity_type_id"
            value={createTypeId}
            onChange={(event) => setCreateTypeId(event.currentTarget.value)}
          />
          <Textarea
            label="Document (JSON object)"
            autosize
            minRows={6}
            value={createDocument}
            onChange={(event) => setCreateDocument(event.currentTarget.value)}
          />
          <Button onClick={handleCreate} loading={busyEntityId === "create"}>
            Create profile
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
