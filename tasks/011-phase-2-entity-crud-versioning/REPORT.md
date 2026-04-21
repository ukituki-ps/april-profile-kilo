## 1) Итого
- Статус: ✅ выполнено
- Задача: Фаза 2 (часть 2) — CRUD сущности и append-only версии профиля
- Ветка: `feature/phase-2-crud-versioning`
- Коммиты: не создавались
- PR: не создавался

## 2) Что сделано
- [backend] Добавлен пакет `internal/profiles` с операциями `Create`, `Update`, `GetCurrent`, `GetByVersion`, `GetCurrentByExternalRef`, `Delete`.
- [backend] Реализован append-only подход: каждое обновление создаёт новую запись в `profile_versions`, исторические версии остаются доступными.
- [backend] Подключены новые защищённые endpoint'ы CRUD/versions и lookup по external mapping в `internal/httpapi/server.go`.
- [backend] Добавлен контроль публикации типа перед созданием (`entity_types.status = published`) и обработка конфликтов external mapping (`409`).
- [tests] Обновлены unit-тесты HTTP-слоя и добавлен integration-сценарий с реальной PostgreSQL схемой для CRUD + versioning + external mapping.
- [docs] Синхронизирован `openapi/openapi.yaml`; добавлены `PLAN.md`, docs-site история задачи и обновлён обзор статусов.

## 3) Изменённые файлы
- `internal/profiles/service.go`
- `internal/httpapi/server.go`
- `internal/httpapi/server_test.go`
- `internal/app/run.go`
- `internal/integrationtest/integration_test.go`
- `openapi/openapi.yaml`
- `tasks/011-phase-2-entity-crud-versioning/PLAN.md`
- `tasks/011-phase-2-entity-crud-versioning/REPORT.md`
- `docs-site/docs/task-story-011-entity-crud-versioning.md`
- `docs-site/docs/task-stories-overview.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет (использована существующая схема из прошлых задач).
- Какие таблицы/индексы изменены: структура не менялась; используются `entities`, `profile_versions`, `external_id_mappings`, `entity_types`, `tenants`.
- Обратимость: да; откат через revert кода задачи 011.

## 5) Проверка качества
- Линтер: ok (`make openapi-lint`)
- Сборка: ok (`make docs-build`, backend косвенно через `go test`)
- Unit tests: ok
- Integration tests: ok
- E2E / smoke: не применялось

Команды (фактически выполненные):
```bash
go test ./...
go test -tags=integration ./...
go vet ./...
make openapi-lint
scripts/check-openapi-compat.sh
make docs-build
```

## 6) Деплой
- Среда: нет
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: не применялся

## 7) Риски и ограничения
- В рамках задачи сохранён минимальный CRUD API; authority/merge и ABAC-фильтрация остаются в задачах `012` и `013`.

## 8) Что осталось
- [ ] Расширить доменную валидацию содержимого `document` по опубликованной схеме типа (follow-up к текущему минимальному контракту).
