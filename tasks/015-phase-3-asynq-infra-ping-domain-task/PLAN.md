# План: Asynq — инфраструктура, ping, батч outbox

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-21
- **Статус плана:** согласован с реализацией

## Исходные допущения

- Задача [`014`](../014-phase-3-outbox-event-contract-idempotency/) выполнена: есть `profile_outbox`, контракт события, идемпотентность по версии.
- Очередь — **Redis + Asynq** без отдельного брокера.
- `Publisher` может быть заглушкой; воркер переводит строки по статусам в БД.

## Порядок работ (шаги)

1. Зависимость `github.com/hibiken/asynq`; конфиг воркера `LoadWorker` (без Keycloak).
2. Новые строки outbox — **`pending`**, `published_at` NULL; фоновый батч → **`published`** / **`failed`**.
3. Пакет `internal/asyncjobs`: типы задач `april:ping`, `april:outbox:batch`, очереди `default` / `outbox`, обработчики, интерфейс `Publisher` + заглушка.
4. `internal/workerapp` + `cmd/april-worker`: `Server.Start` + `Scheduler.Start`, остановка по сигналу/контексту.
5. Dockerfile — два бинарника; compose — сервис `worker` (профиль `db`).
6. Тесты: unit в `asyncjobs`, интеграция с Postgres + Redis (Testcontainers).
7. Документация: README, `.env.example`, страница docs-site, отчёт.

## Затрагиваемые области

| Область | Что меняется |
|--------|----------------|
| Backend (Go) | `cmd/april-worker`, `internal/asyncjobs`, `internal/workerapp`, `internal/config/worker.go`, правка `internal/profiles/outbox.go` |
| БД / Atlas | Нет новых миграций |
| Инфра / Compose | `Dockerfile`, `docker-compose.yml`, `.env.example` |
| CI | Сборка `april-worker` в workflows |
| Документация | README, docs-site, обновление истории 014 |

## Риски и откат

- **Риск:** две реплики воркера с одним Scheduler — дублирование cron; для dev один сервис, для prod — вынос планировщика или leader election позже.
- **Риск:** батч в одной транзакции — при реальном Publisher с побочными эффектами нужна осторожность (follow-up в 017).
- Откат: отключить сервис `worker`, временно вернуть вставку outbox в `published` в одной транзакции (не рекомендуется без согласования).

## Проверка после выполнения

- `go vet ./...`, `go test ./...`, `go test -tags=integration ./...`
- `make docs-build`, `make openapi-lint`, `docker compose --profile db config`

## Примечания

- Связано с ADR-0003 и задачами [`016`](../016-phase-3-source-sync-checkpoints-lag-metrics/), [`017`](../017-phase-3-async-retries-dlq/).
