# `entity-types-widget` — схема, черновик и ревизии (панель типа)

> Каталог (левая колонка): [`./entity-types-widget-catalog-list.md`](./entity-types-widget-catalog-list.md). Сборка: [`./entity-types-widget.md`](./entity-types-widget.md). Upgrade сущностей: [`./entity-types-widget-entities-upgrade.md`](./entity-types-widget-entities-upgrade.md). Host / props: [`./entity-types-widget-integration.md`](./entity-types-widget-integration.md).

## Пользовательские сценарии

### Создание семейства и первой ревизии

- Создать семейство: задать `namespace`, `code`, начальный `draft_schema`.
- Опубликовать → появляется **ревизия 1** (immutable).

### Эволюция схемы

- Редактировать черновик (много итераций).
- Опубликовать → **новая ревизия N+1**; предыдущие ревизии остаются в истории read-only.

### Удаление и запреты

- Удаление **семейства** или **неопубликованного черновика** — только в рамках серверной политики (например нельзя удалить семейство при наличии `entities`; точные коды ошибок — в OpenAPI после реализации задачи **053**).

## Требования к UI и дизайн-системе (обязательные)

- **Запрещено** обходить дизайн-систему: самодельные модалки там, где в `@april/ui` / Mantine есть эквивалент; «временные» экраны без DS **не допускаются**.
- **Запрещены** упрощающие обходные пути: фиксированный список типов вместо server-driven API, локальное хранилище как source of truth, игнорирование optimistic concurrency, отсутствие обработки **409/422**.
- Редактор схемы (черновик): только публичные примитивы **`@april/ui` ≥ 0.1.6** — `AprilJsonTreeEditor` (дерево), `AprilJsonCollectionTextEditor` (исходный текст), `AprilJsonValidationSummary` (Ajv на клиенте и `issues` с API при 422), обёртка **`DensityProvider`**; расширение до Monaco **не** входит в контракт без отдельной задачи и согласования DS.
- Исторические **ревизии** — read-only в тех же режимах просмотра, что согласованы в задаче **057**.
- Иконки: согласованный набор (например `@tabler/icons-react`), с **a11y** (`aria-label` / tooltip).

## Observability

- События: `details_*` (загрузка выбранного семейства / черновика / ревизий), `draft_save_*`, `publish_*`, а также `onAction` с типами `family_*`, `draft_saved`, `revision_published` — см. [`../../WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md) §9 и [`entity-types-widget-integration.md`](./entity-types-widget-integration.md).

## Зависимости по API и SDK

Минимальный набор (ориентир; финал — OpenAPI после **053**):

- CRUD семейства типов (или эквивалентный набор без «дырок» для админ-потока);
- получение и сохранение **черновика** с optimistic concurrency;
- **publish** новой ревизии из черновика;
- список **ревизий** семейства (история, read-only).

Handoff с путями BFF: [`../../integration/entity-types-widget-hub-handoff.md`](../../integration/entity-types-widget-hub-handoff.md).
