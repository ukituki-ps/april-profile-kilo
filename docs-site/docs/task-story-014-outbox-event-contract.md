---
sidebar_position: 28
---

# 014 — Контракт события профиля, transactional outbox и идемпотентность публикации

## Что поменялось

- Зафиксирован **минимальный контракт** исходящего события (ADR-0003): `tenant_id`, `entity_id`, `entity_type`, `profile_version`, `occurred_at`, `event_id` — как структура Go и JSON в колонке `payload` таблицы **`profile_outbox`**.
- **`event_id`** детерминирован (UUID v5) от `(tenant_id, entity_id, profile_version)`, чтобы повторные попытки не порождали другой идентификатор для той же логической версии.
- При каждой **новой версии профиля** (создание, обновление, ручной resolve конфликта, merge дубликатов) в **той же транзакции**, что и вставка в `profile_versions`, добавляется строка outbox.
- **Идемпотентность на стороне записи в outbox**: уникальность `(tenant_id, entity_id, profile_version)`; повторная вставка с тем же ключом отбрасывается (`ON CONFLICT DO NOTHING`).
- **Публикация наружу** в этой задаче не реализована: после задачи **015** новая строка outbox создаётся со статусом **`pending`**, а перевод в **`published`** выполняет фоновый воркер **Asynq** с заглушкой `Publisher` (см. `tasks/015-phase-3-asynq-infra-ping-domain-task/`).

## Зачем это нужно

Интеграции (другие сервисы April, аналитика, поиск) должны получать **надёжные уведомления об изменении профиля** без потери при сбоях и без дубликатов при повторной доставке. **Transactional outbox** гарантирует: если версия профиля зафиксирована в БД, событие для неё тоже записано — нет рассинхрона «профиль обновился, а событие потерялось». **Идемпотентный ключ** по версии и детерминированный `event_id` упрощают потребителей при at-least-once доставке.

## Границы задачи

**Сделано:** схема БД, контракт события, запись в outbox в транзакции с доменным изменением, тесты.

**Не входило:** внешняя доставка (HTTP, брокер), идемпотентность на стороне внешних систем, воркер **Asynq** (`tasks/015-phase-3-asynq-infra-ping-domain-task/TASK.md`), ретраи/DLQ (`tasks/017-phase-3-async-retries-dlq/TASK.md`).

## Как проверить без чтения кода

```bash
go vet ./...
go test ./...
go test -tags=integration ./internal/integrationtest/...
make migrate-validate
make docs-build
```

## Официальные артефакты

- Постановка: `tasks/014-phase-3-outbox-event-contract-idempotency/TASK.md`
- План: `tasks/014-phase-3-outbox-event-contract-idempotency/PLAN.md`
- Отчёт: `tasks/014-phase-3-outbox-event-contract-idempotency/REPORT.md`
- Дорожная карта (родитель): `tasks/000-full-service-aprilhub-roadmap/PLAN.md`
