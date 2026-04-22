---
sidebar_position: 20
---

# Задачи на пальцах

Этот раздел нужен как "человеческий журнал прогресса": что именно сделали по каждой задаче, зачем это было нужно бизнесу и как это проверить без чтения кода.

## Как читать раздел

- Для каждой задачи есть отдельная страница с форматом "проблема -> что сделали -> что это дает -> как проверить".
- Технические детали и точные артефакты остаются в `tasks/<id>/TASK.md`, `PLAN.md`, `REPORT.md`.
- В этом разделе описываем только то, что реально сделано и проверено.

## Список

- [000 — Дорожная карта сервиса + интеграция AprilHub](./task-story-000-roadmap)
- [Планирование — дизайн AprilProfile и ADR](./task-story-planning-design-adr)
- [002 — CI/деплой-база: runner, переменные, smoke dev](./task-story-002-ci-secrets-smoke)
- [003 — Гибридная UI-модель и governance](./task-story-003-hybrid-ui-governance)
- [004 — Go-модуль, Atlas и стартовая схема БД](./task-story-004-go-atlas-tenant)
- [005 — JWT Keycloak и `tenant_id` из доверенного контекста](./task-story-005-keycloak-jwt-tenant)
- [006 — `/healthz`, `/readyz` и синхронизация OpenAPI](./task-story-006-health-openapi)
- [007 — Docker-образ backend, ghcr и compose-деплой](./task-story-007-docker-ghcr-compose-deploy)
- [008 — Логи, `request_id`, readiness от БД/Redis и env-конфиг](./task-story-008-observability-config-readiness-deps)
- [009 — Интеграционные тесты с PostgreSQL/Redis и Atlas](./task-story-009-integration-tests-db-redis)
- [010 — Каталог типов сущностей и OpenAPI-контракт](./task-story-010-entity-types-openapi)
- [011 — CRUD сущностей и append-only версии профиля](./task-story-011-entity-crud-versioning)
- [012 — Authority, конфликты и merge дубликатов](./task-story-012-authority-merge-conflicts)
- [013 — ABAC: фильтрация выдачи по сегментам полей](./task-story-013-abac-field-filtering)
- [014 — События профиля: outbox и идемпотентность публикации](./task-story-014-outbox-event-contract)
- [015 — Asynq: воркер, ping и батч outbox](./task-story-015-asynq-outbox-worker)
- [016 — Синк с checkpoint и lag-метрики по источникам](./task-story-016-source-sync-checkpoints-lag)
- [017 — Ретраи и DLQ для фоновых задач (Asynq, outbox, синк)](./task-story-017-async-retries-dlq)
- [018 — Prometheus `/metrics`, логи под Loki, корреляция с Hub](./task-story-018-phase-4-prometheus-metrics-logs-correlation)

## Быстрый статус

| Задача | Статус | Где детали | Ключевой эффект |
|---|---|---|---|
| 000 roadmap | ✅ | [000](./task-story-000-roadmap) | Зафиксирован порядок фаз и зависимостей |
| Планирование (дизайн + ADR) | ✅ | [Планирование](./task-story-planning-design-adr) | Архитектурные решения формализованы до кода |
| 002 CI/dev smoke | ✅ | [002](./task-story-002-ci-secrets-smoke) | Рабочий контур деплоя и инфраструктурного smoke |
| 003 hybrid UI governance | ✅ | [003](./task-story-003-hybrid-ui-governance) | Единые правила Host/Widget/API-BFF интеграции |
| 004 Go + Atlas + tenant schema | ✅ | [004](./task-story-004-go-atlas-tenant) | Базовый backend-фундамент и миграции |
| 005 JWT + trusted tenant context | ✅ | [005](./task-story-005-keycloak-jwt-tenant) | `tenant_id` только из валидного JWT |
| 006 health + readiness + OpenAPI sync | ✅ | [006](./task-story-006-health-openapi) | Появились публичные `/healthz` и `/readyz`, контракт синхронизирован |
| 007 docker + ghcr + compose deploy | ✅ | [007](./task-story-007-docker-ghcr-compose-deploy) | Backend собирается в образ и разворачивается по SHA через compose |
| 008 logs + request_id + dependency readiness | ✅ | [008](./task-story-008-observability-config-readiness-deps) | Логи структурированы, readiness зависит от БД/Redis, env валидируется при старте |
| 009 integration tests (Postgres/Redis/Atlas) | ✅ | [009](./task-story-009-integration-tests-db-redis) | Интеграционный контур проверяет миграции и readiness на реальных контейнерах |
| 010 entity types catalog + OpenAPI | ✅ | [010](./task-story-010-entity-types-openapi) | Появился каталог типов с `draft/published` и публикацией схем |
| 011 entity CRUD + append-only versioning | ✅ | [011](./task-story-011-entity-crud-versioning) | Реализован базовый CRUD профилей с history current/by-version и external mappings |
| 012 authority + conflicts + merge audit | ✅ | [012](./task-story-012-authority-merge-conflicts) | Очередь конфликтов, ручной resolve, merge дубликатов с аудитом и админ-API |
| 013 ABAC field filtering on read | ✅ | [013](./task-story-013-abac-field-filtering) | GET профиля: выдача `document` по сегментам и realm-ролям JWT (`ABAC_SEGMENT_ACCESS_JSON`) |
| 014 outbox + event contract + idempotent publish | ✅ | [014](./task-story-014-outbox-event-contract) | Таблица `profile_outbox`, событие ADR-0003 в транзакции с новой версией профиля |
| 015 Asynq worker + ping + outbox batch | ✅ | [015](./task-story-015-asynq-outbox-worker) | Фоновый `april-worker`, ping в Redis, батч `pending` → `published` через заглушку Publisher |
| 016 source sync checkpoint + lag metrics | ✅ | [016](./task-story-016-source-sync-checkpoints-lag) | Появились checkpoint по tenant/source, идемпотентный sync-batch и метрика `april_profile_source_sync_lag_seconds` |
| 017 async retries + DLQ | ✅ | [017](./task-story-017-async-retries-dlq) | Ретраи Asynq и per-row outbox, DLQ в БД (`failed`), backoff и интеграционные тесты |
| 018 Prometheus + логи + корреляция | ✅ | [018](./task-story-018-phase-4-prometheus-metrics-logs-correlation) | `GET /metrics`, JSON-логи, `X-Request-Id` / `X-Correlation-Id`, поля `requestId` / `correlationId` |
