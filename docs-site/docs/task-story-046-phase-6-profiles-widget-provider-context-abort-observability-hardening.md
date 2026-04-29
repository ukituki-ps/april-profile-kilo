---
sidebar_position: 246
---

# 046 - provider context, abort и observability hardening

## Проблема

После задачи 045 контракт стал точнее, но транспортный слой все еще имел production-риск:

- `ProviderContext` был упрощенным;
- отмена запросов фактически сводилась к игнорированию устаревших ответов;
- OpenAPI runtime менялся глобально (`OpenAPI.BASE/TOKEN`), что создавало риск гонок при нескольких виджетах;
- observability не покрывала transport-фазы list/details.

## Что сделали

1. Ввели полноценный `ProviderContext`:
   - `tenantId`
   - `auth` (`accessToken`, `subject`, `roles`)
   - `telemetry` (`requestId`, `correlationId`)
   - `signal`.
2. В `ProfilesApiWidget` добавили формирование базового provider context из `hostContext` + `accessToken`.
3. В `ProfilesWidgetCore` внедрили реальный `AbortController` lifecycle:
   - list-запросы отменяются при новом запросе и на unmount;
   - details-запросы отменяются при смене selected entity и на cleanup.
4. Добавили transport observability события:
   - `list_requested`, `list_succeeded`, `list_failed`
   - `details_requested`, `details_failed`
   - с метаданными (`operation`, `entity_id`, `row_count`, `has_next_cursor`, `latency_ms`, `error_code`, `phase`).
5. Переписали `openapiProfilesProvider` на request-scoped конфигурацию через `generated/core/request` (без глобальной мутации `OpenAPI`), с поддержкой отмены через `signal`.
6. Расширили тесты `ProfilesWidgetCore` на abort/race + telemetry поведение.

## Что это дает

- Снижается риск race-condition в multi-widget сценариях.
- Запросы реально прерываются, а не просто «замалчиваются» после ответа.
- Трассировка list/details становится диагностируемой в production.
- Контур варианта C становится ближе к production-grade baseline.

## Как проверить без чтения кода

Из корня `frontend/`:

```bash
npm run lint -w @april/profile-ui
npm run test -w @april/profile-ui
npm run build -w @april/profile-ui
```

Ожидаемый результат: все команды проходят успешно.

## Границы задачи

Что сделано:

- transport/context/abort/observability hardening только для `ProfilesWidget`.

Что оставлено на follow-up:

- финальный release gate и расширенная тестовая матрица для всего жизненного цикла (задача 047).

## Артефакты

- [`tasks/046-phase-6-profiles-widget-provider-context-abort-observability-hardening/TASK.md`](../../tasks/046-phase-6-profiles-widget-provider-context-abort-observability-hardening/TASK.md)
- [`tasks/046-phase-6-profiles-widget-provider-context-abort-observability-hardening/PLAN.md`](../../tasks/046-phase-6-profiles-widget-provider-context-abort-observability-hardening/PLAN.md)
- [`tasks/046-phase-6-profiles-widget-provider-context-abort-observability-hardening/REPORT.md`](../../tasks/046-phase-6-profiles-widget-provider-context-abort-observability-hardening/REPORT.md)
