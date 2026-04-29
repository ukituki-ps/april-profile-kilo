import { ApiError, OpenAPI, ProfilesService } from "../generated";
import type { ProfileListItem, ProfileListResponse, ProfileSnapshot } from "../generated";
import type {
  CreateProfileInput,
  ProfileDetails,
  ProfilesDataProvider,
  ProfilesListPage,
  ProfilesListQuery,
  ProfilesProviderError,
  ProfilesProviderErrorCode,
  UpdateProfileInput,
} from "./profilesDataProvider";

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

const toPage = (response: ProfileListResponse): ProfilesListPage => ({
  items: response.items.map(toListItem),
  nextCursor: response.next_cursor ?? undefined,
  totalCount: response.total_count,
});

export const createOpenApiProfilesProvider = (config: OpenApiProviderConfig): ProfilesDataProvider => {
  const setup = () => {
    OpenAPI.BASE = config.apiBaseUrl;
    OpenAPI.TOKEN = config.accessToken;
  };

  return {
    async list(query: ProfilesListQuery) {
      setup();
      try {
        const response = await ProfilesService.listEntityProfiles(
          query.search,
          query.entityTypeId,
          query.limit,
          query.cursor,
          query.sort ?? "updated_desc",
        );
        return toPage(response);
      } catch (error) {
        throw toProviderError(error);
      }
    },
    async get(entityId: string) {
      setup();
      try {
        return toDetails(await ProfilesService.getEntityCurrentProfile(entityId));
      } catch (error) {
        throw toProviderError(error);
      }
    },
    async create(input: CreateProfileInput) {
      setup();
      try {
        return toDetails(
          await ProfilesService.createEntityProfile({
            entity_type_id: input.entityTypeId,
            document: input.document,
          }),
        );
      } catch (error) {
        throw toProviderError(error);
      }
    },
    async update(entityId: string, input: UpdateProfileInput) {
      setup();
      try {
        return toDetails(await ProfilesService.updateEntityProfile(entityId, { document: input.document }));
      } catch (error) {
        throw toProviderError(error);
      }
    },
    async remove(entityId: string) {
      setup();
      try {
        await ProfilesService.deleteEntityProfile(entityId);
      } catch (error) {
        throw toProviderError(error);
      }
    },
  };
};
