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
  - где смотреть детали: `docs/widgets/profile/profiles-widget.md` (индекс), `docs/widgets/profile/profiles-widget-list.md`, `docs/widgets/profile/profiles-widget-profile-detail.md`

### `entity-types-admin`

- `entity-types-widget`
  - package: `@april/profile-ui`
  - contract: `v1`
  - status: `beta`
  - где смотреть детали: `docs/widgets/profile/entity-types-widget.md`

## Быстрый смысл статусов

- `draft` — рано интегрировать в production-сценарии.
- `beta` — можно подключать ограниченно, требуется внимательный smoke.
- `stable` — рекомендуемый для production уровень.
- `deprecated` — готовимся к миграции по changelog.
