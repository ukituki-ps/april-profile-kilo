## 1) Итого

- Статус: ✅ выполнено
- Задача: Фаза 2 (4/4) — ABAC-фильтрация выдачи по сегментам полей
- Ветка: `feature/phase-2-abac-field-filtering`
- Коммиты: один squash-коммит на ветке (после merge в `develop` — полный hash в истории `git log`)
- PR: не создавался (локально)

## 2) Что сделано

- [backend] Пакет `internal/abac`: политика «сегмент → список realm-ролей Keycloak», фильтрация `document` и `_meta.authority` при чтении; пустой `ABAC_SEGMENT_ACCESS_JSON` — фильтрация отключена.
- [backend] GET `/v1/entities/{entityID}`, `/v1/entities/{entityID}/versions/{version}`, `/v1/external-mappings/.../entity` применяют фильтр после загрузки снимка; tenant по-прежнему только из JWT.
- [backend] Переменная `ABAC_SEGMENT_ACCESS_JSON` → поле `Config.ABACSegmentAccessJSON`, разбор в `app.Run`; при невалидном JSON — ошибка старта.
- [docs] OpenAPI: описание ABAC для GET профиля и `ProfileSnapshot`; `.env.example`; страница `docs-site/docs/task-story-013-abac-field-filtering.md`, обновлён `task-stories-overview.md`; `task_list.md`.
- [tests] Unit (`abac`, `httpapi`), интеграционный `TestABAC_GetCurrent_filtersNamespacesByJWTRealmRoles`.

## 3) Изменённые и добавленные файлы

- `internal/abac/policy.go`, `internal/abac/policy_test.go`
- `internal/config/config.go`
- `internal/app/run.go`
- `internal/httpapi/server.go`, `internal/httpapi/server_test.go`
- `internal/integrationtest/integration_test.go`
- `openapi/openapi.yaml`
- `.env.example`
- `docs-site/docs/task-story-013-abac-field-filtering.md`, `docs-site/docs/task-stories-overview.md`
- `tasks/013-phase-2-abac-field-filtering/PLAN.md`, `tasks/013-phase-2-abac-field-filtering/REPORT.md`
- `task_list.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Какие таблицы/индексы изменены: —
- Обратимость: —

## 5) Проверка качества

- Линтер: ok (openapi-lint)
- Сборка: ok (go build через тесты)
- Unit tests: ok
- Integration tests: ok (`go test -tags=integration ./...`)
- E2E / smoke: не запускались (не требовалось задачей)

Команды (фактически выполненные):

```bash
go test ./...
go vet ./...
go test -tags=integration ./...
make openapi-lint
scripts/check-openapi-compat.sh
make docs-build
```

## 6) Деплой

- Среда: нет (задача без явного деплоя)
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Health / readiness: —
- Rollback: нет

## 7) Риски и ограничения

- На стенде нужно согласовать имена realm-ролей и JSON политики; до настройки Keycloak в тестах используются фиктивные роли в JWT.
- Сегменты, не перечисленные в `ABAC_SEGMENT_ACCESS_JSON`, при включённой политике **не выдаются** (безопасный дефолт).
- `external_refs` в ответе не фильтруются (не сегменты `document`); при необходимости — отдельная задача.

## 8) Матрица роль → сегмент (пример для отчёта)

| Realm-роль (пример) | Сегменты (пример конфигурации) |
|---------------------|--------------------------------|
| `april-profile-reader` | `default`, `hr` (как в интеграционном тесте и `.env.example`) |
| `sec-role` / `april-profile-security` | `security` (по согласованию со стендом) |

Поведение при отказе: поля запрещённых сегментов **отсутствуют** в JSON (не маскируются). Пустой или отсутствующий список ролей для сегмента в политике означает, что сегмент никому не виден.

## 9) Что осталось

- [ ] Завести реальные роли и mappers в Keycloak на dev/prod и зафиксировать имена в runbook.
- [ ] При необходимости — фильтрация `external_refs` или маскирование по отдельному ADR.
