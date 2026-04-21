# План: Фаза 2 (часть 3) — authority/merge, очередь конфликтов и аудит

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-21
- **Статус плана:** согласован с реализацией

## Исходные допущения

- Источники authority задаются строкой `write_source` в create/update; приоритеты — встроенная таблица в коде (временная политика до внешних authority).
- Тот же `write_source`, что уже в `_meta.authority` для поля, означает «тот же источник» → перезапись без конфликта; конфликт — разные источники с несовместимыми приоритетами/значениями.
- Админ-эндпоинты защищены опциональной realm-ролью `KEYCLOAK_ADMIN_REALM_ROLE` (пусто = только для dev, не для prod).

## Порядок работ (шаги)

1. Миграции Atlas: `profile_field_conflicts`, `admin_audit_log`.
2. Логика flatten/unflatten документа и `_meta.authority` по путям `namespace/field`.
3. `applyAuthorityToDocuments` при update; очередь конфликтов; merge дубликатов + аудит.
4. JWT: `realm_access.roles`, middleware `RequireRealmRole`.
5. HTTP `/v1/admin/*`, OpenAPI, тесты, docs-site, отчёт.

## Затрагиваемые области

| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | `internal/profiles/*`, `internal/auth/*`, `internal/httpapi`, `internal/app`, `internal/config` |
| БД / Atlas | Новая миграция, `atlas.sum` |
| Документация / OpenAPI | `openapi/openapi.yaml`, docs-site история задачи |

## Риски и откат

- **Риск:** изменение семантики `PUT /v1/entities/{id}` с полной подмены документа на merge по полям → **Митигация:** merge только по ключам из тела; остальные поля сохраняются; для одного `write_source` — перезапись.
- Откат: откат миграции по политике Atlas/бэкап; откат кода через revert PR.

## Проверка после выполнения

- Команды из `TASK.md`; smoke: список конфликтов и merge под JWT с ролью при `KEYCLOAK_ADMIN_REALM_ROLE` задан.

## Примечания

- Отложено: уведомления, UI консоли, внешние движки workflow (см. `TASK.md`).
