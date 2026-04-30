---
sidebar_position: 249
---

# 052 — Модель данных: семейства типов, ревизии схемы и привязка сущностей

## Проблема

Каталог типов сущностей и профили жили в модели «одна опубликованная схема на тип» без явной **immutable-истории** схем и без жёсткой привязки экземпляра сущности к конкретной опубликованной ревизии. Это мешало безопасной эволюции JSON Schema и предсказуемому апгрейду профилей при смене схемы.

## Что сделали

- Ввели доменную модель **семейство типа** (`namespace` + `code` в пределах tenant) с **черновиком** и **опубликованными ревизиями** (монотонный `revision_no`, неизменяемое тело схемы после publish).
- Привязали сущности (`entities`) к **конкретной ревизии** типа, чтобы валидация и чтение профиля опирались на согласованный снимок схемы.
- Перенесли существующие данные на новую схему через **Atlas**-миграции (без ручного расхождения со стратегией тестов репозитория).
- Зафиксировали решение в **ADR-0005** и связали с задачами 052–054 в документации.

## Что это даёт

- Продукт получает контролируемую эволюцию схем без «тихой» подмены истории.
- Команда Profile и Hub опираются на одну терминологию: семейство, черновик, ревизия, привязка сущности.

## Как проверить без чтения кода

1. Открыть [`docs/adr/0005-entity-type-revisions-and-entity-binding.md`](https://github.com/ukituki-ps/april-profile/blob/develop/docs/adr/0005-entity-type-revisions-and-entity-binding.md) и убедиться, что описаны семейство, ревизии и привязка `entity`.
2. В репозитории: `tasks/052-phase-7-entity-type-revisions-data-model-and-migrations/REPORT.md` — сводка миграций и таблиц.
3. Локально (при необходимости): `make migrate-validate` / интеграционные тесты согласно [`TESTING_STRATEGY.md`](https://github.com/ukituki-ps/april-profile/blob/develop/docs/TESTING_STRATEGY.md).

## Ссылки на артефакты

- `tasks/052-phase-7-entity-type-revisions-data-model-and-migrations/TASK.md`
- `tasks/052-phase-7-entity-type-revisions-data-model-and-migrations/PLAN.md`
- `tasks/052-phase-7-entity-type-revisions-data-model-and-migrations/REPORT.md`
- ADR: `docs/adr/0005-entity-type-revisions-and-entity-binding.md`
