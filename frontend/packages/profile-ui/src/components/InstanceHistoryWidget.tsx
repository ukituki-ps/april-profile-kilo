import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Code,
  Group,
  Loader,
  NativeSelect,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { ApiError, OpenAPI, ProfilesService } from "../generated";
import type { ProfileSnapshot } from "../generated";
import { emitProfileWidgetTelemetry } from "../observability";
import type { ProfileWidgetObservabilityHandler } from "../observability";
import type { ProfileWidgetHostContext } from "../types";

type CompareMode = "current" | "previous";

export type InstanceHistoryWidgetProps = {
  hostContext: ProfileWidgetHostContext;
  entityId: string;
  apiBaseUrl: string;
  accessToken?: string;
  onError?: (payload: { message: string; requestId?: string }) => void;
  /** Только `view_loaded` (виджет без мутаций сохранения в текущем API). */
  onObservability?: ProfileWidgetObservabilityHandler;
};

type TimelineVersion = {
  version: number;
  createdAt: string;
  source: string;
  actor: string;
  snapshot: ProfileSnapshot;
};

type DiffRow = {
  path: string;
  beforeValue: string;
  afterValue: string;
};

const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const prettyJson = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "{}";
  }
};

const normalizeError = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Authentication required. Please sign in again.";
    }
    if (error.status === 403) {
      return "Access denied for this profile history.";
    }
    if (error.status === 404) {
      return "Profile or version not found.";
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected history API error.";
};

const flattenDocument = (input: unknown, prefix = ""): Map<string, string> => {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    const terminalPath = prefix === "" ? "$" : prefix;
    return new Map([[terminalPath, safeStringify(input)]]);
  }

  const objectValue = input as Record<string, unknown>;
  const keys = Object.keys(objectValue).sort();
  if (keys.length === 0) {
    const emptyPath = prefix === "" ? "$" : prefix;
    return new Map([[emptyPath, "{}"]]);
  }

  const output = new Map<string, string>();
  keys.forEach((key) => {
    const childPath = prefix ? `${prefix}.${key}` : key;
    const childMap = flattenDocument(objectValue[key], childPath);
    childMap.forEach((value, path) => output.set(path, value));
  });
  return output;
};

const buildDiff = (beforeDoc: unknown, afterDoc: unknown): DiffRow[] => {
  const before = flattenDocument(beforeDoc);
  const after = flattenDocument(afterDoc);
  const allPaths = [...new Set([...before.keys(), ...after.keys()])].sort();

  return allPaths
    .filter((path) => before.get(path) !== after.get(path))
    .map((path) => ({
      path,
      beforeValue: before.get(path) ?? "undefined",
      afterValue: after.get(path) ?? "undefined",
    }));
};

const toTimelineVersion = (snapshot: ProfileSnapshot): TimelineVersion => {
  const meta = snapshot.document?._meta as Record<string, unknown> | undefined;
  const source = snapshot.external_refs[0]?.source_system ?? "api";
  const actor = typeof meta?.updated_by === "string" ? meta.updated_by : "unknown";

  return {
    version: snapshot.version,
    createdAt: snapshot.created_at,
    source,
    actor,
    snapshot,
  };
};

