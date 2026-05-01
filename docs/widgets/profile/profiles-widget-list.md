# `profiles-widget` — поверхность списка (левая колонка)

> Сборка master–detail и точка входа по виджету: [`./profiles-widget.md`](./profiles-widget.md). Правая колонка (карточка, версии, документ): [`./profiles-widget-profile-detail.md`](./profiles-widget-profile-detail.md).

## Назначение

Левая колонка даёт **server-driven** список профилей сущностей: поиск, фильтр по типу сущности, курсорная пагинация, детерминированная сортировка. Строка показывает отображаемое имя (из `document.name` через `preview` / согласованное поле API), версию и идентификаторы, необходимые для выбора. Контейнер списка участвует в общем `flex`-layout виджета (`CardListColumn`); при повторной подгрузке списка не требуется полноэкранный лоадер, если список уже отображался (поведение согласовано с `ProfilesWidgetCore`).

## Контракт данных списка

- Источник списка **только** через provider/API: `GET /v1/entities` с query-параметрами. Входной проп **`entityIds`** как source of truth **не поддерживается** (см. ограничения ниже).
- Параметры списка со стороны host (через фасад виджета): `pageSize`, `initialSearch`, `initialTypeId`, `initialSort`, `autoSelectFirst` — см. общий обзор props в [`./profiles-widget.md`](./profiles-widget.md) и тип `ProfilesWidgetProps` в пакете.

### `GET /v1/entities` (task 043)

- Query:
  - `search` — поиск по `entity_id` и текстовому содержимому текущего `document`;
  - `entity_type_id` — фильтр по типу;
  - `limit` — размер страницы (`1..100`);
  - `cursor` — непрозрачный курсор следующей страницы;
  - `sort` — `updated_desc` / `updated_asc` (детерминированный порядок).
- Ответ:
  - `items[]` (`entity_id`, `entity_type_id`, `version`, `created_at`, `preview`);
  - `next_cursor` (`null` на конце списка);
  - `total_count`.
- Ошибки: `401/403/422/429/500` в envelope `code`, `message`, `request_id`.

## UI и дизайн-система

- Список строится на **`CardListColumn`** из `@april/ui` (≥ **0.1.6**); корень виджета оборачивается в **`DensityProvider`** (общий для всего виджета — см. также карточку деталей).
- Уникальность **`document.name`**: клиентская проверка возможна **только** по уже загруженной странице списка; финальная уникальность — на сервере, когда контракт это отразит.

## Observability

- Корреляция: [`../../WIDGET_OBSERVABILITY_GUIDE.md`](../../WIDGET_OBSERVABILITY_GUIDE.md).
- События, относящиеся к списку: `list_requested`, `list_succeeded`, `list_failed` (и общий `view_loaded` при первом показе); поле `widget` = `profiles_list` — см. [`../../WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md).

## Ограничения и anti-patterns

- Нельзя использовать **`entityIds`** как источник истины для списка.
- Нельзя подменять server-side пагинацию **полной** client-side выборкой или имитацией «всех» строк.

## Связанные задачи

- Контракт list API и SDK: [`../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/TASK.md`](../../../tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/TASK.md).
