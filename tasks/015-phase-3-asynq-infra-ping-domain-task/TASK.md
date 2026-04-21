# Задача: Фаза 3 (часть 2) — Asynq: инфраструктура, ping и одна прикладная задача

## Мета
- **ID / ветка:** `feature/phase-3-asynq-infra-ping-domain-task`
- **Приоритет:** высокий
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 3**, блок **«Сначала»** (Asynq-задачи для фоновых сценариев: хотя бы ping + одна реальная задача).
- **Связанные подзадачи:** зависит от [`014-phase-3-outbox-event-contract-idempotency`](../014-phase-3-outbox-event-contract-idempotency/); предшествует [`016-phase-3-source-sync-checkpoints-lag-metrics`](../016-phase-3-source-sync-checkpoints-lag-metrics/) и [`017-phase-3-async-retries-dlq`](../017-phase-3-async-retries-dlq/).
- **Связанные документы:** [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md) (Redis + Asynq), [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md) при правке compose/deploy

## Цель
Подключить **Asynq** к существующему Redis, поднять обработку фоновых задач (отдельный процесс или режим, согласованный с репо), добавить **периодический ping** (health очереди) и **одну реальную прикладную задачу** — предпочтительно обработку батча **outbox** (перевод в заглушку-публикацию из [`014`](../014-phase-3-outbox-event-contract-idempotency/)) либо эквивалентную фоновую работу с явным критерием готовности.

## Контекст для агента
- Родительский абзац: [`../000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md) — «Фаза 3», блок «Сначала» (предложение про Asynq).
- Без стабильного [`014`](../014-phase-3-outbox-event-contract-idempotency/) «реальная» задача не может опираться на outbox — согласуйте альтернативу (например периодическая очистка/валидация) в `REPORT.md`, если порядок временно иной.

## Входит в объём
- Конфигурация клиента Asynq (Redis URL из env), регистрация очередей и приоритетов — минимально необходимое.
- Воркер: отдельная команда `cmd/...` или встроенный режим — **как уже принято** после появления каркаса из фазы 1; документация запуска в README/compose.
- Задача **ping**: периодическая, доказуемо выполняется (лог/метрика/запись в Redis — на выбор, но проверяемо в тесте или интеграции).
- **Одна реальная задача:** например `ProcessOutboxBatch` с чтением из таблицы outbox и вызовом интерфейса Publisher из [`014`](../014-phase-3-outbox-event-contract-idempotency/); либо другая согласованная фоновая операция домена с тестом.
- Обновление **docker-compose** / профилей деплоя — Redis доступен воркеру, переменные в `.env.example`.
- Тесты: минимум unit на регистрацию задач; по возможности integration с Redis (Testcontainers), в духе [`009-phase-1-integration-tests-db-redis`](../009-phase-1-integration-tests-db-redis/).

## Не входит в объём
- Полная политика **ретраев и DLQ** (задача [`017`](../017-phase-3-async-retries-dlq/)).
- Отдельный классический брокер (Kafka/Rabbit) вместо или поверх **Redis + Asynq**; прод-интеграция маршрутов с AprilHub (ручная контрольная точка координации).
- Метрики лага по `source_system` ([`016`](../016-phase-3-source-sync-checkpoints-lag-metrics/)).

## Заглушки и внешние зависимости
- `Publisher` / выход к внешним потребителям из outbox может оставаться заглушкой — воркер Asynq всё равно переводит записи по конечному автомату статусов в пределах БД. Очередь задач — **Redis + Asynq**, не Kafka/Rabbit ([`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md)).
- Если Redis на CI отличается от dev — зафиксировать в отчёте версию и параметры Testcontainers.

## Технические ограничения
- Очередь фоновых задач: **Redis + Asynq** ([`AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md)); не вводить параллельный классический брокер сообщений без ADR.
- Секреты и URL Redis только через env.
- Не ослаблять мультитенантность при фоновых джобах (фильтрация по `tenant_id` при обработке outbox).

## Критерии готовности (acceptance)
- [x] Воркер Asynq запускается тем способом, который задокументирован для репозитория.
- [x] Периодическая задача ping выполняется и наблюдаема (тест или интеграционная проверка).
- [x] Реализована ровно одна прикладная фоновая задача с осмысленным телом и тестовым покрытием.
- [x] Compose/deploy обновлены настолько, чтобы локально поднять API + Redis + воркер.
- [x] `go test ./...`, `go vet ./...` зелёные.

## Проверка (команды)
```bash
go vet ./...
go test ./...
go test -tags=integration ./...
docker compose config
make openapi-lint
make docs-build
```

## Результат в отчёте
Как запускается воркер, имена очередей, что делает «реальная» задача, ограничения до [`016`](../016-phase-3-source-sync-checkpoints-lag-metrics/)/[`017`](../017-phase-3-async-retries-dlq/).

## Человекопонятная история в docs-site (обязательно)
- [x] Создана/обновлена страница `docs-site/docs/` в формате `task-story-015-<slug>.md`.
- [x] В [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) добавлена ссылка и статус.
- [x] Простым языком: зачем фоновые задачи и связь с событиями/outbox.
- [x] Границы: без DLQ/ретраев как в прод-политике, без синков по внешним системам.
- [x] Ссылки на `tasks/015-phase-3-asynq-infra-ping-domain-task/TASK.md`, `REPORT.md`.
