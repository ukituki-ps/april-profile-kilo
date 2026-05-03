import { AprilJsonTreeEditor, DensityProvider } from "@april/ui";
import {
  IconDeviceFloppy,
  IconEdit,
  IconSparkles,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  DraftJsonEditorToolbar,
  EntityTypesDraftJsonEditor,
  ENTITY_TYPE_DRAFT_ROOT_JSON_SCHEMA,
  parseEntityTypeDraftSchemaText,
  type DraftJsonEditorMode,
} from "./EntityTypesDraftJsonEditor";
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { emitProfileWidgetTelemetry } from "../observability";
import type { ProfileWidgetObservabilityHandler } from "../observability";
import {
  extractProfileNameFromDocument,
  isDuplicateProfileName,
  listPrimaryLabel,
} from "../profileDisplay";
import type { ProfileWidgetHostContext, ProfilesListAction, ProfilesListItem } from "../types";
import type {
  ProfileDetails,
  ProfilesDataProvider,
  ProfilesProviderErrorCode,
  ProviderContext,
} from "../providers/profilesDataProvider";
import { isProfilesProviderError } from "../providers/profilesDataProvider";


export type ProfilesWidgetProfileDetailCoreProps = {
  hostContext: ProfileWidgetHostContext;
  provider: ProfilesDataProvider;
  providerContext?: Omit<ProviderContext, "signal">;
  entityId: string | null;
  listItem: ProfilesListItem | null;
  listItemsForDuplicateCheck: ProfilesListItem[];
  initialCreateEntityTypeId?: string | null;
  documentEditingEnabled?: boolean;
  allowProfileDelete?: boolean;
  onAction?: (action: ProfilesListAction) => void;
  onError?: (payload: { message: string; requestId?: string; code?: string }) => void;
  onObservability?: ProfileWidgetObservabilityHandler;
  onProfileUpdatedInList?: (item: ProfilesListItem) => void;
  onListRevalidate?: () => void | Promise<void>;
  onEntityDeleted?: (entityId: string) => void;
  onCreatedSelectEntity?: (entityId: string) => void;
};

export type ProfilesWidgetProfileDetailHandle = {
  openCreate: () => void;
  closeCreate: () => void;
};

type PublishedSchemaPanelState =
  | { status: "unsupported" }
  | { status: "loading" }
  | { status: "ok"; data: Record<string, unknown> }
  | { status: "none" }
  | { status: "error"; message: string };

