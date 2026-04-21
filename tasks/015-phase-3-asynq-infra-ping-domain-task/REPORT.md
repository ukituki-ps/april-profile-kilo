# Отчёт: задача 015 — Asynq: инфраструктура, ping, батч outbox

## 1) Итого

- Статус: ✅ выполнено
- Задача: Redis + Asynq, воркер `april-worker`, периодический ping (Redis), прикладная задача `april:outbox:batch` с заглушкой `Publisher`
- Ветка: `feature/phase-3-asynq-infra-ping-domain-task` (создайте при push)
- Коммиты: см. `git log` после merge
- PR: не создавался в сессии агента

## 2) Что сделано

- **[backend]** Зависимость `github.com/hibiken/asynq`. Конфиг `config.LoadWorker()` (`DATABASE_URL`, Redis, `ASYNQ_CONCURRENCY`, `OUTBOX_BATCH_SIZE`, `ASYNQ_PING_INTERVAL`, `ASYNQ_OUTBOX_INTERVAL`). Пакет `internal/asyncjobs`: очереди `default` и `outbox`, задачи `april:ping` (ключ Redis `april:asynq:last_ping`) и `april:outbox:batch` (обновление `april:asynq:last_outbox_batch`, обработка `profile_outbox` с фильтрацией по `tenant_id` на строке). `internal/workerapp` запускает `asynq.Server` и `asynq.Scheduler` через `Start` (не `Run`, чтобы управлять жизненным циклом через контекст). `cmd/april-worker` — точка входа.
- **[outbox]** `insertProfileOutboxRow` создаёт строки со статусом **`pending`**; публикация — воркером.
- **[infra]** `Dockerfile` собирает `april-profile` и `april-worker`. В `docker-compose.yml` сервис **`worker`** с `profiles: [db]`, `depends_on: postgres, redis`. `.env.example` и `README.md` обновлены.
- **[tests]** Unit: `internal/asyncjobs`, `internal/config` (worker). Интеграция: `TestAsynq_ping_writesRedisKey`, `TestAsynq_outboxBatch_marksPublished`; обновлён сценарий outbox (ожидание `pending`).
- **[docs]** Страница `docs-site/docs/task-story-015-asynq-outbox-worker.md`, `task-stories-overview.md`, уточнение в `task-story-014-outbox-event-contract.md` про переход на `pending` + воркер 015.

## 3) Изменённые файлы

- `go.mod`, `go.sum`
- `cmd/april-worker/main.go`
- `internal/asyncjobs/*.go`, `internal/workerapp/run.go`, `internal/config/worker.go`, `internal/config/worker_test.go`
- `internal/profiles/outbox.go`
- `internal/integrationtest/integration_test.go`, `internal/integrationtest/asyncjobs_integration_test.go`
- `Dockerfile`, `docker-compose.yml`, `.env.example`, `Makefile`, `README.md`
- `.github/workflows/ci.yml`, `.github/workflows/bootstrap-ci.yml`
- `docs-site/docs/task-story-015-asynq-outbox-worker.md`, `docs-site/docs/task-stories-overview.md`, `docs-site/docs/task-story-014-outbox-event-contract.md`
- `task_list.md`, `tasks/015-phase-3-asynq-infra-ping-domain-task/PLAN.md`, `REPORT.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Обратимость: не применялась

## 5) Проверка качества

- Линтер: ok (`go vet ./...`)
- Сборка: ok (`go build` обоих бинарников)
- Unit tests: ok
- Integration tests: ok (`go test -tags=integration ./internal/integrationtest/...`)
- E2E / smoke: не применялось

Команды (фактически выполненные):

```bash
go vet ./...
go test ./...
go test -tags=integration ./internal/integrationtest/...
```

Дополнительно рекомендуется локально: `make docs-build`, `make openapi-lint`, `docker compose --profile db config`.

## 6) Деплой

- Среда: нет (только репозиторий)
- Согласовано с: не применялось
- Образы: при следующем деплое образ backend будет содержать оба бинарника; для фоновой обработки на dev добавьте сервис/команду `april-worker` по аналогии с compose
- Health / readiness: не применялось (воркер без HTTP)
- Rollback: нет

## 7) Риски и ограничения

- Планировщик Asynq в каждом экземпляре воркера при масштабировании даёт несколько cron; для прод-пула воркеров может понадобиться отдельный процесс планировщика или один реплика с scheduler.
- Ретраи задач Asynq и DLQ для outbox — в [`tasks/017-phase-3-async-retries-dlq`](./../017-phase-3-async-retries-dlq/TASK.md).
- Метрики лага синхронизации — [`tasks/016-phase-3-source-sync-checkpoints-lag-metrics`](./../016-phase-3-source-sync-checkpoints-lag-metrics/TASK.md).
- Интеграционные тесты: Redis **7-alpine** через Testcontainers (как в остальных тестах репозитория).

## 8) Что осталось

- [ ] При необходимости: выделить scheduler в один инстанс или внешний cron при горизонтальном масштабировании воркеров.
- [ ] Задачи [`016`](./../016-phase-3-source-sync-checkpoints-lag-metrics/), [`017`](./../017-phase-3-async-retries-dlq/).
