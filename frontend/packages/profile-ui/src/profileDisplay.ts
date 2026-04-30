import type { ProfilesListItem } from "./types";

/** Читает отображаемое имя из корня документа профиля. */
export function extractProfileNameFromDocument(doc: Record<string, unknown> | null | undefined): string | undefined {
  const n = doc?.name;
  if (typeof n === "string" && n.trim()) {
    return n.trim();
  }
  const t = doc?.title;
  if (typeof t === "string" && t.trim()) {
    return t.trim();
  }
  return undefined;
}

export function tryParsePreviewDocument(preview: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(preview);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // preview может быть не JSON (строка из API).
  }
  return null;
}

export function shortenEntityIdForUi(entityId: string): string {
  return entityId.length > 14 ? `${entityId.slice(0, 8)}…${entityId.slice(-4)}` : entityId;
}

/** Заголовок строки списка: имя из документа или сокращённый id. */
export function listPrimaryLabel(item: ProfilesListItem): string {
  const fromPreview = tryParsePreviewDocument(item.preview);
  const name = extractProfileNameFromDocument(fromPreview ?? undefined);
  if (name) {
    return name;
  }
  return shortenEntityIdForUi(item.entityId);
}

/** Вторичная строка: версия (тип — в карточке деталей). */
export function listSecondaryLabel(item: ProfilesListItem): string {
  return `v${item.version}`;
}

export function isDuplicateProfileName(
  rawName: string,
  items: ProfilesListItem[],
  excludeEntityId: string | null,
): boolean {
  const normalized = rawName.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  for (const it of items) {
    if (excludeEntityId && it.entityId === excludeEntityId) {
      continue;
    }
    const parsed = tryParsePreviewDocument(it.preview);
    const existing = extractProfileNameFromDocument(parsed ?? undefined);
    if (existing && existing.trim().toLowerCase() === normalized) {
      return true;
    }
  }
  return false;
}
