## 1) Итого
- Статус: ✅ выполнено
- Задача: Фаза 2 (часть 3) — authority/merge, очередь конфликтов и аудит merge дубликатов
- Ветка: `feature/phase-2-authority-merge-conflicts`
- Коммиты: `6359dc4`
- PR: не создавался

## 2) Что сделано
- [backend] Миграция Atlas: таблицы `profile_field_conflicts` (очередь) и `admin_audit_log` (аудит merge/resolve). Логика authority: `_meta.authority` по путям `namespace/field`, приоритеты источников, перезапись при том же `write_source`, конфликт при несовместимых разных источниках. `PUT /v1/entities/{id}` с опциональным `write_source`; merge по ключам тела запроса. Админ-API: `GET /v1/admin/profile-conflicts`, `POST /v1/admin/profile-conflicts/{id}/resolve`, `POST /v1/admin/entities/merge`. JWT: извлечение `realm_access.roles`, middleware `RequireRealmRole`, конфиг `KEYCLOAK_ADMIN_REALM_ROLE`.
- [frontend] Не затрагивался.
- [infra / compose / nginx] Не затрагивались.
- [docs] OpenAPI 0.2.0, страница `docs-site/docs/task-story-012-authority-merge-conflicts.md`, обновлён `task-stories-overview.md`, `task_list.md`, `PLAN.md`, `TASK.md` (критерии).

## 3) Изменённые файлы
- `atlas/migrations/20260422120000_authority_conflicts_audit.sql`, `atlas/migrations/atlas.sum`
- `internal/auth/principal.go`, `internal/auth/jwt.go`, `internal/auth/jwt_test.go`, `internal/auth/middleware.go` (удалён `context.go` — заменён на Principal)
- `internal/config/config.go`, `internal/app/run.go`
- `internal/profiles/*.go` (authority, merge, admin, helpers, тесты)
- `internal/httpapi/server.go`, `internal/httpapi/server_test.go`
- `internal/integrationtest/integration_test.go`
- `openapi/openapi.yaml`, `.env.example`
- `docs-site/docs/task-story-012-authority-merge-conflicts.md`, `docs-site/docs/task-stories-overview.md`
- `tasks/012-phase-2-authority-merge-conflicts/TASK.md`, `PLAN.md`, `REPORT.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: **добавлены**
- Таблицы: `profile_field_conflicts` (индексы по tenant/status и tenant/entity), `admin_audit_log` (индекс по tenant, created_at)
- Обратимость: откат миграции по процедуре Atlas/бэкап БД (данные конфликтов и аудита теряются при `DROP`)

## 5) Проверка качества
- Линтер: ok (`make openapi-lint`)
- Сборка: ok (`make docs-build`, `go build ./...`)
- Unit tests: ok (`go test ./...`, включая `internal/profiles`)
- Integration tests: ok (`go test -tags=integration ./...`)
- E2E / smoke: не запускались (не требовались задачей)

Команды (фактически выполненные):
```bash
go test ./...
go test -tags=integration ./...
go vet ./...
make openapi-lint
make migrate-validate
make docs-build
```

## 6) Деплой
- Среда: нет (задача не требовала деплоя на dev)
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялись
- Health / readiness: не проверялись на стенде
- Rollback: нет

## 7) Риски и ограничения
- Семантика `PUT` изменена на **merge по полям**, присутствующим в теле; поля не в теле сохраняются. Клиенты, ожидавшие полную замену документа одним запросом, должны передавать полный снимок полей.
- Политика приоритетов источников зашита в код (`sourcePriority`); внешняя конфигурация — в отложенных интеграциях.
- Пустой `KEYCLOAK_ADMIN_REALM_ROLE` отключает проверку realm-роли на `/v1/admin/*` (удобно локально, **не** для production без gateway-ограничений).

## 8) Матрица authority (кратко)
| Условие | Итог |
|--------|------|
| Тот же `write_source`, что в `_meta.authority` для поля | Новое значение применяется (перезапись) |
| `priority(incoming) > priority(existing)` | Применяется входящее |
| `priority(incoming) < priority(existing)` | Конфликт в очередь, поле не меняется |
| Равный приоритет, разные источники, разные значения | Конфликт в очередь |
| Ручной resolve | Значение из API, источник `manual` (высший приоритет) |
| Merge дубликатов | По полю побеждает более высокий приоритет; при равенстве остаётся target |

## 9) Примеры аудита
- `action=resolve_conflict`: `entity_id`, `conflict_id` в payload/колонках, `actor_sub` из JWT.
- `action=merge_profiles`: `entity_id`=target, `related_entity_id`=source, payload с `target_version`.

## 10) Отложенные интеграции
- Внешние каталоги authority и динамическая матрица приоритетов (сейчас таблица в коде).
- Уведомления и UI консоли разрешения конфликтов.

## 11) Что осталось
- [ ] Настроить в Keycloak realm-роль `april-profile-admin` (или иное имя) и `KEYCLOAK_ADMIN_REALM_ROLE` на стендах.
- [ ] Задача 013 (ABAC по полям) поверх этой модели.
