---
sidebar_position: 31
---

# 017 — Ретраи и DLQ для фоновых задач (Asynq, outbox, синк)

## Что поменялось

- **Asynq:** для периодических задач заданы `MaxRetry`, `Timeout` и общий экспоненциальный `RetryDelayFunc` (база из `ASYNQ_RETRY_BASE_DELAY`, потолок 15 минут). Ошибки обработчика логируются через `ErrorHandler` с `task_type` и `asynq_task_id` (если доступен в контексте).
- **Outbox (`profile_outbox`):** добавлены поля `publish_attempts`, `last_publish_error`, `next_retry_at`. Временная ошибка `Publish` не переводит строку сразу в `failed`: растёт счётчик, выставляется backoff, пока не исчерпан `OUTBOX_PUBLISH_MAX_ATTEMPTS` — тогда строка остаётся в **DLQ в PostgreSQL** (`status = 'failed'`) с краткой причиной без payload.
- **Синк:** при ошибке `FetchChanges` ошибка пробрасывается из обработчика — срабатывают **ретраи на уровне Asynq**; в лог пишется предупреждение с `tenant_id`, `source_system`, `asynq_task_id`.
- Интеграционные тесты: сценарии «флейки publisher → published» и «всегда ошибка → failed после лимита».

## Зачем это нужно

Внешние брокеры и сети неидеальны: без ретраев любая кратковременная ошибка превращается в потерю доставки или «залипание» вечного `pending`. DLQ в БД для outbox даёт эксплуатации явный список проблемных событий; архив Asynq в Redis — для задач, которые падают целиком (например, недоступна БД на время).

## Границы задачи

**Сделано:** политика retry/DLQ в коде и env, миграция Atlas, логи, автотесты.

**Не входило:** UI-консоль разбора DLQ, полноценная observability-фаза AprilHub (Grafana/SLO), замена Asynq.

## Как проверить без чтения кода

```bash
go vet ./...
go test ./...
go test -tags=integration ./...
make migrate-validate
```

Сценарии `TestAsynq_outboxBatch_publishRetriesThenPublished` и `TestAsynq_outboxBatch_publishExhaustedToFailed` в пакете `internal/integrationtest`.

## Ручной replay строки outbox из DLQ

Если после разбора причины строку нужно снова отправить в обработку:

```sql
UPDATE profile_outbox
SET
  status = 'pending',
  publish_attempts = 0,
  last_publish_error = NULL,
  next_retry_at = NULL
WHERE id = '<uuid>' AND status = 'failed';
```

Выполнять осознанно (например, после починки downstream или конфигурации publisher).

## Официальные артефакты

- Постановка: `tasks/017-phase-3-async-retries-dlq/TASK.md`
- План: `tasks/017-phase-3-async-retries-dlq/PLAN.md`
- Отчёт: `tasks/017-phase-3-async-retries-dlq/REPORT.md`
- Родитель: `tasks/000-full-service-aprilhub-roadmap/PLAN.md`
