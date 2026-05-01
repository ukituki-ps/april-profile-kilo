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

/** Элемент каталога типов сущностей для Select в UI. */
export type EntityTypeOption = {
  id: string;
  label: string;
  /** Опубликованная JSON Schema документа (если пришла в ответе `GET /v1/entity-types`). */
  publishedSchema?: Record<string, unknown> | null;
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
  /** Детали валидации из тела ошибки API (например `issues` при `schema_validation_failed`). */
  schemaIssues?: Array<{ path: string; message: string }>;
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
  /** Конкретная версия профиля (если не реализовано — виджет ограничится текущей версией). */
  getByVersion?(entityId: string, version: number, ctx: ProviderContext): Promise<ProfileDetails>;
  create(input: CreateProfileInput, ctx: ProviderContext): Promise<ProfileDetails>;
  update(entityId: string, input: UpdateProfileInput, ctx: ProviderContext): Promise<ProfileDetails>;
  remove(entityId: string, ctx: ProviderContext): Promise<void>;
  /** Каталог типов для модалки создания (если не реализовано — остаётся пустой Select). */
  listEntityTypes?(ctx: ProviderContext): Promise<EntityTypeOption[]>;
  /**
   * Опубликованная JSON Schema документа профиля для типа (`GET /v1/entity-types/{id}`).
   * Возвращает `null`, если у типа ещё нет опубликованной схемы.
   */
  getEntityTypePublishedSchema?(entityTypeId: string, ctx: ProviderContext): Promise<Record<string, unknown> | null>;
}

export const isProfilesProviderError = (error: unknown): error is ProfilesProviderError => {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const candidate = error as Partial<ProfilesProviderError>;
  return typeof candidate.code === "string" && typeof candidate.message === "string";
};
