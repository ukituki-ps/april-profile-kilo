# План: ретраи и DLQ для Asynq / outbox / синка

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-22
- **Статус плана:** согласован (реализация по итогам сессии)

## Исходные допущения

- Очередь остаётся **Redis + Asynq**; отдельный брокер не вводится.
- «DLQ» для событий профиля — терминальное состояние строки **`profile_outbox.status = 'failed'`** в PostgreSQL с текстом ошибки без PII/payload.
- «DLQ» для целых задач Asynq после исчерпания `MaxRetry` — **архив Asynq** в Redis (штатный механизм; диагностика через asynqmon/CLI по runbook команды).

## Порядок работ (шаги)

1. Миграция Atlas: колонки для попыток публикации и backoff по строке outbox.
2. Логика батча outbox: retry до лимита, затем `failed`; структурированные логи с `asynq_task_id` / `tenant_id` / `outbox_id`.
3. Конфиг воркера: лимиты Asynq и outbox, таймауты, база backoff.
4. `asynq.Server`: `RetryDelayFunc`, `ErrorHandler`.
5. Тесты: unit (backoff/sanitize), integration (retry → published, exhausted → failed).
6. Документация: docs-site, `REPORT.md`, `.env.example`.

## Затрагиваемые области

| Область        | Что меняется (кратко)                                              |
| -------------- | ------------------------------------------------------------------ |
| Backend (Go)   | `internal/asyncjobs`, `internal/config`, `internal/workerapp`    |
| БД / Atlas     | Новая миграция `profile_outbox` + `atlas.sum`                     |
| Инфра / Compose| Только комментарии в `.env.example` (новые переменные опциональны) |
| Документация   | `docs-site`, `tasks/017`, `task_list.md`                          |

## Риски и откат

- **Риск:** слишком длинный backoff задерживает доставку → **Митигация:** env `OUTBOX_PUBLISH_BACKOFF_BASE`, потолок 15 минут в коде.
- **Риск:** частые ретраи бьют по downstream → **Митигация:** `OUTBOX_PUBLISH_MAX_ATTEMPTS`, лимиты Asynq.
- Откат: откат миграции Atlas по политике репозитория; откат кода возвращает немедленный `failed` при ошибке Publish (старое поведение).

## Проверка после выполнения

- `go vet ./...`, `go test ./...`, `go test -tags=integration ./...`
- `make migrate-validate`, `make openapi-lint`, `make docs-build`

## Примечания

- Связанные задачи: [`015`](../015-phase-3-asynq-infra-ping-domain-task/), [`014`](../014-phase-3-outbox-event-contract-idempotency/), [`016`](../016-phase-3-source-sync-checkpoints-lag-metrics/).
