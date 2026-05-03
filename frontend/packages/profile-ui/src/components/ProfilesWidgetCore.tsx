import {
  AprilModal,
  AprilVaulBottomSheet,
  APRIL_MOBILE_BOTTOM_SHEET_Z_INDEX,
  CardListColumn,
  DensityProvider,
  type CardListColumnMobileLayout,
  type CardListColumnView,
} from "@april/ui";
import { useMediaQuery } from "@mantine/hooks";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  /**
   * Проброс в `CardListColumn.mobileLayout`. `auto` — мобильный shell/sheets по `(max-width: 47.99em)`;
   * `off` — десктопное поведение даже на узком iframe (витрина).
   */
  cardListColumnMobileLayout?: CardListColumnMobileLayout;
};

const DEFAULT_PAGE_SIZE = 20;

/** Согласовано с `CardListColumn` (`useMediaQuery` в `@april/ui`). */
const PROFILE_NARROW_MEDIA_QUERY = "(max-width: 47.99em)";

/** DS ≥0.1.9: только `list` | `grid`; устаревшее значение (напр. `collapsed` в state после HMR) ломает chrome колонки. */
function normalizeCardListColumnView(value: unknown): CardListColumnView {
  return value === "grid" ? "grid" : "list";
}

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
  cardListColumnMobileLayout = "auto",
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
  const [cardListView, setCardListView] = useState<CardListColumnView>("list");
  const effectiveCardListView = normalizeCardListColumnView(cardListView);
  useLayoutEffect(() => {
    if (cardListView !== effectiveCardListView) {
      setCardListView(effectiveCardListView);
    }
  }, [cardListView, effectiveCardListView]);
  /** В режиме сетки: держим модалку открытой для потока «Создать» без выбранной строки. */
  const [gridCreateSession, setGridCreateSession] = useState(false);
  const [pendingGridOpenCreate, setPendingGridOpenCreate] = useState(false);
  const [gridDetailHeaderHostEl, setGridDetailHeaderHostEl] = useState<HTMLElement | null>(null);
  const [gridModalDetailTitleOverride, setGridModalDetailTitleOverride] = useState<string | null>(null);

  const bindGridDetailHeaderHost = useCallback((node: HTMLElement | null) => {
    setGridDetailHeaderHostEl(node);
  }, []);

  const requestId = hostContext.telemetry?.requestId;
  const preferredSelectionRef = useRef<string | null>(null);
  const listRequestIdRef = useRef(0);
  const listAbortControllerRef = useRef<AbortController | null>(null);
  const detailRef = useRef<ProfilesWidgetProfileDetailHandle>(null);

  const matchesNarrowViewport = useMediaQuery(PROFILE_NARROW_MEDIA_QUERY);
  const isNarrowViewport = Boolean(matchesNarrowViewport);

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

  const isGridLayout = effectiveCardListView === "grid";
  const gridFlowOverlayOpened = isGridLayout && (Boolean(selectedEntityId) || gridCreateSession);
  const narrowListDetailOpened = isNarrowViewport && !isGridLayout && Boolean(selectedEntityId);
  const profileDetailVaulOpened = isNarrowViewport && (gridFlowOverlayOpened || narrowListDetailOpened);
  const profileDetailModalOpened = !isNarrowViewport && gridFlowOverlayOpened;
  const showDetailInline = !isGridLayout && !isNarrowViewport;
  const showSrOnlyDetailMount = isNarrowViewport && !isGridLayout && !narrowListDetailOpened;

  const gridModalHeaderTitle = useMemo(() => {
    if (selectedRow) {
      const fromDetail = gridModalDetailTitleOverride?.trim();
      if (fromDetail) {
        return fromDetail;
      }
      return listPrimaryLabel(selectedRow);
    }
    return "Create profile";
  }, [selectedRow, gridModalDetailTitleOverride]);

  useEffect(() => {
    if (!isGridLayout || !selectedEntityId) {
      setGridModalDetailTitleOverride(null);
    }
  }, [isGridLayout, selectedEntityId]);

  const handleCardListViewChange = useCallback((next: CardListColumnView) => {
    const v = normalizeCardListColumnView(next);
    setCardListView(v);
    if (v === "grid") {
      detailRef.current?.closeCreate();
      setSelectedEntityId(null);
      setGridCreateSession(false);
      setPendingGridOpenCreate(false);
    } else {
      setGridCreateSession(false);
      setPendingGridOpenCreate(false);
    }
  }, []);

  const handleGridProfileModalClose = useCallback(() => {
    detailRef.current?.closeCreate();
    setGridCreateSession(false);
    setPendingGridOpenCreate(false);
    setSelectedEntityId(null);
  }, []);

  /** Не даём `CardListColumn` снять выбор по повторному клику (toggle → `null`) — для master–detail это ломает первый клик при `autoSelectFirst`. */
  const handleSelectProfileFromList = useCallback(
    (id: string | null) => {
      if (id === null) {
        return;
      }
      setSelectedEntityId(id);
      onOpenEntity?.(id);
    },
    [onOpenEntity],
  );

  useEffect(() => {
    if (!pendingGridOpenCreate) {
      return;
    }
    if (!gridFlowOverlayOpened) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      detailRef.current?.openCreate();
      setPendingGridOpenCreate(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pendingGridOpenCreate, gridFlowOverlayOpened]);

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

  const renderProfileDetail = () => (
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
          setGridCreateSession(false);
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
      embedCreateFlowInline={isGridLayout && gridCreateSession && !selectedEntityId}
      hostGridProfileModalChrome={Boolean(selectedEntityId) && (profileDetailModalOpened || profileDetailVaulOpened)}
      gridModalDetailHeaderHostEl={
        profileDetailModalOpened || profileDetailVaulOpened ? gridDetailHeaderHostEl : null
      }
      onHostGridModalDetailTitleChange={setGridModalDetailTitleOverride}
    />
  );

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
            flexDirection: isGridLayout || isNarrowViewport ? "column" : "row",
            alignItems: "stretch",
            gap: isGridLayout || isNarrowViewport ? 0 : "1rem",
            width: "100%",
          }}
        >
          <Stack
            data-testid="profiles-widget-list-column"
            gap="xs"
            style={
              isGridLayout || isNarrowViewport
                ? {
                    flex: "1 1 auto",
                    width: "100%",
                    maxWidth: "100%",
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                  }
                : {
                    flex: "0 0 auto",
                    width: "clamp(280px, 30vw, 420px)",
                    minWidth: 280,
                    maxWidth: "44%",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                  }
            }
          >
            <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <CardListColumn
                title="Profiles"
                items={listItems}
                mode="inline"
                heightMode="fill"
                mobileLayout={cardListColumnMobileLayout}
                view={effectiveCardListView}
                onViewChange={handleCardListViewChange}
                selectedItemId={selectedEntityId}
                onSelectItem={handleSelectProfileFromList}
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
                  if (isGridLayout) {
                    setGridCreateSession(true);
                    setPendingGridOpenCreate(true);
                  } else {
                    detailRef.current?.openCreate();
                  }
                }}
                totalItems={totalCount}
                loadedItemsCount={items.length}
                onReachListEnd={() => {
                  if (!nextCursor || listLoadingMore) {
                    return;
                  }
                  void loadList({ append: true, cursor: nextCursor });
                }}
                defaultWidthPercent={96}
                minWidthPercent={90}
                maxWidthPercent={100}
                renderCard={(item) => {
                  const source = items.find((current) => current.entityId === item.id);
                  const selected = selectedEntityId === item.id;
                  return (
                    <Card
                      withBorder
                      radius="md"
                      p="sm"
                      h="100%"
                      aria-label={`Profile row ${source?.entityId ?? item.id}`}
                      style={{
                        cursor: "pointer",
                        boxSizing: "border-box",
                        ...(selected
                          ? { borderColor: "var(--mantine-color-teal-filled)", borderWidth: 2 }
                          : { borderWidth: 1 }),
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSelectProfileFromList(item.id);
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

          {showDetailInline ? (
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
              {renderProfileDetail()}
            </Box>
          ) : null}
        </Box>

        {showSrOnlyDetailMount ? (
          <Box
            data-testid="profiles-widget-detail-sr-mount"
            style={{
              position: "fixed",
              left: -9999,
              top: 0,
              width: 1,
              height: 1,
              overflow: "hidden",
              pointerEvents: "none",
              opacity: 0,
            }}
            aria-hidden
          >
            {renderProfileDetail()}
          </Box>
        ) : null}

        {profileDetailModalOpened ? (
          <AprilModal
            opened
            onClose={handleGridProfileModalClose}
            headerTitle={gridModalHeaderTitle}
            headerActions={
              <span
                ref={bindGridDetailHeaderHost}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "var(--mantine-spacing-xs)",
                  flexShrink: 1,
                  minWidth: 0,
                  maxWidth: "min(56vw, 720px)",
                  flexWrap: "wrap",
                }}
              />
            }
            size="xl"
            centered
            styles={{
              content: {
                maxHeight: "min(92dvh, 900px)",
                width: "min(96vw, 960px)",
              },
            }}
          >
            <Box
              style={{
                width: "100%",
                minHeight: "min(70dvh, 560px)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {renderProfileDetail()}
            </Box>
          </AprilModal>
        ) : null}

        {profileDetailVaulOpened ? (
          <AprilVaulBottomSheet
            opened
            onClose={handleGridProfileModalClose}
            headerTitle={gridModalHeaderTitle}
            zIndex={APRIL_MOBILE_BOTTOM_SHEET_Z_INDEX + 10}
            overlayZIndex={APRIL_MOBILE_BOTTOM_SHEET_Z_INDEX + 9}
            headerActions={
              <span
                ref={bindGridDetailHeaderHost}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "var(--mantine-spacing-xs)",
                  flexShrink: 1,
                  minWidth: 0,
                  maxWidth: "min(72vw, 560px)",
                  flexWrap: "wrap",
                }}
              />
            }
          >
            <Box
              style={{
                width: "100%",
                minHeight: "min(40dvh, 360px)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {renderProfileDetail()}
            </Box>
          </AprilVaulBottomSheet>
        ) : null}
      </Stack>
    </DensityProvider>
  );
}
