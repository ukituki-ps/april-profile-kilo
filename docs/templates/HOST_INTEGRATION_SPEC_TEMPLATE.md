# Спецификация интеграции в host: `<сценарий / экран>`

## Мета

| Поле | Значение |
|------|----------|
| Приложение host | AprilHub (ветка/версия) |
| Маршрут(ы) | |
| Виджет(и) `@april/...` | версии |
| Ответственный за merge | |

## Сценарий пользователя

Краткое описание потока и ожидаемой навигации (в т.ч. «следующая карточка», выход).

## Передача HostContext

Откуда берутся `tenant`, `auth`, `telemetry.requestId` (провайдер сессии, layout).

## Обработка событий виджета

| Событие от виджета | Действие host (navigate, refresh, toast) |
|--------------------|------------------------------------------|
| `onSaveSuccess` | |
| `onError` | |
| intent / `onAction` | |

## Безопасность

- Route guards (роли Keycloak).
- Соответствие ABAC (данные только через BFF).

## Fallback и ошибки

- Поведение при падении виджета (error boundary).
- Поведение при 4xx/5xx API.

## Тестирование

- Smoke-сценарии для релиза.
- Ссылки на e2e (если есть).

## Ссылки

- [`docs/WIDGET_INTEGRATION_CHECKLIST.md`](../WIDGET_INTEGRATION_CHECKLIST.md)
- [`docs/WIDGET_CONTRACTS.md`](../WIDGET_CONTRACTS.md)
