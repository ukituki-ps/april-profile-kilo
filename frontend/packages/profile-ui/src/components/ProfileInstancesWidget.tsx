import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Group, Loader, Pagination, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { ApiError, OpenAPI, ProfilesService } from "../generated";
import type { ProfileInstanceListItem, ProfileInstancesAction, ProfileWidgetHostContext } from "../types";

export type ProfileInstancesWidgetProps = {
  hostContext: ProfileWidgetHostContext;
  profileId: string;
  instanceIds: string[];
  apiBaseUrl: string;
  accessToken?: string;
  pageSize?: number;
  onAction?: (action: ProfileInstancesAction) => void;
  onOpenInstance?: (entityId: string) => void;
  onError?: (payload: { message: string; requestId?: string }) => void;
};

const DEFAULT_PAGE_SIZE = 5;

const previewDocument = (value: unknown): string => {
  try {
    const raw = JSON.stringify(value ?? {});
    return raw.length > 100 ? `${raw.slice(0, 97)}...` : raw;
  } catch {
    return "{}";
  }
};

const toItem = (snapshot: Awaited<ReturnType<typeof ProfilesService.getEntityCurrentProfile>>): ProfileInstanceListItem => ({
  entityId: snapshot.entity_id,
  profileId: snapshot.entity_type_id,
  version: snapshot.version,
  updatedAt: snapshot.created_at,
  preview: previewDocument(snapshot.document),
});

const normalizeError = (error: unknown): { message: string; status?: number } => {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return { message: "Access token is missing or invalid", status: 401 };
    }
    if (error.status === 403) {
      return { message: "Access denied by ABAC policy", status: 403 };
    }
    if (error.status === 409) {
      return { message: "Conflict with authority restrictions", status: 409 };
    }
    return { message: error.message, status: error.status };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: "Unexpected profile API error" };
};

export function ProfileInstancesWidget({
  hostContext,
  profileId,
  instanceIds,
  apiBaseUrl,
  accessToken,
  pageSize = DEFAULT_PAGE_SIZE,
  onAction,
  onOpenInstance,
  onError,
}: ProfileInstancesWidgetProps) {
  const requestId = hostContext.telemetry?.requestId;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [readonlyMode, setReadonlyMode] = useState(false);
  const [deniedMode, setDeniedMode] = useState(false);
  const [items, setItems] = useState<ProfileInstanceListItem[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createDocument, setCreateDocument] = useState("{}");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setErrorMessage(null);
      setDeniedMode(false);
      OpenAPI.BASE = apiBaseUrl;
      OpenAPI.TOKEN = accessToken;
      try {
        const loaded = await Promise.all(
          instanceIds.map(async (entityId) => {
            try {
              const snapshot = await ProfilesService.getEntityCurrentProfile(entityId);
              if (snapshot.entity_type_id !== profileId) {
                return null;
              }
              return toItem(snapshot);
            } catch (error) {
              if (error instanceof ApiError && error.status === 404) {
                // hidden case: missing items are excluded from list.
                return null;
              }
              throw error;
            }
          }),
        );
        if (!cancelled) {
          setItems(loaded.filter((value): value is ProfileInstanceListItem => value !== null));
        }
      } catch (error) {
        if (!cancelled) {
          const normalized = normalizeError(error);
          setErrorMessage(normalized.message);
          setDeniedMode(normalized.status === 401 || normalized.status === 403);
          onError?.({ message: normalized.message, requestId });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [accessToken, apiBaseUrl, instanceIds, onError, profileId, requestId]);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) {
      return items;
    }
    return items.filter((item) => item.entityId.toLowerCase().includes(lower) || item.preview.toLowerCase().includes(lower));
  }, [items, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const parseDocument = (raw: string): Record<string, unknown> | null => {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setErrorMessage("Document must be a JSON object");
        return null;
      }
      return parsed as Record<string, unknown>;
    } catch {
      setErrorMessage("Document must be valid JSON");
      return null;
    }
  };

  const withMutation = async (run: () => Promise<void>) => {
    setSubmitting(true);
    setErrorMessage(null);
    OpenAPI.BASE = apiBaseUrl;
    OpenAPI.TOKEN = accessToken;
    try {
      await run();
    } catch (error) {
      const normalized = normalizeError(error);
      setErrorMessage(normalized.message);
      if (normalized.status === 403) {
        setReadonlyMode(true);
      }
      onError?.({ message: normalized.message, requestId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async () => {
    const parsed = parseDocument(createDocument);
    if (!parsed) {
      return;
    }
    await withMutation(async () => {
      const saved = await ProfilesService.createEntityProfile({ entity_type_id: profileId, document: parsed });
      const created = toItem(saved);
      setItems((prev) => [created, ...prev]);
      onAction?.({ type: "created", item: created });
    });
  };

  const handleUpdate = async (entityId: string) => {
    await withMutation(async () => {
      const saved = await ProfilesService.updateEntityProfile(entityId, { document: { note: "instance-updated" } });
      const updated = toItem(saved);
      setItems((prev) => prev.map((item) => (item.entityId === entityId ? updated : item)));
      onAction?.({ type: "updated", item: updated });
    });
  };

  const handleDelete = async (entityId: string) => {
    await withMutation(async () => {
      await ProfilesService.deleteEntityProfile(entityId);
      setItems((prev) => prev.filter((item) => item.entityId !== entityId));
      onAction?.({ type: "deleted", entityId });
    });
  };

  if (loading) {
    return (
      <Group aria-label="profile-instances-loading">
        <Loader size="sm" />
        <Text size="sm">Loading instances...</Text>
      </Group>
    );
  }

  return (
    <Stack gap="md">
      <Title order={4}>Profile instances widget</Title>
      <Text size="sm" c="dimmed">
        Profile ID: {profileId}
      </Text>
      {deniedMode ? <Alert color="red">Denied: you can not access this profile context.</Alert> : null}
      {readonlyMode ? <Alert color="yellow">Readonly mode: write actions are blocked by ABAC.</Alert> : null}
      {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}
      <Group grow>
        <TextInput label="Search instances" placeholder="Entity ID or preview" value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
        <TextInput label="Create document JSON" value={createDocument} onChange={(event) => setCreateDocument(event.currentTarget.value)} />
      </Group>
      <Group>
        <Button onClick={handleCreate} disabled={readonlyMode || deniedMode} loading={submitting}>
          Create instance
        </Button>
        <Badge variant="light">{filtered.length} instances</Badge>
      </Group>
      {filtered.length === 0 ? <Alert color="blue">No visible instances for this profile.</Alert> : null}
      {filtered.length > 0 ? (
        <>
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Entity ID</Table.Th>
                <Table.Th>Version</Table.Th>
                <Table.Th>Updated at</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pageItems.map((item) => (
                <Table.Tr key={item.entityId}>
                  <Table.Td>{item.entityId}</Table.Td>
                  <Table.Td>{item.version}</Table.Td>
                  <Table.Td>{item.updatedAt}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button size="xs" variant="light" onClick={() => onOpenInstance?.(item.entityId)}>
                        Open
                      </Button>
                      <Button size="xs" variant="light" disabled={readonlyMode || deniedMode} loading={submitting} onClick={() => void handleUpdate(item.entityId)}>
                        Update
                      </Button>
                      <Button size="xs" color="red" variant="light" disabled={readonlyMode || deniedMode} loading={submitting} onClick={() => void handleDelete(item.entityId)}>
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Pagination total={totalPages} value={page} onChange={setPage} />
        </>
      ) : null}
    </Stack>
  );
}
