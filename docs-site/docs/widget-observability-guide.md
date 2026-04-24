---
sidebar_position: 11
---

# Наблюдаемость виджетов и host

**Связанные документы:** [Контракты виджетов](/docs/widget-contracts), [Стратегия фронтенда](/docs/frontend-strategy).

> Каноническая копия: `docs/WIDGET_OBSERVABILITY_GUIDE.md`.

Цель: единая корреляция запросов host → BFF → сервисы April и понятные сигналы для поддержки.

---

## 1. Telemetry contract (минимум)

| Поле | Где задаётся | Назначение |
|------|----------------|------------|
| `requestId` | Host генерирует или пробрасывает с edge; передаётся в `HostContext.telemetry` | Связка логов UI и бэкенда в одном запросе. |
| `correlationId` | Опционально в `HostContext.telemetry` | Сквозная корреляция; в событиях `@april/profile-ui` — поле `correlation_id` (при отсутствии совпадает с `requestId`). |
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

Опциональный колбэк `onObservability(event)`; в событии — `request_id` / `correlation_id` из telemetry host, при необходимости `api_request_id` из тела ошибки API.

| `event` | Смысл |
|---------|--------|
| `view_loaded` | Успешная первичная загрузка данных виджета. |
| `save_submitted` | Старт мутации в API (после локальной валидации). |
| `save_succeeded` | Успешный ответ API. |
| `save_failed` | Валидация до API или ошибка API. |

Стабильные `widget`: `entity_profile`, `profiles_list`, `profile_instances`, `instance_history`, `conflict_queue`. Подробности — канонический файл в корне репозитория `docs/WIDGET_OBSERVABILITY_GUIDE.md` §3.1.

---

## 4. Error boundary и fallback UI

- Host оборачивает виджет в error boundary уровня сценария.
- При ошибке рендера: запасной блок («не удалось загрузить блок») + ссылка на повтор или возврат в список.
- Не показывать stack trace пользователю.

---

## 5. Корреляция с бэкендом

Идентификаторы из ADR и OpenAPI (`entity_id`, `tenant_id`) в логах API — в связке с `request_id` из HTTP; при разборе инцидента цепочка: **user/session → requestId → entity/tenant**.
