# Задача: Фаза 3 (часть 4) — ретраи и DLQ для фоновой обработки (Asynq / outbox / синки)

## Мета
- **ID / ветка:** `feature/phase-3-async-retries-dlq`
- **Приоритет:** обычный
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 3**, блок **«Затем»** (ретраи и DLQ по договорённости).
- **Связанные подзадачи:** зависит от [`015-phase-3-asynq-infra-ping-domain-task`](../015-phase-3-asynq-infra-ping-domain-task/); пересекается с [`014`](../014-phase-3-outbox-event-contract-idempotency/) (статусы outbox) и [`016`](../016-phase-3-source-sync-checkpoints-lag-metrics/) (ошибки синка).
- **Связанные документы:** [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md), [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md)

## Цель
Зафиксировать и реализовать **политику повторов** и **мёртвых сообщений (DLQ)** для фоновых сценариев: очередь Asynq, обработка outbox, при необходимости — задачи синка из [`016`](../016-phase-3-source-sync-checkpoints-lag-metrics/). Итог должен быть **согласован с командой** (экспоненциальная задержка, max attempts, куда складывать poison messages: отдельная очередь Asynq, таблица в Postgres, или оба уровня).

## Контекст для агента
- Родительский абзац: [`../000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md) — «Фаза 3», блок «Затем» (второе предложение).
- «По договорённости» означает: перед merge зафиксировать выбор в `REPORT.md` или коротком ADR/разделе DESIGN, если поведение заметно для интеграторов.

## Входит в объём
- Настройка Asynq: retry, timeout, отдельная очередь или архив failed tasks — по выбранной модели.
- Для outbox: переход в терминальный статус «failed»/DLQ с причиной, возможность ручного replay (минимум — документированная процедура или админ-операция через SQL/runbook, если UI не в scope).
- Наблюдаемость: счётчики ошибок или связь с будущими метриками из фазы 4.1 (хотя бы структурированные логи с `request_id`/task id).
- Тесты: симуляция падения обработчика и проверка, что политика отрабатывает предсказуемо.

## Не входит в объём
- Полноценный UI для разбора DLQ.
- Замена Asynq на другой воркер.
- SLO и алерты в Grafana (координация с AprilHub, фаза 4.1).

## Заглушки и внешние зависимости
- Пока выход `Publisher` к внешним системам — заглушка, DLQ (Asynq / запись в БД) может наполняться **искусственно** в тестах (ошибка при «публикации»). Очередь задач остаётся **Redis + Asynq** ([`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md)).
- Согласование с владельцами AprilHub при вопросах общих стандартов очередей — **ручная контрольная точка** при расхождении с april-worker.

## Технические ограничения
- Сохранять **Redis + Asynq** как контур фоновых задач; не добавлять отдельный классический брокер (Kafka/Rabbit) без ADR.
- Не логировать PII при ошибках синка/outbox без маскирования.

## Критерии готовности (acceptance)
- [x] Документирована и реализована политика retry (интервалы, max попыток) для целевых типов задач.
- [x] Определено поведение после исчерпания попыток (DLQ / dead record) и как это диагностировать.
- [x] Автотесты на сценарий «ошибка → retry → терминал».
- [x] `go vet ./...`, `go test ./...` зелёные.

## Проверка (команды)
```bash
go vet ./...
go test ./...
go test -tags=integration ./...
make openapi-lint
make docs-build
```

## Результат в отчёте
Таблица политик по типам задач, где лежит DLQ, как делать replay, open questions для эксплуатации.

## Человекопонятная история в docs-site (обязательно)
- [x] Создана страница `docs-site/docs/task-story-017-async-retries-dlq.md`.
- [x] Обновлён [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md).
- [x] Простым языком: зачем DLQ и ретраи для надёжности доставки и синков.
- [x] Границы: без UI-консоли, без полной observability-фазы Hub.
- [x] Ссылки на `tasks/017-phase-3-async-retries-dlq/TASK.md`, `REPORT.md`.
