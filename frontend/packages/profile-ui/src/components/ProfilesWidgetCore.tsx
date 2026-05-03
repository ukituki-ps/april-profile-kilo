import { CardListColumn, DensityProvider } from "@april/ui";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Card,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import { emitProfileWidgetTelemetry } from "../observability";
import type { ProfileWidgetObservabilityHandler } from "../observability";
import { listPrimaryLabel, listSecondaryLabel } from "../profileDisplay";
import type { ProfileWidgetHostContext, ProfilesListAction, ProfilesListItem } from "../types";
import type { ProfilesDataProvider, ProfilesListSort, ProfilesProviderErrorCode, ProviderContext } from "../providers/profilesDataProvider";
import { isProfilesProviderError } from "../providers/profilesDataProvider";
import type { ProfilesWidgetProfileDetailHandle } from "./ProfilesWidgetProfileDetailCore";
import { ProfilesWidgetProfileDetailCore } from "./ProfilesWidgetProfileDetailCore";

export type ProfilesWidgetCoreProps = {
  hostContext: ProfileWidgetHostContext;
  provider: ProfilesDataProvider;
  providerContext?: Omit<ProviderContext, "signal">;
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

const CARD_LIST_COLLAPSE_ARIA = new Set(["Свернуть список", "Collapse list"]);
const CARD_LIST_EXPAND_ARIA = new Set(["Развернуть список", "Expand list"]);

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
  const [items, setItems] = useState<ProfilesListItem[]>([]);
  const itemsRef = useRef<ProfilesListItem[]>([]);
  itemsRef.current = items;
  const [query, setQuery] = useState(initialSearch);
  const [filterTypeId, setFilterTypeId] = useState(initialTypeId);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [listCollapsed, setListCollapsed] = useState(false);

  const requestId = hostContext.telemetry?.requestId;
  const preferredSelectionRef = useRef<string | null>(null);
  const listRequestIdRef = useRef(0);
  const listAbortControllerRef = useRef<AbortController | null>(null);
  const detailRef = useRef<ProfilesWidgetProfileDetailHandle>(null);

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

  const typeOptions = useMemo(() => {
    const unique = [...new Set(items.map((item) => item.entityTypeId))];
    return [{ value: "all", label: "All types" }, ...unique.map((value) => ({ value, label: value }))];
  }, [items]);

  const selectedRow = useMemo(
    () => (selectedEntityId ? items.find((item) => item.entityId === selectedEntityId) ?? null : null),
    [items, selectedEntityId],
  );

  const listItems = useMemo(
    () =>
      items.map((item) => ({
        id: item.entityId,
        title: listPrimaryLabel(item),
        description: listSecondaryLabel(item),
        searchText: `${item.entityId} ${item.preview} ${item.entityTypeId} ${listPrimaryLabel(item)}`,
      })),
    [items],
  );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, hostContext.tenant.id, pageSize, query, filterTypeId, initialSort, autoSelectFirst]);

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

        <Box
          style={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            gap: "1rem",
            width: "100%",
          }}
        >
          <Stack
            data-testid="profiles-widget-list-column"
            gap="xs"
            onClickCapture={(event) => {
              const btn = (event.target as HTMLElement | null)?.closest("button[aria-label]");
              const label = btn?.getAttribute("aria-label");
              if (label && CARD_LIST_COLLAPSE_ARIA.has(label)) {
                setListCollapsed(true);
                return;
              }
              if (label && CARD_LIST_EXPAND_ARIA.has(label)) {
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
                onAddItem={() => {
                  detailRef.current?.openCreate();
                }}
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
                      radius="md"
                      p="sm"
                      aria-label={`Profile row ${source?.entityId ?? item.id}`}
                      style={{
                        cursor: "pointer",
                        ...(selected
                          ? { borderColor: "var(--mantine-color-teal-filled)", borderWidth: 2 }
                          : { borderWidth: 1 }),
                      }}
                      onClick={() => {
                        setSelectedEntityId(item.id);
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

          {/* Detail root defaults to flex-grow:0; slot must flex:1 to fill the row after the list column. */}
          <Box
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <ProfilesWidgetProfileDetailCore
              ref={detailRef}
              hostContext={hostContext}
              provider={provider}
              providerContext={providerContext}
              entityId={selectedEntityId}
              listItem={selectedRow}
              listItemsForDuplicateCheck={items}
              initialCreateEntityTypeId={initialCreateEntityTypeId}
              documentEditingEnabled
              allowProfileDelete
              onAction={(action) => {
                onAction?.(action);
                if (action.type === "created") {
                  preferredSelectionRef.current = action.item.entityId;
                }
                void loadList({ append: false });
              }}
              onError={onError}
              onObservability={onObservability}
              onProfileUpdatedInList={() => {
                void loadList({ append: false });
              }}
              onListRevalidate={() => loadList({ append: false })}
              onEntityDeleted={() => {
                preferredSelectionRef.current = null;
                setSelectedEntityId(null);
                void loadList({ append: false });
              }}
              onCreatedSelectEntity={(id) => {
                preferredSelectionRef.current = id;
              }}
            />
          </Box>
        </Box>
      </Stack>
    </DensityProvider>
  );
}
