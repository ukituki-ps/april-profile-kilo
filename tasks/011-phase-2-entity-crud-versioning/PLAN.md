# План: Фаза 2 (часть 2) — CRUD сущности и append-only версии профиля

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-21
- **Статус плана:** согласован

## Исходные допущения
- Базовая схема БД уже содержит таблицы `entities`, `profile_versions`, `external_id_mappings` и каталог `entity_types`.
- Тип сущности должен быть опубликован (`published`) перед созданием профиля.
- `tenant_id` берётся только из доверенного контекста JWT (middleware), не из payload.

## Порядок работ (шаги)
1. Реализовать backend-сервис профилей: create/update/get current/get by version/get by external/delete.
2. Обеспечить append-only инвариант версий: обновление создаёт только новую запись `profile_versions`.
3. Подключить API-слой: маршруты CRUD и версий, маппинг ошибок и контрактные статусы.
4. Синхронизировать OpenAPI с новыми endpoint'ами и схемами payload/response.
5. Добавить/обновить тесты: HTTP-слой (unit) и интеграционный сценарий на PostgreSQL.
6. Обновить task-артефакты (`REPORT.md`, docs-site история, `task_list.md`).

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Новый пакет `internal/profiles`, расширение `internal/httpapi` и wiring в `internal/app/run.go` |
| Frontend | Не меняется |
| БД / Atlas | Новых миграций нет; используется существующая схема |
| Инфра / Compose | Не меняется |
| Документация / OpenAPI | Обновление `openapi/openapi.yaml`, docs-site история и отчёт задачи |

## Риски и откат
- **Риск:** конфликт маршрутов `net/http` при похожих path patterns → **Митигация:** выбрать однозначный путь для lookup по внешнему ключу.
- **Риск:** конфликт `external_id_mappings` при повторном назначении ключа разным сущностям → **Митигация:** явный `409 external_mapping_conflict`.
- При откате: вернуть изменения файлов задачи и API до состояния до 011, данных БД не меняем миграциями.

## Проверка после выполнения
- Команды:
  - `go test ./...`
  - `go test -tags=integration ./...`
  - `go vet ./...`
  - `make openapi-lint`
  - `scripts/check-openapi-compat.sh`
  - `make docs-build`
- Ручная проверка / smoke:
  - создать профиль;
  - обновить профиль и проверить рост `version`;
  - прочитать current/by-version;
  - получить profile по external mapping;
  - удалить сущность.

## Примечания
- Связанные документы: `docs/DESIGN_AprilProfile.md`, `docs/adr/0003-april-profile-data-model-policies.md`, `docs/TESTING_STRATEGY.md`.
