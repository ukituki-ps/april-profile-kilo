import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Group,
  Loader,
  Pagination,
  Select,
  Stack,
  Table,
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
  const [query, setQuery] = useState("");
  const [filterTypeId, setFilterTypeId] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [busyEntityId, setBusyEntityId] = useState<string | null>(null);
  const [createTypeId, setCreateTypeId] = useState("");
  const [createDocument, setCreateDocument] = useState('{"name":"New profile"}');
  const [editEntityId, setEditEntityId] = useState<string | null>(null);
  const [editDocument, setEditDocument] = useState("{}");

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

  const openEdit = async (entityId: string) => {
    setErrorMessage(null);
    OpenAPI.BASE = apiBaseUrl;
    OpenAPI.TOKEN = accessToken;
    setBusyEntityId(entityId);
    try {
      const snapshot = await ProfilesService.getEntityCurrentProfile(entityId);
      setEditEntityId(entityId);
      setEditDocument(JSON.stringify(snapshot.document, null, 2));
    } catch (error) {
      const message = secureErrorMessage(error);
      setErrorMessage(message);
      onError?.({ message, requestId });
    } finally {
      setBusyEntityId(null);
    }
  };

  const handleUpdate = async () => {
    if (!editEntityId) {
      return;
    }
    setErrorMessage(null);
    const parsed = parseJsonObject(editDocument);
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
    setBusyEntityId(editEntityId);
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "profiles_list",
      event: "save_submitted",
      meta: { operation: "update_entity_profile", entity_id: editEntityId },
    });
    try {
      const updated = await ProfilesService.updateEntityProfile(editEntityId, { document: parsed });
      const updatedItem = toListItem(updated);
      setItems((prev) => prev.map((item) => (item.entityId === editEntityId ? updatedItem : item)));
      setEditEntityId(null);
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
        meta: { operation: "update_entity_profile", phase: "api", entity_id: editEntityId },
      });
    } finally {
      setBusyEntityId(null);
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
    <Stack gap="md">
      <Title order={4}>Profiles list widget</Title>
      <Text size="sm" c="dimmed">
        Tenant: {hostContext.tenant.id}
      </Text>
      {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}

      <Group align="end">
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
      </Group>

      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Create profile
        </Text>
        <TextInput
          label="Entity type ID"
          placeholder="entity_type_id"
          value={createTypeId}
          onChange={(event) => setCreateTypeId(event.currentTarget.value)}
        />
        <Textarea
          label="Document (JSON object)"
          autosize
          minRows={4}
          value={createDocument}
          onChange={(event) => setCreateDocument(event.currentTarget.value)}
        />
        <Button onClick={handleCreate} loading={busyEntityId === "create"}>
          Create profile
        </Button>
      </Stack>

      {filtered.length === 0 ? (
        <Alert color="gray">No profiles found for current query.</Alert>
      ) : (
        <>
          <Table withTableBorder withColumnBorders striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Entity ID</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Version</Table.Th>
                <Table.Th>Preview</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pagedItems.map((item) => (
                <Table.Tr key={item.entityId}>
                  <Table.Td>{item.entityId}</Table.Td>
                  <Table.Td>{item.entityTypeId}</Table.Td>
                  <Table.Td>{item.version}</Table.Td>
                  <Table.Td>{item.preview}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => {
                          void openEdit(item.entityId);
                        }}
                        loading={busyEntityId === item.entityId && editEntityId !== item.entityId}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        onClick={() => {
                          void handleDelete(item.entityId);
                        }}
                        loading={busyEntityId === item.entityId && editEntityId !== item.entityId}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Pagination value={page} onChange={setPage} total={totalPages} />
        </>
      )}

      {editEntityId ? (
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Edit profile: {editEntityId}
          </Text>
          <Textarea
            label="Updated document (JSON object)"
            autosize
            minRows={6}
            value={editDocument}
            onChange={(event) => setEditDocument(event.currentTarget.value)}
          />
          <Group>
            <Button onClick={handleUpdate} loading={busyEntityId === editEntityId}>
              Save changes
            </Button>
            <Button variant="default" onClick={() => setEditEntityId(null)}>
              Cancel
            </Button>
          </Group>
        </Stack>
      ) : null}
    </Stack>
  );
}
