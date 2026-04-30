import type {
  ProfileDetails,
  ProfilesListPage,
  ProfilesListSort,
  ProviderContext,
} from "./profilesDataProvider";
import { isProfilesProviderError } from "./profilesDataProvider";

export type EntityTypeFamilySummary = {
  id: string;
  namespace: string;
  code: string;
  status: "draft" | "published";
  draftSchemaVersion: number;
  publishedSchemaVersion: number | null;
};

export type EntityTypeFamilyDetail = EntityTypeFamilySummary & {
  draftSchema: Record<string, unknown>;
  publishedSchema: Record<string, unknown> | null;
  createdAt: string;
  publishedAt: string | null;
};

export type EntityTypeRevisionRow = {
  id: string;
  familyId: string;
  revisionNo: number;
  schema: Record<string, unknown>;
  publishedAt: string;
};

export type CreateEntityTypeFamilyInput = {
  namespace: string;
  code: string;
  draftSchema: Record<string, unknown>;
};

export type PatchEntityTypeFamilyInput = {
  namespace: string;
  code: string;
};

export type SaveDraftInput = {
  draftSchema: Record<string, unknown>;
  ifDraftSchemaVersion: number;
};

/** Тело апгрейда привязки: пусто — на последнюю опубликованную ревизию семейства. */
export type UpgradeBindingInput = {
  entityTypeRevisionId?: string;
  revisionNo?: number;
};

export type BatchUpgradeInput = {
  entityTypeId: string;
  targetEntityTypeRevisionId?: string;
  targetRevisionNo?: number;
  entityIds?: string[];
  onlyBehindLatest?: boolean;
  limit?: number;
  idempotencyKey?: string;
};

export type BatchUpgradeResultRow = {
  entityId: string;
  ok: boolean;
  code?: string;
  message?: string;
  profileVersion?: number;
};

export type BatchUpgradeResult = {
  processed: number;
  succeeded: number;
  failed: number;
  idempotencyKey?: string;
  results: BatchUpgradeResultRow[];
};

export interface EntityTypesDataProvider {
  listFamilies(ctx: ProviderContext): Promise<EntityTypeFamilySummary[]>;
  getFamily(id: string, ctx: ProviderContext): Promise<EntityTypeFamilyDetail>;
  createFamily(input: CreateEntityTypeFamilyInput, ctx: ProviderContext): Promise<EntityTypeFamilyDetail>;
  patchFamily(id: string, input: PatchEntityTypeFamilyInput, ctx: ProviderContext): Promise<EntityTypeFamilyDetail>;
  deleteFamily(id: string, ctx: ProviderContext): Promise<void>;
  saveDraft(id: string, input: SaveDraftInput, ctx: ProviderContext): Promise<EntityTypeFamilyDetail>;
  publishDraft(id: string, ctx: ProviderContext): Promise<EntityTypeFamilyDetail>;
  listRevisions(familyId: string, ctx: ProviderContext): Promise<EntityTypeRevisionRow[]>;
  listProfilesForType(
    entityTypeId: string,
    query: { search?: string; limit: number; cursor?: string; sort?: ProfilesListSort },
    ctx: ProviderContext,
  ): Promise<ProfilesListPage>;
  upgradeEntityProfileBinding(
    entityId: string,
    input: UpgradeBindingInput | undefined,
    ctx: ProviderContext,
  ): Promise<ProfileDetails>;
  batchUpgradeEntityBindings(input: BatchUpgradeInput, ctx: ProviderContext): Promise<BatchUpgradeResult>;
}

export const isEntityTypesProviderError = isProfilesProviderError;
