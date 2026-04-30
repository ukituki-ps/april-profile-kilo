import { ApiError } from "../generated";
import type { EntityType } from "../generated/models/EntityType";
import type { EntityTypeRevision } from "../generated/models/EntityTypeRevision";
import type { OpenAPIConfig } from "../generated/core/OpenAPI";
import { request as openApiRequest } from "../generated/core/request";
import type {
  ProfileDetails,
  ProfilesListPage,
  ProfilesProviderError,
  ProfilesProviderErrorCode,
  ProviderContext,
} from "./profilesDataProvider";
import type {
  BatchUpgradeInput,
  BatchUpgradeResult,
  CreateEntityTypeFamilyInput,
  EntityTypeFamilyDetail,
  EntityTypeFamilySummary,
  EntityTypeRevisionRow,
  EntityTypesDataProvider,
  PatchEntityTypeFamilyInput,
  SaveDraftInput,
  UpgradeBindingInput,
} from "./entityTypesDataProvider";

type OpenApiProviderConfig = {
  apiBaseUrl: string;
  accessToken?: string;
};

const statusToCode = (status: number): ProfilesProviderErrorCode => {
  if (status === 401) {
    return "unauthorized";
  }
  if (status === 403) {
    return "forbidden";
  }
  if (status === 404) {
    return "not_found";
  }
  if (status === 409) {
    return "conflict";
  }
  if (status === 422 || status === 400) {
    return "validation";
  }
  if (status === 429) {
    return "rate_limited";
  }
  return "unknown";
};

const toProviderError = (error: unknown): ProfilesProviderError => {
  if (error instanceof ApiError) {
    const body = error.body as { request_id?: string; message?: string } | undefined;
    return {
      code: statusToCode(error.status),
      message: body?.message ?? error.message,
      requestId: body?.request_id,
      status: error.status,
      retryable: error.status >= 500 || error.status === 429,
    };
  }
  if (error instanceof TypeError) {
    return { code: "network", message: "Network error", retryable: true };
  }
  return { code: "unknown", message: "Unknown API error" };
};

const buildConfig = (config: OpenApiProviderConfig, ctx: ProviderContext): OpenAPIConfig => ({
  BASE: config.apiBaseUrl,
  VERSION: "0.2.0",
  WITH_CREDENTIALS: false,
  CREDENTIALS: "include",
  TOKEN: ctx.auth?.accessToken ?? config.accessToken,
  USERNAME: undefined,
  PASSWORD: undefined,
  HEADERS: undefined,
  ENCODE_PATH: undefined,
});

const withSignal = async <T>(
  ctx: ProviderContext,
  requestFactory: () => { promise: Promise<T>; cancel?: () => void },
): Promise<T> => {
  const request = requestFactory();
  const signal = ctx.signal;
  if (!signal) {
    return request.promise;
  }
  if (signal.aborted) {
    request.cancel?.();
    throw new DOMException("The operation was aborted.", "AbortError");
  }
  const abortHandler = () => {
    request.cancel?.();
  };
  signal.addEventListener("abort", abortHandler);
  try {
    return await request.promise;
  } finally {
    signal.removeEventListener("abort", abortHandler);
  }
};

const mapEntityType = (row: EntityType): EntityTypeFamilySummary => ({
  id: row.id,
  namespace: row.namespace,
  code: row.code,
  status: row.status,
  draftSchemaVersion: row.draft_schema_version,
  publishedSchemaVersion: row.published_schema_version ?? null,
});

const mapEntityTypeDetail = (row: EntityType): EntityTypeFamilyDetail => ({
  ...mapEntityType(row),
  draftSchema: (row.draft_schema ?? {}) as Record<string, unknown>,
  publishedSchema: (row.published_schema ?? null) as Record<string, unknown> | null,
  createdAt: row.created_at,
  publishedAt: row.published_at ?? null,
});

const mapRevision = (row: EntityTypeRevision): EntityTypeRevisionRow => ({
  id: row.id,
  familyId: row.family_id,
  revisionNo: row.revision_no,
  schema: (row.schema ?? {}) as Record<string, unknown>,
  publishedAt: row.published_at,
});

const toProfileDetails = (snapshot: {
  entity_id: string;
  entity_type_id: string;
  version: number;
  document: Record<string, unknown>;
  created_at: string;
}): ProfileDetails => ({
  entityId: snapshot.entity_id,
  entityTypeId: snapshot.entity_type_id,
  version: snapshot.version,
  updatedAt: snapshot.created_at,
  document: snapshot.document,
});

