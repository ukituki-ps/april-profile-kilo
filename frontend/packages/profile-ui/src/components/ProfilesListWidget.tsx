import { CardListColumn } from "@april/ui";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Box,
  Card,
  Modal,
  Loader,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { ApiError, OpenAPI, ProfilesService } from "../generated";
import { emitProfileWidgetTelemetry } from "../observability";
import type { ProfileWidgetObservabilityHandler } from "../observability";
import type {
  ProfileWidgetHostContext,
  ProfilesListAction,
  ProfilesListItem,
} from "../types";

export type ProfilesListWidgetProps = {
  hostContext: ProfileWidgetHostContext;
  apiBaseUrl: string;
  accessToken?: string;
  entityIds: string[];
  pageSize?: number;
  onAction?: (action: ProfilesListAction) => void;
  onError?: (payload: { message: string; requestId?: string }) => void;
  onObservability?: ProfileWidgetObservabilityHandler;
};

const DEFAULT_PAGE_SIZE = 5;

const secureErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Authentication required. Please sign in again.";
    }
    if (error.status === 403) {
      return "Access denied for this operation.";
    }
    if (error.status === 409) {
      return "The request conflicts with current profile state.";
    }
  }
  return "Profile operation failed. Please try again.";
};

const previewFromDocument = (document: Record<string, unknown>): string => {
  const firstText = Object.values(document).find((value) => typeof value === "string");
  if (typeof firstText === "string" && firstText.trim() !== "") {
    return firstText;
  }
  return JSON.stringify(document);
};

const toListItem = (snapshot: Awaited<ReturnType<typeof ProfilesService.getEntityCurrentProfile>>): ProfilesListItem => ({
  entityId: snapshot.entity_id,
  entityTypeId: snapshot.entity_type_id,
  version: snapshot.version,
  updatedAt: snapshot.created_at,
  preview: previewFromDocument(snapshot.document),
});

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

