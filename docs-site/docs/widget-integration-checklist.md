---
sidebar_position: 10
---

# Чеклист интеграции виджета в host (AprilHub)

> Каноническая копия: `docs/WIDGET_INTEGRATION_CHECKLIST.md`.

Перед мержем интеграции в приложение host:

## Подготовка

- [ ] Заполнена спецификация по `docs/templates/HOST_INTEGRATION_SPEC_TEMPLATE.md`.
- [ ] Версия виджета согласована с [версионированием](/docs/versioning-and-compatibility).

## Контекст и безопасность

- [ ] `HostContext` передаётся из доверенного слоя (OIDC/BFF); `tenant` совпадает с сессией.
- [ ] Маршруты и guard по ролям Keycloak настроены на host.
- [ ] Нет дублирования `MantineProvider` / корневого `Router` внутри виджета.

## Поведение

- [ ] Обработчики `onSaveSuccess`, `onError`, intent-событий реализованы; навигация выполняется на host.
- [ ] Fallback UI при ошибке загрузки виджета (lazy / error boundary) согласован.

## Наблюдаемость

- [ ] `requestId` / трассировка прокидываются в telemetry ([контракты](/docs/widget-contracts), [наблюдаемость](/docs/widget-observability-guide)).

## Проверка

- [ ] Ручной smoke: сохранение, ошибка API, сценарий «следующий» (если применимо).
- [ ] Lockfile обновлён; CI зелёный.
- [ ] Синхронизация документации выполнена: `docs/widgets/...` (канон) и страницы каталога/модели в docs-site.
