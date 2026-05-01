import type { EntityTypeListResponse, ProfileListItem, ProfileListResponse, ProfileSnapshot } from "../generated";
import type { OpenAPIConfig } from "../generated/core/OpenAPI";
import { request as openApiRequest } from "../generated/core/request";
import type {
  CreateProfileInput,
  ProfileDetails,
  ProfilesDataProvider,
  ProfilesListPage,
  ProfilesListQuery,
  ProviderContext,
  EntityTypeOption,
  UpdateProfileInput,
} from "./profilesDataProvider";
import { mapApiErrorToProfilesProviderError } from "./apiErrorMapping";

type OpenApiProviderConfig = {
  apiBaseUrl: string;
  accessToken?: string;
};

const toListItem = (item: ProfileListItem) => ({
  entityId: item.entity_id,
  entityTypeId: item.entity_type_id,
  version: item.version,
  updatedAt: item.created_at,
  preview: item.preview,
});

const toDetails = (snapshot: ProfileSnapshot): ProfileDetails => ({
  entityId: snapshot.entity_id,
  entityTypeId: snapshot.entity_type_id,
  version: snapshot.version,
  updatedAt: snapshot.created_at,
  document: snapshot.document,
});

const toPage = (response: ProfileListResponse): ProfilesListPage => ({
  items: response.items.map(toListItem),
  nextCursor: response.next_cursor ?? undefined,
  totalCount: response.total_count,
});

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
  const signal = ctx.signal;
  if (!signal) {
    return requestFactory().promise;
  }
  if (signal.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }
  // Give StrictMode cleanup a chance to abort before starting network I/O.
  await Promise.resolve();
  if (signal.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }
  const request = requestFactory();
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

export const createOpenApiProfilesProvider = (config: OpenApiProviderConfig): ProfilesDataProvider => {
  return {
    async list(query: ProfilesListQuery, ctx: ProviderContext) {
      try {
        const openApiConfig = buildConfig(config, ctx);
        const promise = openApiRequest<ProfileListResponse>(openApiConfig, {
          method: "GET",
          url: "/v1/entities",
          query: {
            search: query.search,
            entity_type_id: query.entityTypeId,
            limit: query.limit,
            cursor: query.cursor,
            sort: query.sort ?? "updated_desc",
          },
          errors: {
            401: "Unauthorized",
            403: "Forbidden",
            422: "Validation error",
            429: "Rate limit exceeded",
            500: "Internal server error",
          },
        });
        const response = await withSignal(ctx, () => ({ promise, cancel: () => promise.cancel() }));
        return toPage(response);
      } catch (error) {
        throw mapApiErrorToProfilesProviderError(error);
      }
    },
    async get(entityId: string, ctx: ProviderContext) {
      try {
        const openApiConfig = buildConfig(config, ctx);
        const promise = openApiRequest<ProfileSnapshot>(openApiConfig, {
          method: "GET",
          url: "/v1/entities/{entityID}",
          path: { entityID: entityId },
          errors: {
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not found",
          },
        });
        return toDetails(await withSignal(ctx, () => ({ promise, cancel: () => promise.cancel() })));
      } catch (error) {
        throw mapApiErrorToProfilesProviderError(error);
      }
    },
    async getByVersion(entityId: string, version: number, ctx: ProviderContext) {
      try {
        const openApiConfig = buildConfig(config, ctx);
        const promise = openApiRequest<ProfileSnapshot>(openApiConfig, {
          method: "GET",
          url: "/v1/entities/{entityID}/versions/{version}",
          path: { entityID: entityId, version },
          errors: {
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not found",
          },
        });
        return toDetails(await withSignal(ctx, () => ({ promise, cancel: () => promise.cancel() })));
      } catch (error) {
        throw mapApiErrorToProfilesProviderError(error);
      }
    },
    async listEntityTypes(ctx: ProviderContext) {
      try {
        const openApiConfig = buildConfig(config, ctx);
        const promise = openApiRequest<EntityTypeListResponse>(openApiConfig, {
          method: "GET",
          url: "/v1/entity-types",
          errors: {
            401: "Unauthorized",
            403: "Forbidden",
          },
        });
        const response = await withSignal(ctx, () => ({ promise, cancel: () => promise.cancel() }));
        const items: EntityTypeOption[] = response.items.map((row) => ({
          id: row.id,
          label: `${row.namespace}/${row.code}`,
        }));
        return items;
      } catch (error) {
        throw mapApiErrorToProfilesProviderError(error);
      }
    },
    async create(input: CreateProfileInput, ctx: ProviderContext) {
      try {
        const openApiConfig = buildConfig(config, ctx);
        const promise = openApiRequest<ProfileSnapshot>(openApiConfig, {
          method: "POST",
          url: "/v1/entities",
          mediaType: "application/json",
          body: {
            entity_type_id: input.entityTypeId,
            document: input.document,
          },
          errors: {
            400: "Invalid payload",
            401: "Unauthorized",
            403: "Forbidden",
            404: "Type not found",
            409: "Conflict",
          },
        });
        return toDetails(await withSignal(ctx, () => ({ promise, cancel: () => promise.cancel() })));
      } catch (error) {
        throw mapApiErrorToProfilesProviderError(error);
      }
    },
    async update(entityId: string, input: UpdateProfileInput, ctx: ProviderContext) {
      try {
        // API contract currently does not accept expectedVersion; keep field in UI contract for forward compatibility.
        void input.expectedVersion;
        const openApiConfig = buildConfig(config, ctx);
        const promise = openApiRequest<ProfileSnapshot>(openApiConfig, {
          method: "PUT",
          url: "/v1/entities/{entityID}",
          path: { entityID: entityId },
          mediaType: "application/json",
          body: { document: input.document },
          errors: {
            400: "Invalid payload",
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not found",
            409: "Conflict",
          },
        });
        return toDetails(await withSignal(ctx, () => ({ promise, cancel: () => promise.cancel() })));
      } catch (error) {
        throw mapApiErrorToProfilesProviderError(error);
      }
    },
    async remove(entityId: string, ctx: ProviderContext) {
      try {
        const openApiConfig = buildConfig(config, ctx);
        const promise = openApiRequest<void>(openApiConfig, {
          method: "DELETE",
          url: "/v1/entities/{entityID}",
          path: { entityID: entityId },
          errors: {
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not found",
          },
        });
        await withSignal(ctx, () => ({ promise, cancel: () => promise.cancel() }));
      } catch (error) {
        throw mapApiErrorToProfilesProviderError(error);
      }
    },
  };
};
