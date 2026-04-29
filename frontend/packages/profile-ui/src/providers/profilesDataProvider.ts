import type { ProfilesListItem } from "../types";

export type ProfilesListSort = "updated_desc" | "updated_asc";

export type ProfilesListQuery = {
  search?: string;
  entityTypeId?: string;
  limit: number;
  cursor?: string;
  sort?: ProfilesListSort;
};

export type ProfilesListPage = {
  items: ProfilesListItem[];
  nextCursor?: string;
  totalCount: number;
};

export type ProfileDetails = {
  entityId: string;
  entityTypeId: string;
  version: number;
  updatedAt: string;
  document: Record<string, unknown>;
};

export type CreateProfileInput = {
  entityTypeId: string;
  document: Record<string, unknown>;
};

export type UpdateProfileInput = {
  document: Record<string, unknown>;
  expectedVersion?: number;
};

export type ProfilesProviderErrorCode =
  | "unauthorized"
  | "forbidden"
  | "conflict"
  | "not_found"
  | "validation"
  | "rate_limited"
  | "network"
  | "unknown";

export type ProfilesProviderError = {
  code: ProfilesProviderErrorCode;
  message: string;
  requestId?: string;
  status?: number;
  retryable?: boolean;
};

export type ProviderContext = {
  tenantId: string;
  auth?: {
    accessToken?: string;
    subject?: string;
    roles?: string[];
  };
  telemetry?: {
    requestId?: string;
    correlationId?: string;
  };
  signal?: AbortSignal;
};

export interface ProfilesDataProvider {
  list(query: ProfilesListQuery, ctx: ProviderContext): Promise<ProfilesListPage>;
  get(entityId: string, ctx: ProviderContext): Promise<ProfileDetails>;
  create(input: CreateProfileInput, ctx: ProviderContext): Promise<ProfileDetails>;
  update(entityId: string, input: UpdateProfileInput, ctx: ProviderContext): Promise<ProfileDetails>;
  remove(entityId: string, ctx: ProviderContext): Promise<void>;
}

export const isProfilesProviderError = (error: unknown): error is ProfilesProviderError => {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const candidate = error as Partial<ProfilesProviderError>;
  return typeof candidate.code === "string" && typeof candidate.message === "string";
};
