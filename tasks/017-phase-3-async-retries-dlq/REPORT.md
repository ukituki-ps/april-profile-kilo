## 1) Итого

- Статус: ✅ выполнено
- Задача: Фаза 3 (4/4) — ретраи и DLQ для Asynq, outbox и синка
- Ветка: `feature/phase-3-async-retries-dlq`
- Коммиты: один коммит на ветке (subject: `feat(worker): outbox publish retries, Asynq backoff, DLQ docs`); актуальный SHA — `git rev-parse HEAD` после pull
- PR: не создавался в сессии агента

## 2) Что сделано

- **[backend]** Политика **per-row** для `profile_outbox`: поля `publish_attempts`, `last_publish_error`, `next_retry_at`; экспоненциальный backoff (база `OUTBOX_PUBLISH_BACKOFF_BASE`, потолок 15 минут); после `OUTBOX_PUBLISH_MAX_ATTEMPTS` — `status=failed` (DLQ в Postgres). Невалидный JSON → немедленный `failed` с фиксированной причиной. Логи `slog` с `asynq_task_id`, `outbox_id`, `tenant_id`.
- **[backend]** Asynq `Server`: общий `RetryDelayFunc` (база `ASYNQ_RETRY_BASE_DELAY`), `ErrorHandler` с предупреждением по ошибке обработчика; у периодических задач заданы `MaxRetry` и `Timeout` через конструкторы `NewPingTask` / `NewOutboxBatchTask` / `NewSourceSyncTask` и конфиг воркера.
- **[backend]** Синк: при ошибке `FetchChanges` — предупреждение с `asynq_task_id` и проброс ошибки для ретраев Asynq.
- **[БД]** Atlas-миграция `20260425120000_profile_outbox_publish_retry.sql`, обновлён `atlas.sum`.
- **[tests]** Unit: `publish_retry_test.go`; integration: `TestAsynq_outboxBatch_publishRetriesThenPublished`, `TestAsynq_outboxBatch_publishExhaustedToFailed`.
- **[docs]** `docs-site/docs/task-story-017-async-retries-dlq.md`, обновлены `task-stories-overview.md`, `task-story-016-source-sync-checkpoints-lag.md`, `task_list.md`, `.env.example`, `PLAN.md`, `TASK.md` (acceptance).

## 3) Политика по типам задач (сводка)

| Тип задачи Asynq | Очередь | MaxRetry (env) | Timeout (env) | Backoff между ретраями задачи |
| ---------------- | ------- | -------------- | ------------- | ----------------------------- |
| `april:ping` | `default` | `ASYNQ_PING_MAX_RETRY` (по умолчанию 3) | `ASYNQ_PING_TIMEOUT` | экспонента от `ASYNQ_RETRY_BASE_DELAY`, max 15m |
| `april:outbox:batch` | `outbox` | `ASYNQ_OUTBOX_BATCH_MAX_RETRY` (5) | `ASYNQ_OUTBOX_TIMEOUT` | то же |
| `april:source_sync:batch` | `sync` | `ASYNQ_SYNC_MAX_RETRY` (5) | `ASYNQ_SYNC_TIMEOUT` | то же |

**Outbox (строка БД):** до `OUTBOX_PUBLISH_MAX_ATTEMPTS` (по умолчанию 5) неудачных `Publish` — остаётся `pending`, растёт `publish_attempts`, выставляется `next_retry_at`. После лимита — **`failed`** + `last_publish_error` (санитизированный текст, без payload).

**DLQ:** Postgres — `profile_outbox` с `status=failed`. Asynq — архив задач в Redis после исчерпания `MaxRetry` (стандартный контур Asynq / asynqmon).

**Replay outbox:** SQL в `docs-site/docs/task-story-017-async-retries-dlq.md` и в этом отчёте — сброс в `pending` и обнуление полей ретрая для выбранного `id`.

## 4) Изменённые файлы

- `atlas/migrations/20260425120000_profile_outbox_publish_retry.sql`, `atlas/migrations/atlas.sum`
- `internal/asyncjobs/handlers.go`, `tasks.go`, `sync.go`, `publish_retry.go`, `publish_retry_test.go`
- `internal/config/worker.go`
- `internal/workerapp/run.go`
- `internal/integrationtest/asyncjobs_integration_test.go`
- `.env.example`
- `docs-site/docs/task-story-017-async-retries-dlq.md`, `docs-site/docs/task-stories-overview.md`, `docs-site/docs/task-story-016-source-sync-checkpoints-lag.md`
- `task_list.md`, `tasks/017-phase-3-async-retries-dlq/TASK.md`, `PLAN.md`, `REPORT.md`

## 5) Миграции и данные

- Миграции Atlas: **добавлены**
- Таблица `profile_outbox`: колонки `publish_attempts`, `last_publish_error`, `next_retry_at`; частичный индекс по `pending`
- Обратимость: откат миграции по процессу Atlas/деплоя (см. `DEPLOYMENT_STRATEGY.md`)

## 6) Проверка качества

- Линтер: ok (`go vet ./...`)
- Сборка: ok (`go test ./...`, `make docs-build`)
- Unit tests: ok
- Integration tests: ok (`go test -tags=integration ./internal/integrationtest/...`)
- E2E / smoke: не применялось

Команды (фактически выполненные):

```bash
gofmt -w …
go vet ./...
go test ./...
go test -tags=integration ./internal/integrationtest/... -count=1
make migrate-validate
make openapi-lint
make docs-build
docker run --rm -v "$(pwd):/work" -w /work arigaio/atlas:0.32.0 migrate hash --dir "file://atlas/migrations"
```

## 7) Деплой

- Среда: нет
- Согласовано с: не применялось
- Health / readiness: не применялось
- Rollback: нет

## 8) Риски и ограничения

- `ErrorHandler` Asynq вызывается при ошибке обработчика **до решения о финальном архиве**; в логе явно указано, что дальше действует политика ретраев Asynq.
- Частичный индекс только по `status='pending'`; фильтр `next_retry_at` остаётся в запросе батча.
- Open questions: единый runbook с april-worker по просмотру архива Redis; при масштабировании воркеров — по-прежнему вопрос одного планировщика (см. отчёт 015).

## 9) Что осталось

- [ ] UI для разбора DLQ и массового replay (вне scope).
- [ ] Метрики/алерты по счётчикам failed outbox и архиву Asynq (фаза observability / AprilHub).