function publishedSchemaOkForForm(
  state: PublishedSchemaPanelState,
): state is { status: "ok"; data: Record<string, unknown> } {
  return (
    state.status === "ok" &&
    typeof state.data === "object" &&
    state.data !== null &&
    !Array.isArray(state.data)
  );
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

export const ProfilesWidgetProfileDetailCore = forwardRef<
  ProfilesWidgetProfileDetailHandle,
  ProfilesWidgetProfileDetailCoreProps
>(function ProfilesWidgetProfileDetailCore(
  {
  hostContext,
  provider,
  providerContext,
  initialCreateEntityTypeId = null,
  entityId,
  listItem,
  listItemsForDuplicateCheck,
  documentEditingEnabled = true,
  allowProfileDelete = true,
  onAction,
  onError,
  onObservability,
  onProfileUpdatedInList,
  onListRevalidate,
  onEntityDeleted,
  onCreatedSelectEntity,
}: ProfilesWidgetProfileDetailCoreProps,
  ref,
) {
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [detailsErrorMessage, setDetailsErrorMessage] = useState<string | null>(null);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Record<string, unknown> | null>(null);
  const [headVersion, setHeadVersion] = useState<number | null>(null);
  const [viewedVersion, setViewedVersion] = useState<number | null>(null);
  const [versionDetailsByNum, setVersionDetailsByNum] = useState<Record<number, ProfileDetails>>({});
  const [editMode, setEditMode] = useState(false);
  const [editDraftMode, setEditDraftMode] = useState<DraftJsonEditorMode>("form");
  const [editDraftValue, setEditDraftValue] = useState<Record<string, unknown>>({});
  const [editDraftSourceText, setEditDraftSourceText] = useState("{}");
  const [editApiIssues, setEditApiIssues] = useState<Array<{ path: string; message: string }> | null>(null);
  const [createTypeId, setCreateTypeId] = useState<string | null>(null);
  const [createProfileName, setCreateProfileName] = useState("New profile");
  const [createDraftMode, setCreateDraftMode] = useState<DraftJsonEditorMode>("form");
  const [createDraftValue, setCreateDraftValue] = useState<Record<string, unknown>>({});
  const [createDraftSourceText, setCreateDraftSourceText] = useState("{}");
  const [createApiIssues, setCreateApiIssues] = useState<Array<{ path: string; message: string }> | null>(null);
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [busyEntityId, setBusyEntityId] = useState<string | null>(null);
  const [entityTypeOptions, setEntityTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [profilePublishedSchema, setProfilePublishedSchema] = useState<PublishedSchemaPanelState>({ status: "unsupported" });
  const [createPublishedSchema, setCreatePublishedSchema] = useState<PublishedSchemaPanelState>({ status: "unsupported" });
  const [viewDocumentMode, setViewDocumentMode] = useState<DraftJsonEditorMode>("form");
  const [viewDocumentSourceText, setViewDocumentSourceText] = useState("{}");
  const profileSchemaRequestRef = useRef(0);
  const createSchemaRequestRef = useRef(0);

  const profileEditorWithForm = useMemo(
    () => Boolean(provider.getEntityTypePublishedSchema) && publishedSchemaOkForForm(profilePublishedSchema),
    [provider, profilePublishedSchema],
  );
  const createEditorWithForm = useMemo(
    () => Boolean(provider.getEntityTypePublishedSchema) && publishedSchemaOkForForm(createPublishedSchema),
    [provider, createPublishedSchema],
  );

  const requestId = hostContext.telemetry?.requestId;
  const detailsRequestIdRef = useRef(0);
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

  const selectedItem = listItem;

  const historicalView = viewedVersion !== null && headVersion !== null && viewedVersion < headVersion;

  const editDraftSaveOk = useMemo(() => {
    if (editDraftMode === "source") {
      return parseEntityTypeDraftSchemaText(editDraftSourceText).ok;
    }
    return true;
  }, [editDraftMode, editDraftSourceText]);

  const createDraftSaveOk = useMemo(() => {
    if (createDraftMode === "source") {
      return parseEntityTypeDraftSchemaText(createDraftSourceText).ok;
    }
    return true;
  }, [createDraftMode, createDraftSourceText]);

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

  const applyDetailsSnapshot = useCallback((details: ProfileDetails) => {
    setSelectedDocument(details.document);
    setHeadVersion(details.version);
    setViewedVersion(details.version);
    setEditDraftValue(structuredClone(details.document));
    setEditDraftSourceText(JSON.stringify(details.document, null, 2));
    setEditDraftMode("form");
    setEditApiIssues(null);
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
    if (!entityId) {
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
        entity_id: entityId,
      },
    });

    void provider
      .get(entityId, { ...providerContextBaseRef.current, signal: abortController.signal })
      .then(async (snapshot) => {
        if (requestIdRef !== detailsRequestIdRef.current) {
          return;
        }
        if (abortController.signal.aborted) {
          return;
        }
        applyDetailsSnapshot(snapshot);
        await loadVersionMap(entityId, snapshot, abortController.signal, requestIdRef);
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
            entity_id: entityId,
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
  }, [hostContext.tenant.id, provider, requestId, entityId, onObservability, applyDetailsSnapshot, loadVersionMap]);

  useEffect(() => {
    setCreateDraftMode("form");
  }, [createTypeId]);

  useEffect(() => {
    if (editDraftMode === "form" && !profileEditorWithForm) {
      setEditDraftMode("tree");
    }
  }, [editDraftMode, profileEditorWithForm]);

  useEffect(() => {
    if (editDraftMode === "schema" && !provider.getEntityTypePublishedSchema) {
      setEditDraftMode("form");
    }
  }, [editDraftMode, provider]);

  useEffect(() => {
    if (createDraftMode === "schema" && !provider.getEntityTypePublishedSchema) {
      setCreateDraftMode("form");
    }
  }, [createDraftMode, provider]);

  useEffect(() => {
    if (viewDocumentMode === "schema" && !provider.getEntityTypePublishedSchema) {
      setViewDocumentMode("form");
    }
  }, [viewDocumentMode, provider]);

  useEffect(() => {
    if (!selectedItem?.entityTypeId || !provider.getEntityTypePublishedSchema) {
      setProfilePublishedSchema({ status: "unsupported" });
      return;
    }
    const req = ++profileSchemaRequestRef.current;
    const abortController = new AbortController();
    setProfilePublishedSchema({ status: "loading" });
    void provider
      .getEntityTypePublishedSchema(selectedItem.entityTypeId, {
        ...providerContextBaseRef.current,
        signal: abortController.signal,
      })
      .then((doc) => {
        if (req !== profileSchemaRequestRef.current || abortController.signal.aborted) {
          return;
        }
        if (doc == null) {
          setProfilePublishedSchema({ status: "none" });
        } else {
          setProfilePublishedSchema({ status: "ok", data: doc });
        }
      })
      .catch((error) => {
        if (req !== profileSchemaRequestRef.current || abortController.signal.aborted) {
          return;
        }
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        const message = isProfilesProviderError(error) ? mapSecureMessage(error.code) : "Failed to load schema.";
        setProfilePublishedSchema({ status: "error", message });
      });
    return () => {
      abortController.abort();
    };
  }, [entityId, selectedItem?.entityTypeId, provider]);

  useEffect(() => {
    if (!createModalOpened) {
      setCreatePublishedSchema({ status: "unsupported" });
      return;
    }
    if (!createTypeId || !provider.getEntityTypePublishedSchema) {
      setCreatePublishedSchema({ status: "unsupported" });
      return;
    }
    const req = ++createSchemaRequestRef.current;
    const abortController = new AbortController();
    setCreatePublishedSchema({ status: "loading" });
    void provider
      .getEntityTypePublishedSchema(createTypeId, { ...providerContextBaseRef.current, signal: abortController.signal })
      .then((doc) => {
        if (req !== createSchemaRequestRef.current || abortController.signal.aborted) {
          return;
        }
        if (doc == null) {
          setCreatePublishedSchema({ status: "none" });
        } else {
          setCreatePublishedSchema({ status: "ok", data: doc });
        }
      })
      .catch((error) => {
        if (req !== createSchemaRequestRef.current || abortController.signal.aborted) {
          return;
        }
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        const message = isProfilesProviderError(error) ? mapSecureMessage(error.code) : "Failed to load schema.";
        setCreatePublishedSchema({ status: "error", message });
      });
    return () => {
      abortController.abort();
    };
  }, [createModalOpened, createTypeId, provider]);

  useEffect(() => {
    setViewDocumentSourceText(JSON.stringify(selectedDocument ?? {}, null, 2));
  }, [selectedDocument]);

  useEffect(() => {
    if (!entityId) {
      return;
    }
    setViewDocumentMode("form");
  }, [entityId, viewedVersion]);

  const handleOpenCreateModal = () => {
    setMutationErrorMessage(null);
    setCreateProfileName("New profile");
    setCreateDraftValue({});
    setCreateDraftSourceText("{}");
    setCreateDraftMode("form");
    setCreateApiIssues(null);
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
    let parsed: Record<string, unknown>;
    if (createDraftMode === "source") {
      const sourceParsed = parseEntityTypeDraftSchemaText(createDraftSourceText);
      if (!sourceParsed.ok) {
        setMutationErrorMessage(sourceParsed.message);
        emitProfileWidgetTelemetry(onObservability, hostContext, {
          widget: "profiles_list",
          event: "save_failed",
          meta: { operation: "create_entity_profile", phase: "validation" },
        });
        return;
      }
      parsed = sourceParsed.value;
      setCreateDraftValue(sourceParsed.value);
    } else {
      parsed = createDraftValue;
    }
    const trimmedName = createProfileName.trim();
    if (!createTypeId || !trimmedName) {
      setMutationErrorMessage("Choose entity type and profile name.");
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_failed",
        meta: { operation: "create_entity_profile", phase: "validation" },
      });
      return;
    }

    const merged: Record<string, unknown> = { ...parsed, name: trimmedName };
    if (isDuplicateProfileName(trimmedName, listItemsForDuplicateCheck, null)) {
      setMutationErrorMessage("Profile name must be unique within the loaded list.");
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_failed",
        meta: { operation: "create_entity_profile", phase: "validation" },
      });
      return;
    }

    setBusyEntityId("create");
    setCreateApiIssues(null);
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
      setCreateModalOpened(false);
      onCreatedSelectEntity?.(created.entityId);
      await onListRevalidate?.();
    } catch (error) {
      if (isProfilesProviderError(error) && error.schemaIssues?.length) {
        setCreateApiIssues(error.schemaIssues);
      } else {
        setCreateApiIssues(null);
      }
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
    if (!entityId || historicalView) {
      return;
    }
    setMutationErrorMessage(null);
    let parsed: Record<string, unknown>;
    if (editDraftMode === "source") {
      const sourceParsed = parseEntityTypeDraftSchemaText(editDraftSourceText);
      if (!sourceParsed.ok) {
        setMutationErrorMessage(sourceParsed.message);
        emitProfileWidgetTelemetry(onObservability, hostContext, {
          widget: "profiles_list",
          event: "save_failed",
          meta: { operation: "update_entity_profile", phase: "validation" },
        });
        return;
      }
      parsed = sourceParsed.value;
      setEditDraftValue(sourceParsed.value);
    } else {
      parsed = editDraftValue;
    }

    const nameFromDoc = extractProfileNameFromDocument(parsed);
    if (nameFromDoc && isDuplicateProfileName(nameFromDoc, listItemsForDuplicateCheck, entityId)) {
      setMutationErrorMessage("Profile name must be unique within the loaded list.");
      return;
    }

    setBusyEntityId(entityId);
    setEditApiIssues(null);
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "profiles_list",
      event: "save_submitted",
      meta: { operation: "update_entity_profile", entity_id: entityId },
    });

    try {
      const updated = await provider.update(
        entityId,
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
      onProfileUpdatedInList?.(updatedItem);
      applyDetailsSnapshot(updated);
      setVersionDetailsByNum({});
      onAction?.({ type: "updated", item: updatedItem });
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_succeeded",
        meta: { operation: "update_entity_profile", entity_id: updatedItem.entityId, version: updatedItem.version },
      });
      await loadVersionMap(entityId, updated, new AbortController().signal, detailsRequestIdRef.current);
    } catch (error) {
      if (isProfilesProviderError(error) && error.schemaIssues?.length) {
        setEditApiIssues(error.schemaIssues);
      } else {
        setEditApiIssues(null);
      }
      reportError(error, (message) => setMutationErrorMessage(message));
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_failed",
        meta: { operation: "update_entity_profile", phase: "api", entity_id: entityId },
      });
    } finally {
      setBusyEntityId(null);
    }
  };

  const handleSaveHistoricalAsNew = async () => {
    if (!entityId || !historicalView || !selectedDocument) {
      return;
    }
    setMutationErrorMessage(null);
    setBusyEntityId(entityId);
    emitProfileWidgetTelemetry(onObservability, hostContext, {
      widget: "profiles_list",
      event: "save_submitted",
      meta: { operation: "update_entity_profile_from_history", entity_id: entityId, from_version: viewedVersion },
    });
    try {
      const updated = await provider.update(entityId, { document: selectedDocument }, { ...providerContextBaseRef.current });
      const updatedItem: ProfilesListItem = {
        entityId: updated.entityId,
        entityTypeId: updated.entityTypeId,
        version: updated.version,
        updatedAt: updated.updatedAt,
        preview: JSON.stringify(updated.document),
      };
      onProfileUpdatedInList?.(updatedItem);
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
      await loadVersionMap(entityId, updated, new AbortController().signal, detailsRequestIdRef.current);
    } catch (error) {
      reportError(error, (message) => setMutationErrorMessage(message));
      emitProfileWidgetTelemetry(onObservability, hostContext, {
        widget: "profiles_list",
        event: "save_failed",
        meta: { operation: "update_entity_profile_from_history", phase: "api", entity_id: entityId },
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
      onEntityDeleted?.(entityId);
      await onListRevalidate?.();
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
      setEditDraftValue(structuredClone(detail.document));
      setEditDraftSourceText(JSON.stringify(detail.document, null, 2));
      setEditDraftMode("form");
      setEditApiIssues(null);
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

  useImperativeHandle(ref, () => ({
    openCreate: () => {
      handleOpenCreateModal();
    },
    closeCreate: () => {
      setCreateModalOpened(false);
    },
  }));

  const renderPublishedSchemaPanel = (state: PublishedSchemaPanelState) => {
    if (state.status === "unsupported") {
      return (
        <Text size="sm" c="dimmed" p="sm">
          Published schema is not available from this data provider.
        </Text>
      );
    }
    if (state.status === "loading") {
      return (
        <Box p="md" style={{ display: "flex", justifyContent: "center" }}>
          <Loader size="sm" />
        </Box>
      );
    }
    if (state.status === "error") {
      return (
        <Alert color="red" title="Schema">
          {state.message}
        </Alert>
      );
    }
    if (state.status === "none") {
      return (
        <Text size="sm" c="dimmed" p="sm">
          This entity type has no published schema yet.
        </Text>
      );
    }
    return (
      <Box style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <AprilJsonTreeEditor
          data={state.data}
          readOnly
          rootName="published_schema"
          validationSchema={ENTITY_TYPE_DRAFT_ROOT_JSON_SCHEMA}
          resolveValidationSchemaRefs={false}
          showSearch
        />
      </Box>
    );
  };

  return (
    <DensityProvider>
      <Stack gap="md" style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {mutationErrorMessage ? <Alert color="red">{mutationErrorMessage}</Alert> : null}

        <Stack
          data-testid="profiles-widget-detail-column"
          gap="sm"
          style={{ flex: "1 1 0%", minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          {selectedItem ? (
            <>
              <Box style={{ flexShrink: 0 }}>
                <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
                  <Stack gap={4} style={{ flex: "1 1 200px", minWidth: 0 }}>
                    <Title order={5} lineClamp={1}>
                      {displayNameForCard}
                    </Title>
                  </Stack>
                  <Group gap="xs" justify="flex-end" wrap="wrap" align="center" style={{ flexShrink: 0 }}>
                    <Select
                      aria-label="Version"
                      size="xs"
                      w={150}
                      disabled={detailsLoading || Object.keys(versionDetailsByNum).length === 0}
                      data={versionSelectData}
                      value={viewedVersion !== null ? String(viewedVersion) : null}
                      onChange={onSelectVersion}
                      rightSection={versionsLoading ? <Loader size="xs" /> : undefined}
                      comboboxProps={{ withinPortal: false }}
                    />
                    {!detailsLoading && editMode && !historicalView ? (
                      <DraftJsonEditorToolbar
                        mode={editDraftMode}
                        onModeChange={setEditDraftMode}
                        value={editDraftValue}
                        onChange={setEditDraftValue}
                        sourceText={editDraftSourceText}
                        onSourceTextChange={setEditDraftSourceText}
                        readOnly={false}
                        compact={false}
                        withFormMode={profileEditorWithForm}
                        withSchemaPanel={Boolean(provider.getEntityTypePublishedSchema)}
                      />
                    ) : null}
                    {!detailsLoading && (!editMode || historicalView) ? (
                      <DraftJsonEditorToolbar
                        mode={viewDocumentMode}
                        onModeChange={setViewDocumentMode}
                        value={selectedDocument ?? {}}
                        onChange={() => {}}
                        sourceText={viewDocumentSourceText}
                        onSourceTextChange={setViewDocumentSourceText}
                        readOnly
                        compact={false}
                        withFormMode={profileEditorWithForm}
                        withSchemaPanel={Boolean(provider.getEntityTypePublishedSchema)}
                      />
                    ) : null}
                    <Group gap={4} justify="flex-end" wrap="wrap">
                    {documentEditingEnabled && historicalView ? (
                      <Tooltip label="Save snapshot as new version (+1)">
                        <ActionIcon
                          color="teal"
                          variant="filled"
                          aria-label="Save snapshot as new version (+1)"
                          onClick={() => {
                            void handleSaveHistoricalAsNew();
                          }}
                          loading={busyEntityId === entityId}
                        >
                          <IconSparkles size={18} />
                        </ActionIcon>
                      </Tooltip>
                    ) : null}
                    {documentEditingEnabled && !historicalView && (
                      <>
                        {editMode ? (
                          <>
                            <Tooltip label="Save changes">
                              <ActionIcon
                                variant="filled"
                                aria-label="Save changes"
                                disabled={!editDraftSaveOk}
                                onClick={() => {
                                  void handleUpdate();
                                }}
                                loading={busyEntityId === entityId}
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
                                    setEditDraftValue(structuredClone(selectedDocument));
                                    setEditDraftSourceText(JSON.stringify(selectedDocument, null, 2));
                                    setEditDraftMode("form");
                                  }
                                  setEditApiIssues(null);
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
                                  setEditDraftValue(structuredClone(selectedDocument));
                                  setEditDraftSourceText(JSON.stringify(selectedDocument, null, 2));
                                  setEditDraftMode("form");
                                }
                                setEditApiIssues(null);
                              }}
                            >
                              <IconEdit size={18} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </>
                    )}
                    {allowProfileDelete ? (
                      <Tooltip label="Delete profile">
                        <ActionIcon
                          color="red"
                          variant="light"
                          aria-label="Delete profile"
                          loading={busyEntityId === entityId}
                          onClick={() => {
                            if (entityId) {
                              void handleDelete(entityId);
                            }
                          }}
                        >
                          <IconTrash size={18} />
                        </ActionIcon>
                      </Tooltip>
                    ) : null}
                    </Group>
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
                <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", minWidth: 0 }}>
                  {documentEditingEnabled && editMode && !historicalView ? (
                    <Box
                      data-testid="profiles-widget-edit-document"
                      style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
                    >
                      <EntityTypesDraftJsonEditor
                        key={`edit-doc-${entityId}-${selectedItem?.entityTypeId ?? ""}`}
                        mode={editDraftMode}
                        onModeChange={setEditDraftMode}
                        value={editDraftValue}
                        onChange={setEditDraftValue}
                        sourceText={editDraftSourceText}
                        onSourceTextChange={setEditDraftSourceText}
                        rootName="profile_document"
                        serverValidationItems={editApiIssues ?? undefined}
                        withFormMode={profileEditorWithForm}
                        rjsfSchema={
                          publishedSchemaOkForForm(profilePublishedSchema) ? profilePublishedSchema.data : undefined
                        }
                        withSchemaPanel={Boolean(provider.getEntityTypePublishedSchema)}
                        schemaPanel={
                          <Box style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                            {renderPublishedSchemaPanel(profilePublishedSchema)}
                          </Box>
                        }
                        hideModeToolbar
                      />
                    </Box>
                  ) : (
                    <Box
                      data-testid="profiles-widget-view-document"
                      style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}
                    >
                      <EntityTypesDraftJsonEditor
                        key={`view-doc-${entityId}-${viewedVersion ?? ""}-${selectedItem?.entityTypeId ?? ""}`}
                        mode={viewDocumentMode}
                        onModeChange={setViewDocumentMode}
                        value={selectedDocument ?? {}}
                        onChange={() => {}}
                        sourceText={viewDocumentSourceText}
                        onSourceTextChange={setViewDocumentSourceText}
                        readOnly
                        rootName="profile_document"
                        withFormMode={profileEditorWithForm}
                        rjsfSchema={
                          publishedSchemaOkForForm(profilePublishedSchema) ? profilePublishedSchema.data : undefined
                        }
                        withSchemaPanel={Boolean(provider.getEntityTypePublishedSchema)}
                        schemaPanel={
                          <Box style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                            {renderPublishedSchemaPanel(profilePublishedSchema)}
                          </Box>
                        }
                        hideModeToolbar
                      />
                    </Box>
                  )}
                </Box>
              )}
            </>
          ) : (
            <Alert color="gray">No profile selected (entityId is null).</Alert>
          )}
        </Stack>
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
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Document (JSON object)
            </Text>
            <Box data-testid="profiles-widget-create-document" style={{ minHeight: 220, display: "flex", flexDirection: "column" }}>
              <EntityTypesDraftJsonEditor
                key={`create-doc-${createTypeId ?? "none"}`}
                mode={createDraftMode}
                onModeChange={setCreateDraftMode}
                value={createDraftValue}
                onChange={setCreateDraftValue}
                sourceText={createDraftSourceText}
                onSourceTextChange={setCreateDraftSourceText}
                compact
                showSearch={false}
                rootName="profile_document"
                serverValidationItems={createApiIssues ?? undefined}
                withFormMode={createEditorWithForm}
                rjsfSchema={
                  publishedSchemaOkForForm(createPublishedSchema) ? createPublishedSchema.data : undefined
                }
                withSchemaPanel={Boolean(provider.getEntityTypePublishedSchema)}
                schemaPanel={
                  <Box style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                    {renderPublishedSchemaPanel(createPublishedSchema)}
                  </Box>
                }
              />
            </Box>
          </Stack>
          <Button
            onClick={() => void handleCreate()}
            loading={busyEntityId === "create"}
            disabled={!createDraftSaveOk}
          >
            Create profile
          </Button>
        </Stack>
      </Modal>
      </Stack>
    </DensityProvider>
  );
});