export const createOpenApiEntityTypesProvider = (config: OpenApiProviderConfig): EntityTypesDataProvider => {
  return {
    async listFamilies(ctx: ProviderContext) {
      try {
        const openApiConfig = buildConfig(config, ctx);
        const promise = openApiRequest<{ items: EntityType[] }>(openApiConfig, {
          method: "GET",
          url: "/v1/entity-types",
          errors: {
            401: "Unauthorized",
            403: "Forbidden",
          },
        });
        const response = await withSignal(ctx, () => ({ promise, cancel: () => promise.cancel() }));
        return response.items.map(mapEntityType);
      } catch (error) {
        throw toProviderError(error);
      }
    },
    async getFamily(id, ctx) {
      try {
        const openApiConfig = buildConfig(config, ctx);
        const promise = openApiRequest<EntityType>(openApiConfig, {
          method: "GET",
          url: "/v1/entity-types/{entityTypeID}",
          path: { entityTypeID: id },
          errors: {
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not found",
          },
        });
        return mapEntityTypeDetail(await withSignal(ctx, () => ({ promise, cancel: () => promise.cancel() })));
      } catch (error) {
        throw toProviderError(error);
      }
    },
    async createFamily(input, ctx) {
      try {
        const openApiConfig = buildConfig(config, ctx);
        const promise = openApiRequest<EntityType>(openApiConfig, {
          method: "POST",
          url: "/v1/entity-types",
          mediaType: "application/json",
          body: {
            namespace: input.namespace,
            code: input.code,
            draft_schema: input.draftSchema,
          },
          errors: {
            400: "Bad request",
            401: "Unauthorized",
            403: "Forbidden",
          },
        });
        return mapEntityTypeDetail(await withSignal(ctx, () => ({ promise, cancel: () => promise.cancel() })));
      } catch (error) {
        throw toProviderError(error);
      }
    },
    async patchFamily(id, input, ctx) {
      try {
        const openApiConfig = buildConfig(config, ctx);
        const promise = openApiRequest<EntityType>(openApiConfig, {
          method: "PATCH",
          url: "/v1/entity-types/{entityTypeID}",
          path: { entityTypeID: id },
          mediaType: "application/json",
          body: { namespace: input.namespace, code: input.code },
          errors: {
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not found",
            409: "Conflict",
          },
        });
        return mapEntityTypeDetail(await withSignal(ctx, () => ({ promise, cancel: () => promise.cancel() })));
      } catch (error) {
        throw toProviderError(error);
      }
    },
    async deleteFamily(id, ctx) {
      try {
        const openApiConfig = buildConfig(config, ctx);
        const promise = openApiRequest<void>(openApiConfig, {
          method: "DELETE",
          url: "/v1/entity-types/{entityTypeID}",
          path: { entityTypeID: id },
          errors: {
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not found",
            409: "Conflict",
          },
        });
        await withSignal(ctx, () => ({ promise, cancel: () => promise.cancel() }));
      } catch (error) {
        throw toProviderError(error);
      }
    },
    async saveDraft(id, input, ctx) {
      try {
        const openApiConfig = buildConfig(config, ctx);
        const promise = openApiRequest<EntityType>(openApiConfig, {
          method: "PUT",
          url: "/v1/entity-types/{entityTypeID}/draft",
          path: { entityTypeID: id },
          mediaType: "application/json",
          body: {
            draft_schema: input.draftSchema,
            if_draft_schema_version: input.ifDraftSchemaVersion,
          },
          errors: {
            400: "Bad request",
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not found",
            409: "Conflict",
          },
        });
        return mapEntityTypeDetail(await withSignal(ctx, () => ({ promise, cancel: () => promise.cancel() })));
      } catch (error) {
        throw toProviderError(error);
      }
    },
    async publishDraft(id, ctx) {
      try {
        const openApiConfig = buildConfig(config, ctx);
        const promise = openApiRequest<EntityType>(openApiConfig, {
          method: "POST",
          url: "/v1/entity-types/{entityTypeID}/publish",
          path: { entityTypeID: id },
          errors: {
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not found",
            422: "Validation",
          },
        });
        return mapEntityTypeDetail(await withSignal(ctx, () => ({ promise, cancel: () => promise.cancel() })));
      } catch (error) {
        throw toProviderError(error);
      }
    },
    async listRevisions(familyId, ctx) {
      try {
        const openApiConfig = buildConfig(config, ctx);
        const promise = openApiRequest<{ items: EntityTypeRevision[] }>(openApiConfig, {
          method: "GET",
          url: "/v1/entity-types/{entityTypeID}/revisions",
          path: { entityTypeID: familyId },
          errors: {
            401: "Unauthorized",
            403: "Forbidden",
          },
        });
        const response = await withSignal(ctx, () => ({ promise, cancel: () => promise.cancel() }));
        return response.items.map(mapRevision);
      } catch (error) {
        throw toProviderError(error);
      }
    },
    async listProfilesForType(entityTypeId, query, ctx) {
      try {
        const openApiConfig = buildConfig(config, ctx);
        const promise = openApiRequest<{
          items: Array<{
            entity_id: string;
            entity_type_id: string;
            version: number;
            created_at: string;
            preview: string;
          }>;
          next_cursor?: string;
          total_count: number;
        }>(openApiConfig, {
          method: "GET",
          url: "/v1/entities",
          query: {
            search: query.search,
            entity_type_id: entityTypeId,
            limit: query.limit,
            cursor: query.cursor,
            sort: query.sort ?? "updated_desc",
          },
          errors: {
            401: "Unauthorized",
            403: "Forbidden",
            422: "Validation",
            429: "Rate limit",
            500: "Server error",
          },
        });
        const response = await withSignal(ctx, () => ({ promise, cancel: () => promise.cancel() }));
        const page: ProfilesListPage = {
          items: response.items.map((item) => ({
            entityId: item.entity_id,
            entityTypeId: item.entity_type_id,
            version: item.version,
            updatedAt: item.created_at,
            preview: item.preview,
          })),
          nextCursor: response.next_cursor ?? undefined,
          totalCount: response.total_count,
        };
        return page;
      } catch (error) {
        throw toProviderError(error);
      }
    },
    async upgradeEntityProfileBinding(entityId, input, ctx) {
      try {
        const openApiConfig = buildConfig(config, ctx);
        const body =
          input && (input.entityTypeRevisionId !== undefined || input.revisionNo !== undefined)
            ? {
                entity_type_revision_id: input.entityTypeRevisionId,
                revision_no: input.revisionNo,
              }
            : undefined;
        const promise = openApiRequest<{
          entity_id: string;
          entity_type_id: string;
          version: number;
          document: Record<string, unknown>;
          created_at: string;
        }>(openApiConfig, {
          method: "POST",
          url: "/v1/entities/{entityID}/upgrade-entity-type-revision",
          path: { entityID: entityId },
          mediaType: "application/json",
          body,
          errors: {
            400: "Bad request",
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not found",
            422: "Validation",
          },
        });
        return toProfileDetails(await withSignal(ctx, () => ({ promise, cancel: () => promise.cancel() })));
      } catch (error) {
        throw toProviderError(error);
      }
    },
    async batchUpgradeEntityBindings(input, ctx) {
      try {
        const openApiConfig = buildConfig(config, ctx);
        const promise = openApiRequest<{
          processed: number;
          succeeded: number;
          failed: number;
          idempotency_key?: string;
          results: Array<{
            entity_id: string;
            ok: boolean;
            code?: string;
            message?: string;
            profile_version?: number;
          }>;
        }>(openApiConfig, {
          method: "POST",
          url: "/v1/entities/batch-upgrade-entity-type-revision",
          mediaType: "application/json",
          body: {
            entity_type_id: input.entityTypeId,
            target_entity_type_revision_id: input.targetEntityTypeRevisionId,
            target_revision_no: input.targetRevisionNo,
            entity_ids: input.entityIds,
            only_behind_latest: input.onlyBehindLatest,
            limit: input.limit,
            idempotency_key: input.idempotencyKey,
          },
          errors: {
            400: "Bad request",
            401: "Unauthorized",
            403: "Forbidden",
          },
        });
        const response = await withSignal(ctx, () => ({ promise, cancel: () => promise.cancel() }));
        const result: BatchUpgradeResult = {
          processed: response.processed,
          succeeded: response.succeeded,
          failed: response.failed,
          idempotencyKey: response.idempotency_key,
          results: response.results.map((row) => ({
            entityId: row.entity_id,
            ok: row.ok,
            code: row.code,
            message: row.message,
            profileVersion: row.profile_version,
          })),
        };
        return result;
      } catch (error) {
        throw toProviderError(error);
      }
    },
  };
};
