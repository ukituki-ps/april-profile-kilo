---
sidebar_position: 8
---

# Каталог профилей и виджетов

> Канонический источник: `docs/widgets/README.md` и карточки `docs/widgets/<profileId>/<widgetId>.md`.

## Формат

Каталог ведётся по схеме:

`profileId -> widgets -> contractVersion + lifecycleStatus`.

## Текущий каталог

### `entity-profile`

- `profiles-widget`
  - package: `@april/profile-ui`
  - contract: `v1`
  - status: `beta`
  - где смотреть детали: `docs/widgets/profile/profiles-widget.md` (сборка, включая левую колонку), `docs/widgets/profile/profiles-widget-profile-detail.md` (npm-виджет детали/создания)

### `entity-types-admin`

- `entity-types-widget`
  - package: `@april/profile-ui`
  - contract: `v1`
  - status: `beta`
  - где смотреть детали: `docs/widgets/profile/entity-types-widget.md` (индекс), `docs/widgets/profile/entity-types-widget-catalog-list.md`, `docs/widgets/profile/entity-types-widget-schema-admin.md`, `docs/widgets/profile/entity-types-widget-entities-upgrade.md`, `docs/widgets/profile/entity-types-widget-integration.md`

## Быстрый смысл статусов

- `draft` — рано интегрировать в production-сценарии.
- `beta` — можно подключать ограниченно, требуется внимательный smoke.
- `stable` — рекомендуемый для production уровень.
- `deprecated` — готовимся к миграции по changelog.
