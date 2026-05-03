# `entity-types-widget` — сущности и апгрейд привязки ревизии

> Каталог семейств: [`./entity-types-widget-catalog-list.md`](./entity-types-widget-catalog-list.md). Сборка: [`./entity-types-widget.md`](./entity-types-widget.md). Схема и ревизии: [`./entity-types-widget-schema-admin.md`](./entity-types-widget-schema-admin.md). Host / props: [`./entity-types-widget-integration.md`](./entity-types-widget-integration.md).

## Назначение

Поверхность **Entities / Upgrade** внутри выбранного семейства типов: список профилей сущностей, привязанных к типу, фильтрация «не на latest published revision», апгрейд **одной** сущности и **пакетный** апгрейд с отчётом по элементам (если отражено в API задачи **053**).

## Пользовательские сценарии

- Выбрать семейство → вкладка **Entities / Upgrade**:
  - фильтр «не на latest published revision»;
  - апгрейд **одной** сущности;
  - **массовый** апгрейд (батч) с отчётом об ошибках по элементам (**целевое решение**: не ограничиваться только single-entity, если это отражено в API задачи **053**).

## Контракт и навигация

- Список на вкладке использует **`GET /v1/entities`** с параметрами пагинации; размер страницы задаётся пропом **`pageSize`** виджета (по умолчанию `20`) — см. [`entity-types-widget-integration.md`](./entity-types-widget-integration.md).
- **`onOpenEntity`**: `(entityId) => void` — клик по `entity_id` в таблице апгрейда для навигации host к экрану с [`profiles-widget`](./profiles-widget.md).

## Observability

- События: `upgrade_*`, `batch_upgrade_*` при `widget: "entity_types"` — [`../../WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md) §9.
- Типы `onAction`: `entity_upgrade_requested`, `entity_upgrade_succeeded`, `entity_upgrade_failed`, `batch_upgrade_completed` (агрегаты `succeeded` / `failed` / `processed`) — детали в [`entity-types-widget-integration.md`](./entity-types-widget-integration.md).

## API

- `GET /v1/entities` — список для вкладки Upgrade.
- `POST /v1/entities/{entityID}/upgrade-entity-type-revision`, `POST /v1/entities/batch-upgrade-entity-type-revision` — см. таблицу в [`../../integration/entity-types-widget-hub-handoff.md`](../../integration/entity-types-widget-hub-handoff.md).
