# `entity-types-widget` — каталог семейств (левая колонка)

> Сборка виджета: [`./entity-types-widget.md`](./entity-types-widget.md). Администрирование схемы и ревизий: [`./entity-types-widget-schema-admin.md`](./entity-types-widget-schema-admin.md). Вкладка Upgrade: [`./entity-types-widget-entities-upgrade.md`](./entity-types-widget-entities-upgrade.md). Host / props / callbacks: [`./entity-types-widget-integration.md`](./entity-types-widget-integration.md).

## Пользовательские сценарии

### Каталог семейств типов

- Просмотр списка семейств: ключ (`namespace` / `code`), наличие черновика, номер последней опубликованной ревизии, опционально агрегаты «сколько сущностей не на последней ревизии» (если поддержано API).
- Выбор строки переводит master–detail на панель деталей (черновик, ревизии, действия) — см. [`entity-types-widget-schema-admin.md`](./entity-types-widget-schema-admin.md).

## UI и дизайн-система

- Список семейств строится на **`CardListColumn`** из `@april/ui` (или согласованном наследнике DS) **без** самописного master–detail.
- Корень виджета использует **`DensityProvider`** (общий для списка и панелей редактирования).
- **Запрещено** обходить DS для списка (произвольные CSS-«карточки» вместо согласованных примитивов).

## Observability

- События загрузки каталога и списка: `list_*` в разрезе `widget: "entity_types"` — см. [`../../WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md) §9 и `src/observability.ts` в пакете.
- При смене выбранного семейства допустимы события загрузки деталей (`details_*`) на границе list→detail; нормативная детализация по панели схемы — в [`entity-types-widget-schema-admin.md`](./entity-types-widget-schema-admin.md).

## Связь с API

- Список семейств и создание семейства идут через REST каталога типов (`GET` / `POST /v1/entity-types` и др.) — полный перечень путей для BFF: [`../../integration/entity-types-widget-hub-handoff.md`](../../integration/entity-types-widget-hub-handoff.md).
