# Каталог профилей и виджетов

> Модель и правила ведения каталога: [`../WIDGET_DOCS_OPERATING_MODEL.md`](../WIDGET_DOCS_OPERATING_MODEL.md).

## Формат каталога

Каталог ведётся по схеме:

`profileId -> widgets[] -> contractVersion + lifecycleStatus`.

## Профили

| `profileId` | Описание | Виджеты |
|-------------|----------|---------|
| `entity-profile` | Домен профилей сущностей в AprilProfile | [`profiles-widget`](./profile/profiles-widget.md) |
| `entity-types-admin` | Администрирование каталога типов сущностей (семейство, черновики, ревизии схемы, апгрейд привязки сущностей) | [`entity-types-widget`](./profile/entity-types-widget.md) |
