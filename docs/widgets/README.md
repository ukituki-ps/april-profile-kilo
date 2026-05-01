# Каталог профилей и виджетов

> Модель и правила ведения каталога: [`../WIDGET_DOCS_OPERATING_MODEL.md`](../WIDGET_DOCS_OPERATING_MODEL.md).

## Формат каталога

Каталог ведётся по схеме:

`profileId -> widgets[] -> contractVersion + lifecycleStatus`.

## Профили

| `profileId` | Описание | Виджеты |
|-------------|----------|---------|
| `entity-profile` | Домен профилей сущностей в AprilProfile | [`profiles-widget`](./profile/profiles-widget.md) (сборка; детали: [`list`](./profile/profiles-widget-list.md), [`profile-detail`](./profile/profiles-widget-profile-detail.md)) |
| `entity-types-admin` | Администрирование каталога типов сущностей (семейство, черновики, ревизии схемы, апгрейд привязки сущностей) | [`entity-types-widget`](./profile/entity-types-widget.md) (сборка; детали: [`catalog`](./profile/entity-types-widget-catalog-list.md), [`schema-admin`](./profile/entity-types-widget-schema-admin.md), [`entities-upgrade`](./profile/entity-types-widget-entities-upgrade.md), [`integration`](./profile/entity-types-widget-integration.md)) |
