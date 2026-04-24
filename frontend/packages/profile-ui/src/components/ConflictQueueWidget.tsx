import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Code,
  Group,
  Loader,
  Modal,
  NativeSelect,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { AdminService, ApiError, OpenAPI } from "../generated";
import type { MergeEntityProfilesResponse, ProfileFieldConflict, ProfileSnapshot } from "../generated";
import type { ProfileWidgetHostContext } from "../types";

export type ConflictQueueWidgetProps = {
  hostContext: ProfileWidgetHostContext;
  apiBaseUrl: string;
  accessToken?: string;
  onError?: (payload: { message: string; requestId?: string }) => void;
};

type StatusFilter = "open" | "all";

type LastSuccess =
  | {
      kind: "resolve";
      conflictId: string;
      snapshot: ProfileSnapshot;
      finishedAt: string;
    }
  | {
      kind: "merge";
      response: MergeEntityProfilesResponse;
      finishedAt: string;
    };

const formatJson = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const parseResolutionPayload = (raw: string): unknown => {
  const trimmed = raw.trim();
  if (trimmed === "") {
    throw new Error("Resolution value is required.");
  }
  if (trimmed.startsWith("{") || trimmed.startsWith("[") || trimmed === "null" || trimmed === "true" || trimmed === "false") {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      throw new Error("Invalid JSON for resolution value.");
    }
  }
  const asNumber = Number(trimmed);
  if (!Number.isNaN(asNumber) && String(asNumber) === trimmed) {
    return asNumber;
  }
  return trimmed;
};

const errorMessageFromApi = (error: unknown): { message: string; requestId?: string } => {
  if (error instanceof ApiError) {
    const body = error.body as { message?: string; request_id?: string | null } | undefined;
    const requestId = body?.request_id ?? undefined;
    if (error.status === 401) {
      return { message: "Authentication required. Please sign in again.", requestId };
    }
    if (error.status === 403) {
      return {
        message:
          "Access denied. Admin realm role (e.g. april-profile-admin) or tenant context is missing for this operation.",
        requestId,
      };
    }
    if (error.status === 404) {
      return { message: "Conflict or entity was not found (it may have been resolved elsewhere).", requestId };
    }
    if (error.status === 409) {
      return {
        message:
          body?.message ??
          "Conflict with current server state (for example external mapping collision during merge). Retry after refresh.",
        requestId,
      };
    }
    return { message: body?.message ?? error.message, requestId };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: "Unexpected API error." };
};