export function ProfilesListWidget({
  hostContext,
  apiBaseUrl,
  accessToken,
  entityIds,
  pageSize = DEFAULT_PAGE_SIZE,
  onAction,
  onError,
  onObservability,
}: ProfilesListWidgetProps) {
  const [listLoading, setListLoading] = useState(true);
  const [listErrorMessage, setListErrorMessage] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsErrorMessage, setDetailsErrorMessage] = useState<string | null>(null);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);
  const [items, setItems] = useState<ProfilesListItem[]>([]);
  const [query, setQuery] = useState("");
  const [filterTypeId, setFilterTypeId] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(pageSize);
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

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setListLoading(true);
      setListErrorMessage(null);
      OpenAPI.BASE = apiBaseUrl;
      OpenAPI.TOKEN = accessToken;

      try {
        const snapshots = await Promise.all(
          entityIds.map((entityId) => ProfilesService.getEntityCurrentProfile(entityId)),
        );
        if (cancelled) {
          return;
        }
        const nextItems = snapshots.map(toListItem);
        setItems(nextItems);
        setSelectedEntityId((prev) => {
          if (prev && nextItems.some((item) => item.entityId === prev)) {
            return prev;
          }
          return nextItems[0]?.entityId ?? null;
        });
        emitProfileWidgetTelemetry(onObservability, hostContext, {
          widget: "profiles_list",
          event: "view_loaded",
          meta: { row_count: nextItems.length },
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = secureErrorMessage(error);
        setListErrorMessage(message);
        onError?.({ message, requestId });
      } finally {
        if (!cancelled) {
          setListLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, apiBaseUrl, entityIds, hostContext, onError, onObservability, requestId]);

  const typeOptions = useMemo(() => {
    const unique = [...new Set(items.map((item) => item.entityTypeId))];
    return [{ value: "all", label: "All types" }, ...unique.map((value) => ({ value, label: value }))];
  }, [items]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const searchHit =
        normalized === "" ||
        item.entityId.toLowerCase().includes(normalized) ||
        item.preview.toLowerCase().includes(normalized);
      const typeHit = filterTypeId === "all" || item.entityTypeId === filterTypeId;
      return searchHit && typeHit;
    });
  }, [filterTypeId, items, query]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [filterTypeId, pageSize, query]);

  const visibleItems = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  useEffect(() => {
    if (!selectedEntityId) {
      setSelectedDocument(null);
      setSelectedVersion(null);
      setDetailsErrorMessage(null);
      setEditMode(false);
      return;
    }
    let cancelled = false;
    const loadSelected = async () => {
      setDetailsLoading(true);
      setDetailsErrorMessage(null);
      OpenAPI.BASE = apiBaseUrl;
      OpenAPI.TOKEN = accessToken;
      try {
        const snapshot = await ProfilesService.getEntityCurrentProfile(selectedEntityId);
        if (cancelled) {
          return;
        }
        setSelectedDocument(snapshot.document);
        setSelectedVersion(snapshot.version);
        setEditDocument(JSON.stringify(snapshot.document, null, 2));
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = secureErrorMessage(error);
        setDetailsErrorMessage(message);
        onError?.({ message, requestId });
      } finally {
        if (!cancelled) {
          setDetailsLoading(false);
        }
      }
    };
    void loadSelected();
    return () => {
      cancelled = true;
    };
  }, [accessToken, apiBaseUrl, onError, requestId, selectedEntityId]);

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

    OpenAPI.BASE = apiBaseUrl;
    OpenAPI.TOKEN = accessToken;
    setBusyEntityId("create");
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "profiles_list",
      event: "save_submitted",
      meta: { operation: "create_entity_profile" },
    });
    try {
      const created = await ProfilesService.createEntityProfile({
        entity_type_id: createTypeId.trim(),
        document: parsed,
      });
      const item = toListItem(created);
      setItems((prev) => [item, ...prev]);
      setSelectedEntityId(item.entityId);
      setCreateModalOpened(false);
      setVisibleCount((current) => Math.max(current, pageSize));
      onAction?.({ type: "created", item });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_succeeded",
        meta: { operation: "create_entity_profile", entity_id: item.entityId },
      });
    } catch (error) {
      const message = secureErrorMessage(error);
      setMutationErrorMessage(message);
      onError?.({ message, requestId });
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

    OpenAPI.BASE = apiBaseUrl;
    OpenAPI.TOKEN = accessToken;
    setBusyEntityId(selectedEntityId);
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "profiles_list",
      event: "save_submitted",
      meta: { operation: "update_entity_profile", entity_id: selectedEntityId },
    });
    try {
      const updated = await ProfilesService.updateEntityProfile(selectedEntityId, { document: parsed });
      const updatedItem = toListItem(updated);
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
      const message = secureErrorMessage(error);
      setMutationErrorMessage(message);
      onError?.({ message, requestId });
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
    OpenAPI.BASE = apiBaseUrl;
    OpenAPI.TOKEN = accessToken;
    setBusyEntityId(entityId);
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "profiles_list",
      event: "save_submitted",
      meta: { operation: "delete_entity_profile", entity_id: entityId },
    });
    try {
      await ProfilesService.deleteEntityProfile(entityId);
      let nextSelectedEntityId: string | null = null;
      setItems((prev) => {
        const nextItems = prev.filter((item) => item.entityId !== entityId);
        nextSelectedEntityId = nextItems[0]?.entityId ?? null;
        return nextItems;
      });
      setSelectedEntityId((prev) => {
        if (prev !== entityId) {
          return prev;
        }
        return nextSelectedEntityId;
      });
      setEditMode(false);
      onAction?.({ type: "deleted", entityId });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_succeeded",
        meta: { operation: "delete_entity_profile", entity_id: entityId },
      });
    } catch (error) {
      const message = secureErrorMessage(error);
      setMutationErrorMessage(message);
      onError?.({ message, requestId });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_failed",
        meta: { operation: "delete_entity_profile", phase: "api", entity_id: entityId },
      });
    } finally {
      setBusyEntityId(null);
    }
  };

  const listItems = visibleItems.map((item) => ({
    id: item.entityId,
    title: item.entityId,
    description: `${item.entityTypeId} · v${item.version}`,
    searchText: `${item.entityId} ${item.preview} ${item.entityTypeId}`,
  }));
  const selectedItem = selectedEntityId ? items.find((item) => item.entityId === selectedEntityId) ?? null : null;

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
            totalItems={filtered.length}
            loadedItemsCount={visibleItems.length}
            onReachListEnd={() =>
              setVisibleCount((current) => Math.min(current + pageSize, filtered.length))
            }
            defaultWidthPercent={100}
            minWidthPercent={100}
            maxWidthPercent={100}
            renderCard={(item) => {
              const source = visibleItems.find((current) => current.entityId === item.id);
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
        </Stack>

        <Stack gap="sm" style={{ width: "75%" }}>
          {filtered.length === 0 ? (
            <Alert color="gray">No profiles found for current query.</Alert>
          ) : null}
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
