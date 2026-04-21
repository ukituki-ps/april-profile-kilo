# Задача: Фаза 3 (часть 3) — синхронизация с checkpoint и метрики лага по source_system

## Мета
- **ID / ветка:** `feature/phase-3-source-sync-checkpoints-lag-metrics`
- **Приоритет:** обычный
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 3**, блок **«Затем»** (синки с checkpoint; метрики лага по `source_system`).
- **Связанные подзадачи:** зависит от [`014-phase-3-outbox-event-contract-idempotency`](../014-phase-3-outbox-event-contract-idempotency/) и [`015-phase-3-asynq-infra-ping-domain-task`](../015-phase-3-asynq-infra-ping-domain-task/); связана с [`017-phase-3-async-retries-dlq`](../017-phase-3-async-retries-dlq/) (ретраи синков могут уточняться там).
- **Связанные документы:** [`docs/adr/0003-april-profile-data-model-policies.md`](../../docs/adr/0003-april-profile-data-model-policies.md) (п. 8 синхронизация), [`docs/DESIGN_AprilProfile.md`](../../docs/DESIGN_AprilProfile.md), [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md)

## Цель
Реализовать **идемпотентные батчи синхронизации** с внешними источниками с сохранением **checkpoint** (per `source_system` / tenant при необходимости) и экспорт **метрик лага** (например Prometheus gauge), чтобы операционно видеть отставание по каждому источнику до появления полноценных стендов соседних сервисов.

## Контекст для агента
- Родительский абзац: [`../000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md) — «Фаза 3», блок «Затем» (первое предложение).
- Фаза 5 дорожной карты развивает интеграции с AprilOrgFlow/EDC/NFlow — здесь **каркас** синка и наблюдаемости, без обязательной боевой связи.

## Входит в объём
- Модель checkpoint (БД, Atlas): ключи по источнику/тенанту, хранимое смещение или временная метка — по согласованию с метамоделью внешних ключей (фаза 2).
- Периодический или триггерный сценарий синка (через Asynq из [`015`](../015-phase-3-asynq-infra-ping-domain-task/) предпочтительно).
- Метрика(и) лага по `source_system` (и при необходимости labels с tenant) в формате, совместимом с **Prometheus**; маршрут `GET /metrics` может прийти из фазы 4.1 — до его появления допускается регистрация метрик в приложении и проверка через test/registry или временный endpoint по договорённости в репо.
- Тесты: unit на вычисление лага; integration с mock HTTP-клиентом или записью checkpoint в БД.

## Не входит в объём
- Полная интеграция с AprilOrgFlow / EDC (фаза 5).
- Дашборды Grafana и алерты (фаза 4.1 / эксплуатация).
- Окончательная политика **DLQ** (может пересекаться с [`017`](../017-phase-3-async-retries-dlq/), границы зафиксировать в отчётах).

## Заглушки и внешние зависимости
- **Внешний API источника:** HTTP-клиент с mock-ответами в тестах; на dev — фиктивный URL или отключённый адаптер за feature-flag.
- **GET /metrics:** если ещё не реализован, метрики всё равно регистрируются в коде; целевые команды проверки — см. ниже (расширение CI при появлении экспорта из [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md)).

## Технические ограничения
- Миграции только через **Atlas**.
- Мультитенантность: checkpoint и синки не смешивают данные тенантов.
- Не хранить секреты внешних систем в репозитории — только env.

## Критерии готовности (acceptance)
- [ ] Checkpoint сохраняется и используется для идемпотентных батчей (повторный прогон не дублирует обработанные записи в смысле домена).
- [ ] Метрика лага по `source_system` обновляется и документирована (имя метки, единицы).
- [ ] Автотесты покрывают ключевую логику; `go vet`, `go test` зелёные.
- [ ] После появления `GET /metrics` в сервисе — метрики видны на scrape (follow-up или в рамках задачи, если endpoint уже есть).

## Проверка (команды)
```bash
go vet ./...
go test ./...
go test -tags=integration ./...
docker run --rm -v "$(pwd)/atlas/migrations:/migrations" arigaio/atlas:latest migrate validate --dir "file:///migrations"
make openapi-lint
make docs-build
# целевое при экспорте Prometheus (фаза 4.1 / эта репо):
# curl -sSf http://localhost:<port>/metrics | grep <metric_prefix>
```

## Результат в отчёте
Таблица checkpoint, имена метрик, какие источники mock и что нужно от стенда для включения реального клиента.

## Человекопонятная история в docs-site (обязательно)
- [ ] Создана страница `docs-site/docs/task-story-016-<slug>.md`.
- [ ] Обновлён [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md).
- [ ] Объяснено простым языком: зачем checkpoint и лаг по источникам для эксплуатации.
- [ ] Границы: без полной фазы 5, без финальных алертов Hub.
- [ ] Ссылки на `tasks/016-phase-3-source-sync-checkpoints-lag-metrics/TASK.md`, `PLAN.md`, `REPORT.md`.
