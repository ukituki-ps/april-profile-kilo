---
sidebar_position: 45
---

# 033 — События наблюдаемости виджетов и semver для `@april/profile-ui`

## Какая была проблема

У продуктовых виджетов фазы 4a не было единого способа сообщать host (AprilHub), что экран реально загрузился, что сохранение началось или завершилось с ошибкой. Без этого сложно строить метрики, алерты и разбор инцидентов в одной цепочке с `request_id` бэкенда. Параллельно не было явных semver-правил для npm-пакета виджетов, чтобы обновления в Hub не приносили скрытых breaking изменений.

## Что сделали

- В `@april/profile-ui` добавлен опциональный колбэк **`onObservability`** для всех целевых виджетов: `EntityProfileWidget`, `ProfilesListWidget`, `ProfileInstancesWidget`, `InstanceHistoryWidget`, `ConflictQueueWidget`.
- Зафиксирован единый набор имён событий: **`view_loaded`**, **`save_submitted`**, **`save_succeeded`**, **`save_failed`**; в payload — **`request_id`** и **`correlation_id`** из `hostContext.telemetry` (плюс опционально **`api_request_id`** из тела ошибки админ-API).
- Экспортированы типы и хелперы (`ProfileWidgetTelemetryEvent`, `emitProfileWidgetTelemetry`, …), версия пакета поднята до **0.2.0** (minor: новые optional API).
- В `docs/VERSIONING_AND_COMPATIBILITY.md` добавлен подпараграф **§1.1** про PATCH/MINOR/MAJOR и release notes для `@april/profile-ui`; обновлены `WIDGET_OBSERVABILITY_GUIDE`, `WIDGET_CONTRACTS` и зеркала на docs-site.
- Добавлены unit-тесты на корреляцию и проверка эмиссии в `EntityProfileWidget`; общий прогон `npm run test` во `frontend/` теперь включает тесты workspace `@april/profile-ui`.

## Зачем это бизнесу и поддержке

- Host может подключить один канал (лог, продуктовая аналитика, шина событий) и получать предсказуемые сигналы по сценариям профиля без копирования логики из каждого виджета.
- Semver и чеклист release notes снижают риск «тихого» поломания Hub при обновлении lockfile.

## Как интегратору проверять совместимость версий

1. Смотреть **major** пакета `@april/profile-ui`: major означает согласованные ломающие изменения props или контракта событий — читать changelog и обновлять host-код.
2. **Minor** (например 0.1 → 0.2): обычно достаточно обновить зависимость и при желании начать вызывать новые optional API; прогнать typecheck и smoke-сценарии профиля в Hub.
3. **Patch**: точечные исправления; при неизменном публичном API достаточно регрессии по критичным сценариям.

Подробные правила — в `docs/VERSIONING_AND_COMPATIBILITY.md` §1.1 (корень репозитория).

## Как проверить без чтения кода

1. `make docs-build`
2. `cd frontend && npm ci && npm run lint && npm run test && npm run build`
3. В приложении передать в виджет `onObservability={(e) => …}` и `hostContext.telemetry` с `requestId` / при необходимости `correlationId`; выполнить загрузку и сохранение — убедиться, что приходят ожидаемые `event` и идентификаторы.

## Границы и follow-up

- **Не сделано в этой задаче:** дашборды, алерты и release gates в AprilHub — задача `034` (`tasks/034-phase-4a-hub-widget-release-gates-smoke/TASK.md`).
- **E2E корреляция host ↔ BFF ↔ Profile:** зависит от того, что Hub пробрасывает `X-Request-Id` / `X-Correlation-Id` и то же кладёт в `HostContext.telemetry`; при расхождении на стенде нужен отдельный интеграционный чек в Hub (см. `docs/WIDGET_OBSERVABILITY_GUIDE.md`).

## Ссылки на артефакты

- `tasks/033-phase-4a-profile-widget-observability-semver/TASK.md`
- `tasks/033-phase-4a-profile-widget-observability-semver/PLAN.md`
- `tasks/033-phase-4a-profile-widget-observability-semver/REPORT.md`
