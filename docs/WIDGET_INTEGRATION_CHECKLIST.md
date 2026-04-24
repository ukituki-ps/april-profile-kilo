# Чеклист интеграции виджета в host (AprilHub)

> Опубликованная копия: `docs-site/docs/widget-integration-checklist.md`.

Перед мержем интеграции в приложение host:

## Подготовка

- [ ] Заполнена спецификация по [`templates/HOST_INTEGRATION_SPEC_TEMPLATE.md`](./templates/HOST_INTEGRATION_SPEC_TEMPLATE.md).
- [ ] Версия виджета согласована с [`VERSIONING_AND_COMPATIBILITY.md`](./VERSIONING_AND_COMPATIBILITY.md).

## Контекст и безопасность

- [ ] `HostContext` передаётся из доверенного слоя (OIDC/BFF); `tenant` совпадает с сессией.
- [ ] Маршруты и guard по ролям Keycloak настроены на host.
- [ ] Нет дублирования `MantineProvider` / корневого `Router` внутри виджета.

## Поведение

- [ ] Обработчики `onSaveSuccess`, `onError`, intent-событий реализованы; навигация выполняется на host.
- [ ] Fallback UI при ошибке загрузки виджета (lazy / error boundary) согласован.

## Наблюдаемость

- [ ] `requestId` / трассировка прокидываются в [`WIDGET_CONTRACTS.md`](./WIDGET_CONTRACTS.md) telemetry ([`WIDGET_OBSERVABILITY_GUIDE.md`](./WIDGET_OBSERVABILITY_GUIDE.md)).

## Проверка

- [ ] Ручной smoke: сохранение, ошибка API, сценарий «следующий» (если применимо).
- [ ] Lockfile обновлён; CI зелёный.
- [ ] Синхронизация документации выполнена: `docs/widgets/...` (канон) и `docs-site/docs/widget-catalog.md` / `docs-site/docs/widget-docs-operating-model.md` (человекопонятный слой).
