import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  Modal,
  Pagination,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
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
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [items, setItems] = useState<ProfilesListItem[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailVersion, setDetailVersion] = useState<number | null>(null);
  const [detailDocument, setDetailDocument] = useState("{}");
  const [editMode, setEditMode] = useState(false);
  const [query, setQuery] = useState("");
  const [filterTypeId, setFilterTypeId] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [busyEntityId, setBusyEntityId] = useState<string | null>(null);
  const [createOpened, setCreateOpened] = useState(false);
  const [createTypeId, setCreateTypeId] = useState("");
  const [createDocument, setCreateDocument] = useState('{"name":"New profile"}');

  const requestId = hostContext.telemetry?.requestId;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setErrorMessage(null);
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
        setSelectedEntityId((prev) => prev ?? nextItems[0]?.entityId ?? null);
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
        setErrorMessage(message);
        onError?.({ message, requestId });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, apiBaseUrl, entityIds, hostContext, onError, onObservability, requestId]);

  const loadDetail = async (entityId: string) => {
    setErrorMessage(null);
    setDetailLoading(true);
    OpenAPI.BASE = apiBaseUrl;
    OpenAPI.TOKEN = accessToken;
    try {
      const snapshot = await ProfilesService.getEntityCurrentProfile(entityId);
      setDetailDocument(JSON.stringify(snapshot.document, null, 2));
      setDetailVersion(snapshot.version);
      setItems((prev) =>
        prev.map((item) => (item.entityId === entityId ? toListItem(snapshot) : item)),
      );
    } catch (error) {
      const message = secureErrorMessage(error);
      setErrorMessage(message);
      onError?.({ message, requestId });
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedEntityId) {
      setDetailDocument("{}");
      setDetailVersion(null);
      setEditMode(false);
      return;
    }
    void loadDetail(selectedEntityId);
    setEditMode(false);
  }, [selectedEntityId]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedItems = useMemo(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    return filtered.slice(from, to);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (!selectedEntityId) {
      return;
    }
    if (!filtered.some((item) => item.entityId === selectedEntityId)) {
      setSelectedEntityId(filtered[0]?.entityId ?? null);
    }
  }, [filtered, selectedEntityId]);

  const handleCreate = async () => {
    setErrorMessage(null);
    const parsed = parseJsonObject(createDocument);
    if (!createTypeId.trim() || !parsed) {
      setErrorMessage("Create form expects entity type ID and JSON object document.");
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
      setCreateOpened(false);
      setCreateTypeId("");
      setCreateDocument('{"name":"New profile"}');
      onAction?.({ type: "created", item });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_succeeded",
        meta: { operation: "create_entity_profile", entity_id: item.entityId },
      });
    } catch (error) {
      const message = secureErrorMessage(error);
      setErrorMessage(message);
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
    setErrorMessage(null);
    const parsed = parseJsonObject(detailDocument);
    if (!parsed) {
      setErrorMessage("Edit form expects JSON object document.");
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_failed",
        meta: { operation: "update_entity_profile", phase: "validation" },
      });
      return;
    }

    OpenAPI.BASE = apiBaseUrl;
    OpenAPI.TOKEN = accessToken;
    setDetailSaving(true);
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "profiles_list",
      event: "save_submitted",
      meta: { operation: "update_entity_profile", entity_id: selectedEntityId },
    });
    try {
      const updated = await ProfilesService.updateEntityProfile(selectedEntityId, { document: parsed });
      const updatedItem = toListItem(updated);
      setItems((prev) =>
        prev.map((item) => (item.entityId === selectedEntityId ? updatedItem : item)),
      );
      setDetailVersion(updated.version);
      setDetailDocument(JSON.stringify(updated.document, null, 2));
      setEditMode(false);
      onAction?.({ type: "updated", item: updatedItem });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_succeeded",
        meta: { operation: "update_entity_profile", entity_id: updatedItem.entityId, version: updatedItem.version },
      });
    } catch (error) {
      const message = secureErrorMessage(error);
      setErrorMessage(message);
      onError?.({ message, requestId });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_failed",
        meta: { operation: "update_entity_profile", phase: "api", entity_id: selectedEntityId },
      });
    } finally {
      setDetailSaving(false);
    }
  };

  const handleDelete = async (entityId: string) => {
    setErrorMessage(null);
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
      setItems((prev) => prev.filter((item) => item.entityId !== entityId));
      if (selectedEntityId === entityId) {
        setSelectedEntityId(null);
      }
      onAction?.({ type: "deleted", entityId });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_succeeded",
        meta: { operation: "delete_entity_profile", entity_id: entityId },
      });
    } catch (error) {
      const message = secureErrorMessage(error);
      setErrorMessage(message);
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

  if (loading) {
    return (
      <Group aria-label="profiles-list-loading">
        <Loader size="sm" />
        <Text size="sm">Loading profiles...</Text>
      </Group>
    );
  }

  return (
    <Stack gap="md" aria-label="widget-card-layout">
      <Title order={4}>Profiles list widget</Title>
      <Text size="sm" c="dimmed">
        Tenant: {hostContext.tenant.id}
      </Text>
      {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}

      <Group align="flex-start" wrap="nowrap">
        <Stack gap="sm" style={{ width: "25%", minWidth: 280 }}>
          <Group justify="space-between">
            <Text fw={600}>Card List Column</Text>
            <ActionIcon
              aria-label="Open create profile modal"
              variant="light"
              onClick={() => setCreateOpened(true)}
            >
              +
            </ActionIcon>
          </Group>
          <TextInput
            label="Search"
            placeholder="Search by entity ID or preview"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          <Select
            label="Type filter"
            data={typeOptions}
            value={filterTypeId}
            onChange={(value) => setFilterTypeId(value ?? "all")}
          />
          <Divider />
          {filtered.length === 0 ? (
            <Alert color="gray">No profiles found for current query.</Alert>
          ) : (
            <Stack gap="xs">
              {pagedItems.map((item) => (
                <Paper
                  key={item.entityId}
                  withBorder
                  p="sm"
                  radius="md"
                  role="button"
                  aria-label={`Select ${item.entityId}`}
                  onClick={() => setSelectedEntityId(item.entityId)}
                  style={{
                    cursor: "pointer",
                    borderColor:
                      selectedEntityId === item.entityId
                        ? "var(--mantine-color-blue-6)"
                        : undefined,
                  }}
                >
                  <Stack gap={4}>
                    <Group justify="space-between" gap="xs">
                      <Text size="sm" fw={500} lineClamp={1}>
                        {item.entityId}
                      </Text>
                      <Text size="xs" c="dimmed">
                        v{item.version}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {item.preview}
                    </Text>
                    <Badge variant="light" size="sm">
                      {item.entityTypeId}
                    </Badge>
                  </Stack>
                </Paper>
              ))}
              <Pagination value={page} onChange={setPage} total={totalPages} />
            </Stack>
          )}
        </Stack>

        <Card withBorder radius="md" p="md" style={{ width: "75%" }}>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>Profile card</Text>
              {selectedEntityId ? (
                <Group gap="xs">
                  {editMode ? (
                    <>
                      <Button
                        size="xs"
                        onClick={() => {
                          void handleUpdate();
                        }}
                        loading={detailSaving}
                      >
                        Save changes
                      </Button>
                      <Button
                        size="xs"
                        variant="default"
                        onClick={() => {
                          setEditMode(false);
                          void loadDetail(selectedEntityId);
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="xs" variant="light" onClick={() => setEditMode(true)}>
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        loading={busyEntityId === selectedEntityId}
                        onClick={() => {
                          void handleDelete(selectedEntityId);
                        }}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </Group>
              ) : null}
            </Group>

            {!selectedEntityId ? (
              <Alert color="gray">Select a profile in Card List Column to view details.</Alert>
            ) : detailLoading ? (
              <Group aria-label="profile-detail-loading">
                <Loader size="sm" />
                <Text size="sm">Loading selected profile...</Text>
              </Group>
            ) : (
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  Entity: {selectedEntityId}
                </Text>
                <Text size="sm" c="dimmed">
                  Version: {detailVersion ?? "unknown"}
                </Text>
                <Textarea
                  label={editMode ? "Profile document (edit JSON object)" : "Profile document (view)"}
                  autosize
                  minRows={14}
                  value={detailDocument}
                  readOnly={!editMode}
                  onChange={(event) => setDetailDocument(event.currentTarget.value)}
                />
              </Stack>
            )}
          </Stack>
        </Card>
      </Group>

      <Modal
        opened={createOpened}
        onClose={() => setCreateOpened(false)}
        title="Create new profile"
        centered
      >
        <Stack gap="sm">
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
          <Button onClick={() => void handleCreate()} loading={busyEntityId === "create"}>
            Create profile
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
