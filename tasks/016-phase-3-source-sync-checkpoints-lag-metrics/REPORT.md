## 1) Итого
- Статус: ✅ выполнено
- Задача: Фаза 3 (3/4) — синхронизация с checkpoint и метрики лага по `source_system`
- Ветка: `feature/phase-3-source-sync-checkpoints-lag-metrics`
- Коммиты: не создавались в этой сессии (изменения подготовлены локально)
- PR: не создавался

## 2) Что сделано
- [backend] Добавлена Asynq-задача `april:source_sync:batch` (очередь `sync`) и обработчик батч-синка по `source_system` для всех tenant'ов.
- [backend] Введены интерфейсы `SourceClient` / `SourceFetchRequest` / `SourceBatch` и безопасная заглушка `NoopSourceClient` для текущей фазы без боевого внешнего API.
- [backend] Реализована идемпотентность батчей через вставку в `source_sync_applied_events` с `ON CONFLICT DO NOTHING`.
- [backend] Реализовано хранение checkpoint (`last_cursor`, `last_seen_source_updated_at`) и вычисление lag (`CalculateLagSeconds`) с публикацией gauge `april_profile_source_sync_lag_seconds{tenant_id,source_system}`.
- [config/worker] Добавлены env-параметры: `ASYNQ_SYNC_INTERVAL`, `SYNC_BATCH_SIZE`, `SYNC_SOURCE_SYSTEMS`; scheduler регистрирует отдельные sync-задачи по списку источников.
- [docs] Добавлена человекопонятная история `docs-site/docs/task-story-016-source-sync-checkpoints-lag.md`, обновлён `docs-site/docs/task-stories-overview.md`, обновлён статус в `task_list.md`.

## 3) Изменённые файлы
- `atlas/migrations/20260424120000_source_sync_checkpoints.sql`
- `internal/asyncjobs/tasks.go`
- `internal/asyncjobs/handlers.go`
- `internal/asyncjobs/sync.go`
- `internal/asyncjobs/handlers_test.go`
- `internal/config/worker.go`
- `internal/config/worker_test.go`
- `internal/workerapp/run.go`
- `internal/integrationtest/asyncjobs_integration_test.go`
- `.env.example`
- `docs-site/docs/task-story-016-source-sync-checkpoints-lag.md`
- `docs-site/docs/task-stories-overview.md`
- `tasks/016-phase-3-source-sync-checkpoints-lag-metrics/PLAN.md`
- `tasks/016-phase-3-source-sync-checkpoints-lag-metrics/REPORT.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: добавлены
- Какие таблицы/индексы изменены:
  - `source_sync_checkpoints`
  - `source_sync_applied_events`
  - индекс `source_sync_applied_events_tenant_source_external_idx`
- Обратимость: да, через rollback миграции Atlas (удаление добавленных объектов в down-стратегии проекта)

## 5) Проверка качества
- Линтер: ok (`go vet ./...`, `make openapi-lint`)
- Сборка: ok (`make docs-build`)
- Unit tests: ok (`go test ./...`)
- Integration tests: ok (`go test -tags=integration ./...`)
- E2E / smoke: не применялось

Команды (фактически выполненные):
```bash
go test ./...
go test -tags=integration ./...
go vet ./...
docker run --rm -v "$(pwd)/atlas/migrations:/migrations" arigaio/atlas:latest migrate hash --dir "file:///migrations"
docker run --rm -v "$(pwd)/atlas/migrations:/migrations" arigaio/atlas:latest migrate validate --dir "file:///migrations"
make openapi-lint
make docs-build
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: нет

## 7) Риски и ограничения
- Реальный внешний `SourceClient` пока заглушка (`NoopSourceClient`), поэтому бизнес-данные во внешние сущности не маппятся (ожидаемо для фазы 3 каркаса).
- Lag-метрика регистрируется в приложении и тестируется через registry; отдельный `GET /metrics` endpoint в рамках этой задачи не добавлялся (допустимо по `TASK.md`).

## 8) Что осталось
- [ ] Подключить боевые адаптеры AprilOrgFlow/EDC в фазе 5.
- [ ] Вынести политику retry/DLQ для sync-задач в `tasks/017-phase-3-async-retries-dlq`.
- [ ] При появлении HTTP-экспорта метрик проверить scrape через `/metrics`.
