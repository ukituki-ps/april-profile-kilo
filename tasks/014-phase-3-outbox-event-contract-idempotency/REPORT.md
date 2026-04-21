# Отчёт: задача 014 — outbox, контракт события, идемпотентность публикации

## 1) Итого

- Статус: ✅ выполнено
- Задача: контракт события (ADR-0003), transactional `profile_outbox`, детерминированный `event_id`, идемпотентная запись по `(tenant_id, entity_id, profile_version)`
- Ветка: `feature/phase-3-outbox-event-contract-idempotency`
- Коммиты: ветка `feature/phase-3-outbox-event-contract-idempotency` (один коммит с реализацией задачи; точный SHA — в PR / `git log`)
- PR: не создавался (локальная ветка)

## 2) Что сделано

- **[backend]** Структура `ProfileChangeEventV1` и `ProfileChangeEventID` (UUID v5 от фиксированного namespace + строка `tenant_id|entity_id|profile_version`). Запись в `profile_outbox` в той же транзакции, что и `INSERT` в `profile_versions`, для `Create`, `Update`, `ResolveFieldConflict`, `MergeEntityProfiles`.
- **[БД]** Миграция: удалена заготовка `profile_events`, добавлена `profile_outbox` (payload JSONB, статусы `pending`/`published`/`failed`, уникальные `event_id` и `(tenant_id, entity_id, profile_version)`).
- **[заглушка публикации]** Новая строка сразу получает `status = published` и `published_at = now()` в той же транзакции; внешних вызовов и Asynq нет (задача 015).
- **[tests]** Юнит-тесты на детерминизм `event_id` и JSON; интеграционный тест на контракт payload, число строк при create/update и запрет дубликата по версии.
- **[docs]** Страница `docs-site/docs/task-story-014-outbox-event-contract.md`, обновлён `task-stories-overview.md`; отмечены `task_list.md`, `TASK.md`, `PLAN.md`.

## 3) Изменённые файлы

- `atlas/migrations/20260423120000_profile_outbox.sql`, `atlas/migrations/atlas.sum`
- `internal/profiles/profile_event.go`, `outbox.go`, `profile_event_test.go`
- `internal/profiles/service.go`, `internal/profiles/service_admin.go`
- `internal/integrationtest/integration_test.go`
- `docs-site/docs/task-story-014-outbox-event-contract.md`, `docs-site/docs/task-stories-overview.md`
- `task_list.md`, `tasks/014-phase-3-outbox-event-contract-idempotency/TASK.md`, `PLAN.md`, `REPORT.md`

## 4) Миграции и данные

- Миграции Atlas: добавлены
- Таблицы: `profile_outbox` (индексы по `(tenant_id, status)`, `(tenant_id, created_at)`); удалена `profile_events` (замена заготовки)
- Обратимость: откат — отдельная down-миграция вручную по политике репозитория (в каталоге только forward-миграции); на dev — по `DEPLOYMENT_STRATEGY` с бэкапом
- Схема outbox (колонки): `event_id`, `tenant_id`, `entity_id`, `entity_type` (`namespace/code`), `profile_version`, `occurred_at`, `payload` (JSON события), `status`, `created_at`, `published_at`
- Пример `payload` (минимум ADR-0003):

```json
{
  "tenant_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "entity_id": "…",
  "entity_type": "hr/employee",
  "profile_version": 2,
  "occurred_at": "2026-04-21T12:00:00Z",
  "event_id": "…"
}
```

- Повтор той же логической версии: `INSERT … ON CONFLICT DO NOTHING` — вторая строка не создаётся; прямой дубликат по `(tenant_id, entity_id, profile_version)` в БД даёт ошибку (интеграционный тест)
- Вместо внешней доставки до интеграций: источник истины — `profile_outbox`; follow-up для **015** — воркер Asynq (при необходимости перевести строки в `pending` до реальной отправки)

## 5) Проверка качества

- Линтер: ok (`go vet`, `make openapi-lint`)
- Сборка: ok (`go test ./...`)
- Unit tests: ok
- Integration tests: ok (`go test -tags=integration ./internal/integrationtest/...`)
- E2E / smoke: не применялось

Команды (фактически выполненные):

```bash
go vet ./...
go test ./...
go test -tags=integration ./internal/integrationtest/...
make migrate-validate
make openapi-lint
make docs-build
```

## 6) Деплой

- Среда: нет (только код и документация в репозитории)
- Согласовано с: не применялось
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: нет

## 7) Риски и ограничения

- Namespace UUID для UUID v5 зафиксирован в коде; смена ломает стабильность `event_id` для существующих интеграций.
- Заглушка сразу помечает `published`: при появлении реального воркера в 015 может понадобиться перейти на `pending` до успешной внешней доставки.

## 8) Что осталось

- [ ] Задача `tasks/015-phase-3-asynq-infra-ping-domain-task`: Asynq, обработка outbox в фоне.
- [ ] При необходимости: отдельная JSON Schema события и публикация в OpenAPI, если появится публичный канал событий.
