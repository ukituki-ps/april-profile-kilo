# План: задача 052 — модель данных и миграции (исполнено)

- **Задача:** [`TASK.md`](./TASK.md)
- **Статус плана:** согласовано с реализацией от 2026-04-30

## Итоговая схема хранения

| Объект | Таблица | Назначение |
|--------|---------|------------|
| Семейство типа (`namespace`/`code`) | `entity_type_families` | Корневая сущность; `id` соответствует прежнему `entity_types.id` после миграции |
| Черновик схемы | `entity_type_drafts` | Одна строка на семейство; `draft_schema_json`, `draft_schema_version`, optimistic `updated_at` |
| Опубликованная ревизия | `entity_type_revisions` | Immutable строки; `revision_no` монотонен в `(tenant_id, family_id)` |
| Привязка сущности | `entities.bound_entity_type_revision_id` | FK на `(tenant_id, id)` в `entity_type_revisions` |

Legacy `entity_types` удалена после backfill и перенастройки FK.

## Перенос данных

1. Строки `entity_types` копируются в `entity_type_families` с сохранением `id`.
2. Черновики копируются в `entity_type_drafts` из `schema_json` / `schema_version`.
3. Для строк со `status = 'published'` создаётся ревизия `revision_no = GREATEST(COALESCE(published_schema_version,1), 1)` с телом из `published_schema_json` или `schema_json`.

## Инвариант миграции

При наличии `entities` без вычисленной последней опубликованной ревизии миграция падает (явная ошибка, без молча битых данных).

## Код приложения (минимально необходимый для консистентности)

Каталог `internal/entitytypes` и профили переведены на новые таблицы; создание профиля требует существования хотя бы одной ревизии у семейства.

Повторная публикация: убрано `409 already_published`; OpenAPI синхронизирован.

См. отчёт: [`REPORT.md`](./REPORT.md).
