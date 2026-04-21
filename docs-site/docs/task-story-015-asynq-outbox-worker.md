---
sidebar_position: 29
---

# 015 — Asynq: инфраструктура, ping и батч outbox

## Что поменялось

- Подключена очередь **Redis + Asynq**: отдельный процесс **`april-worker`** (`cmd/april-worker`) обрабатывает задачи; HTTP API по-прежнему в **`april-profile`**.
- Периодическая задача **`april:ping`** пишет метку времени в Redis (`april:asynq:last_ping`) — проверка, что воркер и Redis живы.
- Периодическая задача **`april:outbox:batch`** читает до `OUTBOX_BATCH_SIZE` строк **`profile_outbox`** со статусом **`pending`**, вызывает интерфейс **`Publisher`** (пока заглушка без внешних вызовов) и переводит строки в **`published`** / **`failed`** с учётом **`tenant_id`** на каждой строке.
- Запись в outbox при изменении профиля теперь создаёт строку в статусе **`pending`** (не «мгновенный published»); очереди: **`default`** (ping) и **`outbox`** (батч), приоритеты заданы в конфиге Asynq.
- Docker-образ собирает оба бинарника; в **`docker compose`** добавлен сервис **`worker`** (профиль **`db`** вместе с PostgreSQL и Redis).

## Зачем это нужно

События профиля должны **надёжно уходить к потребителям** после фиксации версии в БД. Отдельный воркер отделяет **доставку** от **запрос-ответ API**, даёт единую точку для будущих ретраев и метрик. Ping по расписанию подтверждает, что цепочка «Redis → Asynq → обработчик» работает на стенде.

## Границы задачи

**Сделано:** клиент/сервер Asynq, планировщик периодических задач, заглушка `Publisher`, батч outbox, тесты (в т.ч. интеграционные с Redis 7 из Testcontainers).

**Не входило:** политика ретраев и DLQ (`tasks/017-phase-3-async-retries-dlq/TASK.md`), метрики лага по `source_system` (`tasks/016-phase-3-source-sync-checkpoints-lag-metrics/TASK.md`), отдельный брокер Kafka/Rabbit.

## Как проверить без чтения кода

```bash
go vet ./...
go test ./...
go test -tags=integration ./internal/integrationtest/...
make go-build
docker compose --profile db config
```

Локально: поднять PostgreSQL и Redis (`docker compose --profile db up -d`), задать `DATABASE_URL` / `REDIS_ADDR`, запустить `go run ./cmd/april-worker`.

## Официальные артефакты

- Постановка: `tasks/015-phase-3-asynq-infra-ping-domain-task/TASK.md`
- План: `tasks/015-phase-3-asynq-infra-ping-domain-task/PLAN.md`
- Отчёт: `tasks/015-phase-3-asynq-infra-ping-domain-task/REPORT.md`
- Родитель: `tasks/000-full-service-aprilhub-roadmap/PLAN.md`
