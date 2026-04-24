# Наблюдаемость виджетов и host

> Связанные документы: [`WIDGET_CONTRACTS.md`](./WIDGET_CONTRACTS.md), [`FRONTEND_STRATEGY.md`](./FRONTEND_STRATEGY.md).  
> Опубликованная копия: `docs-site/docs/widget-observability-guide.md`.

Цель: единая корреляция запросов host → BFF → сервисы April и понятные сигналы для поддержки.

---

## 1. Telemetry contract (минимум)

| Поле | Где задаётся | Назначение |
|------|----------------|------------|
| `requestId` | Host генерирует или пробрасывает с edge; передаётся в `HostContext.telemetry` | Связка логов UI и бэкенда в одном запросе. |
| `correlationId` | Опционально в `HostContext.telemetry` | Сквозная корреляция (edge / mesh); в событиях `@april/profile-ui` дублируется как `correlation_id`, при отсутствии совпадает с `requestId`. |
| `traceId` / `spanId` | При наличии OpenTelemetry в Hub — опционально | End-to-end трассировка. |

Виджет при вызове API должен передавать `requestId` в заголовке (например `X-Request-Id`) согласно соглашению BFF.

---

## 2. Логирование (клиент)

- **Успех:** не спамить production-логами; достаточно метрик/аналитики по политике продукта.
- **Ошибки:** логировать с `requestId`, кодом ошибки API, **без** PII в открытом виде.
- **События виджета:** `onError` с `{ message, requestId? }` для отображения пользователю и дублирования в лог host.

---

## 3. Минимальный набор метрик/событий мониторинга

| Событие | Смысл |
|---------|--------|
| Виджет смонтирован | Базовая активность сценария (при необходимости sampling). |
| Сохранение успешно | Соответствует `onSaveSuccess`. |
| Ошибка API / валидации | Соответствует `onError`; алерты по rate на стороне API. |
| Долгий запрос | Порог latency на BFF (SLO по договорённости с Hub). |

Конкретная реализация (Prometheus, продуктовая аналитика) — по runbook AprilHub; виджет не внедряет отдельный стек без согласования.

### 3.1. Единый минимум `@april/profile-ui` (фаза 4a)

Все продуктовые виджеты пакета поддерживают опциональный колбэк `onObservability(event)`. Поля `request_id` и `correlation_id` в событии заполняются из `HostContext.telemetry` (`requestId`, опционально `correlationId`). При ошибках админ-API в поле `api_request_id` может передаваться `request_id` из JSON-тела ответа (если отличается от host-корреляции).

| Имя события (`event`) | Когда эмитится |
|-----------------------|----------------|
| `view_loaded` | Успешная первичная загрузка данных виджета (список/форма/история/очередь). |
| `save_submitted` | Начало мутации, уходящей в API (после клиентской валидации, если она есть). |
| `save_succeeded` | Успешный ответ API для этой мутации. |
| `save_failed` | Ошибка валидации до API или ошибка/отказ API для мутации. |

Стабильные значения `widget` в payload: `entity_profile`, `profiles_list`, `profile_instances`, `instance_history`, `conflict_queue`. Дополнительный контекст без PII — в `meta` (например `operation`, `phase`).

Типы и хелперы экспортируются из `@april/profile-ui` (`ProfileWidgetTelemetryEvent`, `emitProfileWidgetTelemetry`, …).

---

## 4. Error boundary и fallback UI

- Host оборачивает виджет в error boundary уровня сценария.
- При ошибке рендера: запасной блок («не удалось загрузить блок») + ссылка на повтор или возврат в список.
- Не показывать stack trace пользователю.

---

## 5. Корреляция с бэкендом

Идентификаторы из ADR и OpenAPI (`entity_id`, `tenant_id`) в логах API — в связке с `request_id` из HTTP; при разборе инцидента цепочка: **user/session → requestId → entity/tenant**.