export function InstanceHistoryWidget({
  hostContext,
  entityId,
  apiBaseUrl,
  accessToken,
  onError,
  onObservability,
}: InstanceHistoryWidgetProps) {
  const requestId = hostContext.telemetry?.requestId;
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [versions, setVersions] = useState<TimelineVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState<CompareMode>("previous");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setErrorMessage(null);
      OpenAPI.BASE = apiBaseUrl;
      OpenAPI.TOKEN = accessToken;

      try {
        const current = await ProfilesService.getEntityCurrentProfile(entityId);
        const requests = Array.from({ length: current.version }, (_, index) =>
          ProfilesService.getEntityProfileByVersion(entityId, index + 1),
        );
        const snapshots = await Promise.all(requests);
        if (cancelled) {
          return;
        }
        const timeline = snapshots.map(toTimelineVersion).sort((a, b) => b.version - a.version);
        setVersions(timeline);
        setSelectedVersion(timeline[0]?.version ?? null);
        emitProfileWidgetTelemetry(onObservability, hostContext, {
          widget: "instance_history",
          event: "view_loaded",
          meta: { entity_id: entityId, version_count: timeline.length },
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = normalizeError(error);
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
  }, [accessToken, apiBaseUrl, entityId, hostContext, onError, onObservability, requestId]);

  const selected = useMemo(
    () => versions.find((item) => item.version === selectedVersion) ?? null,
    [selectedVersion, versions],
  );
  const current = versions[0] ?? null;
  const previous = selected
    ? versions.find((item) => item.version === selected.version - 1) ?? null
    : null;
  const compareTarget =
    compareMode === "current" ? current : previous;
  const diffRows = selected && compareTarget
    ? buildDiff(compareTarget.snapshot.document, selected.snapshot.document)
    : [];

  if (loading) {
    return (
      <Group aria-label="instance-history-loading">
        <Loader size="sm" />
        <Text size="sm">Loading instance history...</Text>
      </Group>
    );
  }

  return (
    <Stack gap="md">
      <Title order={4}>Instance history widget</Title>
      <Text size="sm" c="dimmed">
        Entity: {entityId}
      </Text>
      {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}
      <Alert color="blue">
        Restore is unavailable in the current API contract. History is read-only.
      </Alert>

      {versions.length === 0 ? <Alert color="gray">No versions found for this instance.</Alert> : null}

      {versions.length > 0 ? (
        <>
          <Table withTableBorder striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Version</Table.Th>
                <Table.Th>Created at</Table.Th>
                <Table.Th>Actor</Table.Th>
                <Table.Th>Source</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {versions.map((item) => (
                <Table.Tr key={item.version}>
                  <Table.Td>
                    <Badge variant={item.version === selectedVersion ? "filled" : "light"}>v{item.version}</Badge>
                  </Table.Td>
                  <Table.Td>{item.createdAt}</Table.Td>
                  <Table.Td>{item.actor}</Table.Td>
                  <Table.Td>{item.source}</Table.Td>
                  <Table.Td>
                    <Button size="xs" variant="light" onClick={() => setSelectedVersion(item.version)}>
                      View
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {selected ? (
            <Stack gap="xs">
              <Group justify="space-between">
                <Text fw={500}>Selected version: v{selected.version}</Text>
                <NativeSelect
                  label="Compare with"
                  value={compareMode}
                  data={[
                    { value: "previous", label: "Previous version" },
                    { value: "current", label: "Current version" },
                  ]}
                  onChange={(event) => setCompareMode((event.currentTarget.value as CompareMode) ?? "previous")}
                />
              </Group>
              <Text size="sm" c="dimmed">
                Snapshot
              </Text>
              <Code block>{prettyJson(selected.snapshot.document)}</Code>
              <Text size="sm" c="dimmed">
                Diff against {compareMode === "current" ? "current version" : "previous version"}
              </Text>
              {!compareTarget ? (
                <Alert color="gray">
                  Diff is unavailable: the selected version does not have a comparison target.
                </Alert>
              ) : diffRows.length === 0 ? (
                <Alert color="gray">No document changes relative to comparison target.</Alert>
              ) : (
                <Table withTableBorder striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Path</Table.Th>
                      <Table.Th>Before</Table.Th>
                      <Table.Th>After</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {diffRows.map((row) => (
                      <Table.Tr key={row.path}>
                        <Table.Td>{row.path}</Table.Td>
                        <Table.Td>
                          <Code>{row.beforeValue}</Code>
                        </Table.Td>
                        <Table.Td>
                          <Code>{row.afterValue}</Code>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Stack>
          ) : null}
        </>
      ) : null}
    </Stack>
  );
}
