# Handoff: встраивание `entity-types-widget` в AprilHub / BFF

Документ для команды Hub/BFF и интеграторов AprilProfile. Контент обновляется по мере задач [**055**](../../tasks/055-phase-7-entity-types-contract-docs-hub-handoff/TASK.md); canonical контракты — [`../WIDGET_CONTRACTS.md`](../WIDGET_CONTRACTS.md), [`../VERSIONING_AND_COMPATIBILITY.md`](../VERSIONING_AND_COMPATIBILITY.md).

## Идентификаторы

| Поле | Значение |
|------|----------|
| `profileId` | `entity-types-admin` |
| `widgetId` | `entity-types-widget` |
| NPM пакет | `@april/profile-ui` |

## Маршрутизация API

- Проксировать те же базовые правила, что и для профильных виджетов админской зоны: префикс BFF **`/admin/profile/`** к AprilProfile или согласованный общий префикс после синхронизации с [`tasks/020-phase-4-profile-contract-behind-hub-bff/TASK.md`](../../tasks/020-phase-4-profile-contract-behind-hub-bff/TASK.md)).
- После задачи [**053**](../../tasks/053-phase-7-entity-type-revisions-backend-api-profile-integration/TASK.md) использовать **полный целевой** набор путей OpenAPI каталога типов и апгрейда сущностей (перечень — в финальном `openapi/openapi.yaml`).

## OIDC и RBAC

- Потребителей уровня данных вынести в realm-политики (аналог уже используемого `KEYCLOAK_ADMIN_REALM_ROLE` для `/v1/admin/*` в `.env.example`).
- Конкретное имя роли/schema claim — согласовать с продуктовой моделью; **виджет не реализует авторизацию**, только безопасно отображает 403.

## Props и host context

Минимум:

- `apiBaseUrl` — база API за BFF;
- OIDC-поток через host (передаётся `accessToken` или эквивалент);
- `hostContext`: tenant уже зафиксирован доверенным контуром (**не из тела пользовательских форм виджета**).

## UX и производительность

- Операции `publish` и `batch upgrade` могут быть медленнее обычного CRUD: настройте таймауты прокси и отображение прогресса на стороне виджета (после 054 не отключать блокировку повторной отправки в flight).

## Ссылки

- ADR домена: [`../adr/0005-entity-type-revisions-and-entity-binding.md`](../adr/0005-entity-type-revisions-and-entity-binding.md)
- Карточка виджета: [`../widgets/profile/entity-types-widget.md`](../widgets/profile/entity-types-widget.md)
