---
sidebar_position: 253
---

# 058 — JSON-редакторы дизайн-системы в `profiles-widget`

## Проблема

Документ профиля (`document`) в **`ProfilesWidgetCore`** редактировался через **`Mantine Textarea`** и строковый JSON, вразрез с DS-first политикой и уже принятым стеком **057** для `entity-types-widget`.

## Что сделали

- В **`ProfilesWidgetCore`** модалка **Create** и режим **Edit** используют **`EntityTypesDraftJsonEditor`**: **`AprilJsonTreeEditor`** / **`AprilJsonCollectionTextEditor`** (режимы **Tree** и **Source**), **`AprilJsonValidationSummary`** для **`schemaIssues`** с API.
- Просмотр документа (текущая версия без Edit, в т.ч. при просмотре истории до переключения в Edit) — read-only **`AprilJsonTreeEditor`**.
- **`DensityProvider`** в корне виджета; минимальная клиентская валидация корня как **JSON object** (та же константа схемы, что в 057).
- Режим **Form** (`AprilJsonSchemaForm`) **не добавлен**: в данных **`listEntityTypes`** нет JSON Schema для документа профиля без расширения бэкенда/контракта.

## Что это даёт

- Единый UX с дизайн-системой April и с виджетом типов сущностей.
- При **422** с массивом **`issues`** пользователь видит структурированный список ошибок рядом с редактором.

## Как проверить

1. `cd frontend && npm run test -w @april/profile-ui` и при необходимости `npm run build -w @april/profile-ui`.
2. В shell-демо открыть **`ProfilesWidget`**: создать профиль — переключить Tree/Source в блоке документа; выбрать профиль → Edit → сохранить.
3. Выбрать старую версию в **Version** — документ read-only деревом; кнопка «Save snapshot as new version (+1)» без изменений по контракту.

## Границы и follow-up

- **Form по схеме типа** — при появлении схемы в API или в расширенном `EntityTypeOption`; зафиксировать правила JSON↔Form в плане задачи.

## Ссылки на артефакты

- [`tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/TASK.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/TASK.md)
- [`tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/PLAN.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/PLAN.md)
- [`tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/REPORT.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/REPORT.md)
- Карточка виджета: `docs/widgets/profile/profiles-widget.md`
