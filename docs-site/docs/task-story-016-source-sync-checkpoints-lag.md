---
sidebar_position: 30
---

# 016 — Синк с checkpoint и lag-метрики по source_system

## Что поменялось

- Добавлена Atlas-миграция с таблицами **`source_sync_checkpoints`** (курсор и watermark по `tenant_id` + `source_system`) и **`source_sync_applied_events`** (идемпотентный журнал применённых событий).
- В воркер Asynq добавлена новая периодическая задача **`april:source_sync:batch`** (очередь **`sync`**): она читает батч изменений из `SourceClient`, применяет события идемпотентно и обновляет checkpoint.
- Для каждого tenant/source обновляется lag-метрика **`april_profile_source_sync_lag_seconds{tenant_id,source_system}`**.
- Добавлены env-параметры воркера: `ASYNQ_SYNC_INTERVAL`, `SYNC_BATCH_SIZE`, `SYNC_SOURCE_SYSTEMS`.
- Реализован `NoopSourceClient` как безопасная заглушка до включения реальных внешних интеграций (фаза 5).

## Зачем это нужно

Команде эксплуатации нужен ранний сигнал "насколько мы отстаём от источника", даже до подключения боевых интеграций. Checkpoint и идемпотентный журнал дают стабильную основу: повторный запуск батча не дублирует уже обработанные события, а lag-метрика показывает текущий технический долг синка по каждому `source_system`.

## Границы задачи

**Сделано:** каркас синхронизации в воркере, checkpoint в БД, lag-метрика Prometheus, unit/integration тесты.

**Не входило:** полноценные клиентские интеграции с AprilOrgFlow/EDC (фаза 5), дашборды/алерты Grafana, финальная политика DLQ/ретраев (задача 017).

## Как проверить без чтения кода

```bash
go vet ./...
go test ./...
go test -tags=integration ./...
docker run --rm -v "$(pwd)/atlas/migrations:/migrations" arigaio/atlas:latest migrate validate --dir "file:///migrations"
```

Интеграционный сценарий `TestAsynq_sourceSync_checkpointAndLagMetric` повторно запускает sync-task и проверяет, что запись событий остаётся идемпотентной, checkpoint обновляется, а lag-метрика публикуется.

## Официальные артефакты

- Постановка: `tasks/016-phase-3-source-sync-checkpoints-lag-metrics/TASK.md`
- План: `tasks/016-phase-3-source-sync-checkpoints-lag-metrics/PLAN.md`
- Отчёт: `tasks/016-phase-3-source-sync-checkpoints-lag-metrics/REPORT.md`
- Родитель: `tasks/000-full-service-aprilhub-roadmap/PLAN.md`