export function ConflictQueueWidget({ hostContext, apiBaseUrl, accessToken, onError }: ConflictQueueWidgetProps) {
  const requestIdTelemetry = hostContext.telemetry?.requestId;
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [listErrorRequestId, setListErrorRequestId] = useState<string | undefined>();
  const [items, setItems] = useState<ProfileFieldConflict[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionErrorRequestId, setActionErrorRequestId] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [resolutionText, setResolutionText] = useState("{}");
  const [notesText, setNotesText] = useState("");
  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");
  const [lastSuccess, setLastSuccess] = useState<LastSuccess | null>(null);

  const selected = useMemo(
    () => (selectedId ? items.find((row) => row.id === selectedId) ?? null : null),
    [items, selectedId],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((row) => {
      if (statusFilter === "open" && row.status !== "open") {
        return false;
      }
      if (q === "") {
        return true;
      }
      return (
        row.entity_id.toLowerCase().includes(q) ||
        row.field_key.toLowerCase().includes(q) ||
        row.namespace.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q) ||
        row.reason.toLowerCase().includes(q)
      );
    });
  }, [items, search, statusFilter]);

  const loadList = useCallback(async () => {
    setLoading(true);
    setListError(null);
    setListErrorRequestId(undefined);
    OpenAPI.BASE = apiBaseUrl;
    OpenAPI.TOKEN = accessToken;
    try {
      const res = await AdminService.listProfileFieldConflicts();
      setItems(res.items);
    } catch (error) {
      const { message, requestId } = errorMessageFromApi(error);
      setListError(message);
      setListErrorRequestId(requestId);
      onError?.({ message, requestId: requestId ?? requestIdTelemetry });
    } finally {
      setLoading(false);
    }
  }, [accessToken, apiBaseUrl, onError, requestIdTelemetry]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const openResolve = () => {
    setActionError(null);
    setActionErrorRequestId(undefined);
    if (selected?.status !== "open") {
      setActionError("Only open conflicts can be resolved.");
      return;
    }
    setResolutionText(
      selected.incoming_value !== undefined ? formatJson(selected.incoming_value) : formatJson(selected.existing_value),
    );
    setNotesText("");
    setResolveOpen(true);
  };

  const submitResolve = async () => {
    if (!selected) {
      return;
    }
    let resolution: unknown;
    try {
      resolution = parseResolutionPayload(resolutionText);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Invalid resolution.");
      return;
    }
    setBusy(true);
    setActionError(null);
    setActionErrorRequestId(undefined);
    OpenAPI.BASE = apiBaseUrl;
    OpenAPI.TOKEN = accessToken;
    try {
      const snapshot = await AdminService.resolveProfileFieldConflict(selected.id, {
        resolution,
        notes: notesText.trim() || undefined,
      });
      setLastSuccess({
        kind: "resolve",
        conflictId: selected.id,
        snapshot,
        finishedAt: new Date().toISOString(),
      });
      setResolveOpen(false);
      setSelectedId(null);
      await loadList();
    } catch (error) {
      const { message, requestId } = errorMessageFromApi(error);
      setActionError(message);
      setActionErrorRequestId(requestId);
      onError?.({ message, requestId: requestId ?? requestIdTelemetry });
    } finally {
      setBusy(false);
    }
  };

  const submitMerge = async () => {
    setBusy(true);
    setActionError(null);
    setActionErrorRequestId(undefined);
    OpenAPI.BASE = apiBaseUrl;
    OpenAPI.TOKEN = accessToken;
    try {
      const response = await AdminService.mergeEntityProfiles({
        source_entity_id: mergeSource.trim(),
        target_entity_id: mergeTarget.trim(),
      });
      setLastSuccess({
        kind: "merge",
        response,
        finishedAt: new Date().toISOString(),
      });
      setMergeOpen(false);
      setMergeSource("");
      setMergeTarget("");
      await loadList();
    } catch (error) {
      const { message, requestId } = errorMessageFromApi(error);
      setActionError(message);
      setActionErrorRequestId(requestId);
      onError?.({ message, requestId: requestId ?? requestIdTelemetry });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Conflict queue</Title>
        <Text size="sm" c="dimmed">
          Admin API: open authority conflicts and explicit duplicate merge (source → target). Operations are audited on
          the server; this UI only drives the contract.
        </Text>
      </div>

      {listError ? (
        <Alert color="red" title="Could not load conflicts">
          {listError}
          {listErrorRequestId ? (
            <Text size="sm" mt="xs">
              request_id: <Code>{listErrorRequestId}</Code>
            </Text>
          ) : null}
        </Alert>
      ) : null}

      {lastSuccess ? (
        <Alert color="green" title="Last operation (audit summary)">
          {lastSuccess.kind === "resolve" ? (
            <Stack gap={4}>
              <Text size="sm">
                Resolved conflict <Code>{lastSuccess.conflictId}</Code> → new profile version{" "}
                <Code>{String(lastSuccess.snapshot.version)}</Code> for entity{" "}
                <Code>{lastSuccess.snapshot.entity_id}</Code>
              </Text>
              <Text size="xs" c="dimmed">
                completed_at: {lastSuccess.finishedAt} · created_at (snapshot): {lastSuccess.snapshot.created_at}
              </Text>
            </Stack>
          ) : (
            <Stack gap={4}>
              <Text size="sm">
                Merged source <Code>{lastSuccess.response.source_entity_id}</Code> into target{" "}
                <Code>{lastSuccess.response.target_entity_id}</Code> at version{" "}
                <Code>{String(lastSuccess.response.target_version)}</Code>
              </Text>
              <Text size="xs" c="dimmed">
                completed_at: {lastSuccess.finishedAt}
              </Text>
            </Stack>
          )}
        </Alert>
      ) : null}

      <Group align="flex-end" wrap="wrap">
        <NativeSelect
          label="Status"
          data={[
            { value: "open", label: "Open only" },
            { value: "all", label: "All statuses" },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.currentTarget.value as StatusFilter)}
        />
        <TextInput
          label="Search"
          placeholder="entity id, field, namespace, reason…"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: "1 1 240px" }}
        />
        <Button variant="light" onClick={() => void loadList()} disabled={loading}>
          Refresh
        </Button>
        <Button
          variant="outline"
          color="red"
          onClick={() => {
            setActionError(null);
            setActionErrorRequestId(undefined);
            setMergeOpen(true);
          }}
        >
          Merge duplicate profiles…
        </Button>
      </Group>

      {loading ? (
        <Group>
          <Loader size="sm" />
          <Text size="sm">Loading conflict queue…</Text>
        </Group>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Status</Table.Th>
              <Table.Th>Entity</Table.Th>
              <Table.Th>Field</Table.Th>
              <Table.Th>Namespace</Table.Th>
              <Table.Th>Reason</Table.Th>
              <Table.Th>Created</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((row) => (
              <Table.Tr
                key={row.id}
                onClick={() => setSelectedId(row.id)}
                style={{ cursor: "pointer", background: row.id === selectedId ? "var(--mantine-color-blue-light)" : undefined }}
              >
                <Table.Td>
                  <Badge color={row.status === "open" ? "orange" : "gray"}>{row.status}</Badge>
                </Table.Td>
                <Table.Td>
                  <Code>{row.entity_id}</Code>
                </Table.Td>
                <Table.Td>{row.field_key}</Table.Td>
                <Table.Td>{row.namespace}</Table.Td>
                <Table.Td>
                  <Text size="sm" lineClamp={1} title={row.reason}>
                    {row.reason}
                  </Text>
                </Table.Td>
                <Table.Td>{row.created_at}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {!loading && filtered.length === 0 && !listError ? (
        <Text size="sm" c="dimmed">
          No conflicts match the current filters.
        </Text>
      ) : null}

      {selected ? (
        <Stack gap="sm">
          <Title order={4}>Conflict details</Title>
          <Text size="sm">
            <strong>Reason:</strong> {selected.reason}
          </Text>
          <Text size="sm">
            <strong>Sources:</strong> existing from <Code>{selected.existing_source}</Code>, incoming from{" "}
            <Code>{selected.incoming_source}</Code>
          </Text>
          <Group align="flex-start" grow wrap="wrap">
            <Stack gap={4}>
              <Text size="sm" fw={600}>
                Existing value
              </Text>
              <Code block>{formatJson(selected.existing_value)}</Code>
            </Stack>
            <Stack gap={4}>
              <Text size="sm" fw={600}>
                Incoming value
              </Text>
              <Code block>{formatJson(selected.incoming_value)}</Code>
            </Stack>
          </Group>
          <Group>
            <Button onClick={openResolve} disabled={selected.status !== "open"}>
              Resolve conflict…
            </Button>
          </Group>
        </Stack>
      ) : (
        <Text size="sm" c="dimmed">
          Select a row to inspect values and run admin actions.
        </Text>
      )}

      <Modal
        opened={resolveOpen}
        onClose={() => {
          if (!busy) {
            setResolveOpen(false);
          }
        }}
        title="Confirm conflict resolution"
      >
        <Stack gap="sm">
          <Text size="sm">
            You are about to record a manual authority resolution for conflict <Code>{selected?.id}</Code>. The server
            persists the chosen field value, closes the conflict, and writes audit. This action is irreversible for this
            conflict record.
          </Text>
          <Textarea label="Resolution value (JSON or plain string)" value={resolutionText} onChange={(e) => setResolutionText(e.currentTarget.value)} minRows={4} autosize />
          <Textarea label="Notes (optional)" value={notesText} onChange={(e) => setNotesText(e.currentTarget.value)} minRows={2} autosize />
          {actionError ? (
            <Alert color="red">
              {actionError}
              {actionErrorRequestId ? (
                <Text size="sm" mt="xs">
                  request_id: <Code>{actionErrorRequestId}</Code>
                </Text>
              ) : null}
            </Alert>
          ) : null}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setResolveOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void submitResolve()} loading={busy}>
              Confirm resolve
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={mergeOpen}
        onClose={() => {
          if (!busy) {
            setMergeOpen(false);
          }
        }}
        title="Confirm merge duplicates"
      >
        <Stack gap="sm">
          <Text size="sm">
            Merge moves data from <strong>source</strong> into <strong>target</strong> within the same tenant and entity
            type, then deletes the source profile. Irreversible — confirm UUIDs carefully.
          </Text>
          <TextInput
            label="Source entity UUID"
            aria-label="Merge source entity UUID"
            value={mergeSource}
            onChange={(e) => setMergeSource(e.currentTarget.value)}
          />
          <TextInput
            label="Target entity UUID"
            aria-label="Merge target entity UUID"
            value={mergeTarget}
            onChange={(e) => setMergeTarget(e.currentTarget.value)}
          />
          {actionError ? (
            <Alert color="red">
              {actionError}
              {actionErrorRequestId ? (
                <Text size="sm" mt="xs">
                  request_id: <Code>{actionErrorRequestId}</Code>
                </Text>
              ) : null}
            </Alert>
          ) : null}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setMergeOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button color="red" onClick={() => void submitMerge()} loading={busy}>
              Confirm merge
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
