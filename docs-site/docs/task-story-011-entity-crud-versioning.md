---
sidebar_position: 25
---

# 011 — CRUD сущностей и append-only версии профиля

## Что поменялось

В этом шаге появился рабочий доменный API профилей:

- создание профиля сущности через `POST /v1/entities` (первая версия `version=1`);
- обновление профиля через `PUT /v1/entities/{entityID}` с append-only записью новой версии;
- чтение текущего состояния через `GET /v1/entities/{entityID}`;
- чтение конкретной версии через `GET /v1/entities/{entityID}/versions/{version}`;
- удаление сущности через `DELETE /v1/entities/{entityID}`;
- lookup текущего профиля по внешнему ключу через `GET /v1/external-mappings/{sourceSystem}/{externalID}/entity`.

Дополнительно:

- сохранён инвариант `tenant_id` только из доверенного JWT-контекста;
- добавлена обработка конфликтов external mappings (`409`);
- OpenAPI синхронизирован с новыми endpoint'ами и схемами.

## Что такое append-only версии простыми словами

Старые версии профиля никогда не перезаписываются.

Когда данные меняются, сервис не "правит текущую строку", а создаёт новую версию:

- было `version=1` с данными на вчера;
- обновили профиль — получили `version=2`;
- при необходимости можно прочитать и `version=1`, и `version=2`.

Это полезно для аудита, разборов инцидентов и воспроизводимости "что система знала на момент X".

## Зачем это команде и бизнесу

- Есть минимальный, но рабочий CRUD-контур для дальнейших фаз.
- Историчность данных встроена сразу, без последующего "дорогого" retrofit.
- Внешние идентификаторы (`source_system + external_id`) можно стабильно связать с внутренним `entity_id`.
- Интеграции получают понятный API-контракт через OpenAPI.

## Границы задачи

Сделано в рамках 011:

- CRUD доменной сущности;
- append-only версионирование и чтение current/by-version;
- маппинг внешних ключей и поиск по нему;
- синхронизация OpenAPI и тестов.

Осознанно оставлено на follow-up:

- authority/merge и очередь конфликтов (задача 012);
- ABAC-фильтрация выдачи по полям (задача 013).

## Как проверить без чтения кода

```bash
go test ./...
go test -tags=integration ./...
go vet ./...
make openapi-lint
scripts/check-openapi-compat.sh
make docs-build
```

Что считать успехом:

1. Интеграционный тест CRUD/versioning проходит на PostgreSQL контейнере.
2. Обновление профиля увеличивает `version` и сохраняет старую версию доступной по `by-version`.
3. Lookup по external mapping возвращает тот же `entity_id`, что и current endpoint.
4. OpenAPI lint проходит без предупреждений по неоднозначным путям.

## Официальные артефакты

- Постановка: `tasks/011-phase-2-entity-crud-versioning/TASK.md`
- План: `tasks/011-phase-2-entity-crud-versioning/PLAN.md`
- Отчёт: `tasks/011-phase-2-entity-crud-versioning/REPORT.md`
