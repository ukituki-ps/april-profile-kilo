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

- `entity-profile-editor`
  - package: `@april/profile-ui`
  - contract: `v1`
  - status: `beta`
  - где смотреть детали: `docs/widgets/profile/entity-profile-editor.md`

## Быстрый смысл статусов

- `draft` — рано интегрировать в production-сценарии.
- `beta` — можно подключать ограниченно, требуется внимательный smoke.
- `stable` — рекомендуемый для production уровень.
- `deprecated` — готовимся к миграции по changelog.
