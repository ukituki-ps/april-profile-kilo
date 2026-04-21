---
sidebar_position: 26
---

# 012 — Authority, очередь конфликтов и аудит merge дубликатов

## Что поменялось

- **Authority по полю:** при обновлении профиля (`PUT /v1/entities/{entityID}`) учитывается опциональный `write_source` и метаданные `_meta.authority` в документе: более сильный источник побеждает; тот же источник — последняя запись перезаписывает поле без конфликта.
- **Очередь конфликтов:** при несовместимых изменениях запись попадает в таблицу `profile_field_conflicts`; список открытых — `GET /v1/admin/profile-conflicts`.
- **Ручное разрешение:** `POST /v1/admin/profile-conflicts/{conflictID}/resolve` с выбранным значением; фиксируется новая версия профиля с источником `manual` и запись в `admin_audit_log`.
- **Merge дубликатов:** `POST /v1/admin/entities/merge` (source → target), перенос external mappings, слияние документов по правилам приоритета, удаление source, аудит.
- **RBAC:** админ-маршруты требуют realm-роль из JWT, если задана переменная окружения `KEYCLOAK_ADMIN_REALM_ROLE` (рекомендуется `april-profile-admin` на стендах).

## Почему возникают конфликты

Разные интеграции (HRIS, AD, ручной API) могут предложить **разные значения одного поля**. Сервис не «молча» выбирает победителя, если приоритеты равны и источники разные: такое событие попадает в **очередь**, чтобы человек или процесс принял явное решение.

## Зачем аудит merge и resolve

Для соответствия и разборов инцидентов нужно знать **кто**, **когда** и **что** сделал при merge дубликатов или ручном разрешении. Записи пишутся в `admin_audit_log`.

## Границы задачи

Сделано по постановке 012: правила authority, очередь, API resolve/merge, аудит, OpenAPI, тесты.

Не входило: UI консоли, Temporal/AprilNflow, ABAC по полям (задача 013).

## Как проверить без чтения кода

```bash
go test ./...
go test -tags=integration ./...
go vet ./...
make openapi-lint
scripts/check-openapi-compat.sh
make docs-build
```

Дополнительно вручную (с JWT и при необходимости ролью в `realm_access.roles`):

1. Создать сущность, затем обновить с `write_source` более низкого приоритета, чем уже записанный в поле — ожидается конфликт в очереди (код ответа `409` с `authority_all_blocked`, если не применилось ни одно поле и не менялись refs).
2. Вызвать `GET /v1/admin/profile-conflicts` — видны открытые записи.
3. Вызвать resolve с телом `{"resolution": ...}` — растёт `version`, конфликт закрыт.
4. Две сущности одного типа без пересечения внешних ключей — `POST /v1/admin/entities/merge` оставляет одну сущность и след в аудите.

## Официальные артефакты

- Постановка: [`tasks/012-phase-2-authority-merge-conflicts/TASK.md`](../../tasks/012-phase-2-authority-merge-conflicts/TASK.md)
- План: [`tasks/012-phase-2-authority-merge-conflicts/PLAN.md`](../../tasks/012-phase-2-authority-merge-conflicts/PLAN.md)
- Отчёт: [`tasks/012-phase-2-authority-merge-conflicts/REPORT.md`](../../tasks/012-phase-2-authority-merge-conflicts/REPORT.md)
- Дорожная карта (родитель): [`tasks/000-full-service-aprilhub-roadmap/PLAN.md`](../../tasks/000-full-service-aprilhub-roadmap/PLAN.md)
