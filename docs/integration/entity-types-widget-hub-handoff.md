# Handoff: встраивание `entity-types-widget` в AprilHub / BFF

Документ для команды Hub/BFF и интеграторов AprilProfile. Статус: **финализирован** по задаче [**055**](../../tasks/055-phase-7-entity-types-contract-docs-hub-handoff/TASK.md). Каноничные контракты: [`../WIDGET_CONTRACTS.md`](../WIDGET_CONTRACTS.md) (в т.ч. §9), [`../VERSIONING_AND_COMPATIBILITY.md`](../VERSIONING_AND_COMPATIBILITY.md), [`../WIDGET_INTEGRATION_CHECKLIST.md`](../WIDGET_INTEGRATION_CHECKLIST.md).

## Идентификаторы embed

| Поле | Значение |
|------|----------|
| `profileId` | `entity-types-admin` |
| `widgetId` | `entity-types-widget` |
| NPM пакет | `@april/profile-ui` (экспорт `EntityTypesWidget`, `EntityTypesWidgetCore`, `createOpenApiEntityTypesProvider`) |

## BFF: префикс и проксирование

- Использовать **тот же** договорённый префикс админского профиля, что для `ProfilesWidget` и остальных виджетов `@april/profile-ui`: **same-origin** база вида **`/admin/profile/api`** (без хардкода конкретного хоста в git), BFF снимает префикс `/admin/profile` и проксирует на AprilProfile сервисный путь **`/api`** с передачей `Authorization: Bearer <access_token>`.
- Семантика из [`tasks/020-phase-4-profile-contract-behind-hub-bff/TASK.md`](../../tasks/020-phase-4-profile-contract-behind-hub-bff/TASK.md): **tenant и субъект только из JWT**, не из query/body виджета.
- **Запрещено** направлять виджет на «любой» публичный URL профиля без того же OIDC-контура и политики BFF, что для остальных админских экранов.

## OIDC и RBAC

- Access token для вызовов API — из **той же** OIDC-сессии host, что для других админ-маршрутов AprilHub.
- На стороне AprilProfile маршруты защищены стандартным JWT middleware (`tenant_id` из claim, см. README / задача 005). Дополнительные realm-роли для админских сценариев задаются политикой продукта (ориентир в `.env.example`: `KEYCLOAK_ADMIN_REALM_ROLE` для admin-тегов OpenAPI); **конкретные имена ролей и scope** согласуются с владельцем IAM и фиксируются в спецификации host — виджет только отображает **403** безопасным текстом.
- Виджет **не** реализует авторизацию; host обязан не отображать маршрут без успешного OIDC и нужных guard.

## Endpoints, которые host / BFF обязан проксировать

Все пути ниже — относительно **`{apiBaseUrl}`** (например `/admin/profile/api`), тело и ответы — как в **`openapi/openapi.yaml`** (теги `EntityTypes`, `Profiles`).

| Метод | Путь | Назначение |
|--------|------|------------|
| `GET` | `/v1/entity-types` | Список семейств типов |
| `POST` | `/v1/entity-types` | Создать семейство + черновик |
| `GET` | `/v1/entity-types/{entityTypeID}` | Деталь семейства |
| `PATCH` | `/v1/entity-types/{entityTypeID}` | Смена namespace/code |
| `DELETE` | `/v1/entity-types/{entityTypeID}` | Удаление семейства (ограничения сервера) |
| `PUT` | `/v1/entity-types/{entityTypeID}/draft` | Сохранить черновик (409 при конфликте версии) |
| `POST` | `/v1/entity-types/{entityTypeID}/publish` | Опубликовать ревизию |
| `GET` | `/v1/entity-types/{entityTypeID}/revisions` | Список ревизий |
| `GET` | `/v1/entity-types/{entityTypeID}/revisions/by-revision-no/{revisionNo}` | Ревизия по номеру (SDK; UI опционально) |
| `GET` | `/v1/entity-types/{entityTypeID}/revisions/{revisionID}` | Ревизия по UUID |
| `GET` | `/v1/entities` | Список профилей (вкладка Upgrade: `entity_type_id`, `limit`, `cursor`, `sort`) |
| `POST` | `/v1/entities/{entityID}/upgrade-entity-type-revision` | Апгрейд одной сущности |
| `POST` | `/v1/entities/batch-upgrade-entity-type-revision` | Пакетный апгрейд |

Прокси должен пробрасывать **стандартные заголовки корреляции** (`X-Request-Id` / `X-Correlation-Id`), если они приняты в экосистеме host → BFF → Profile (см. [`../WIDGET_OBSERVABILITY_GUIDE.md`](../WIDGET_OBSERVABILITY_GUIDE.md)).

## Минимальный пример `hostContext` (TypeScript-ориентир)

Значения **`tenant`**, **`telemetry.requestId`**, **`auth`** — только из доверенного слоя host (OIDC/BFF), не из форм виджета.

```typescript
const hostContext = {
  tenant: { id: "<uuid tenant из JWT/BFF>" },
  auth: {
    subject: "<sub из токена>",
    roles: ["<realm roles при необходимости для UI host>"],
  },
  telemetry: {
    requestId: "<uuid или edge id>",
    correlationId: "<опционально>",
  },
  theme: "system",
  locale: "en",
};
```

Встраивание:

```tsx
<EntityTypesWidget
  hostContext={hostContext}
  apiBaseUrl="/admin/profile/api"
  accessToken={accessTokenFromOidc}
/>
```

## Таймауты и UX (guidance для host / BFF)

- Операции **`POST .../publish`** и **`POST .../batch-upgrade-entity-type-revision`** могут выполняться дольше типичного GET: задайте **таймаут прокси (BFF / reverse proxy)** не ниже согласованного с командой Profile SLO (на старте ориентир **60–120 s** для batch на больших выборках — уточнить по нагрузочным тестам).
- Виджет **054** блокирует повторную отправку, пока in-flight запрос не завершён; host не должен размонтировать виджет без отмены/завершения долгих мутаций без явного UX (например предупреждение «операция выполняется»).
- При **504/502** от BFF показывайте пользователю обобщённое сообщение и корреляцию по `requestId`; не подставляйте внутренние URL upstream в UI.

## Ссылки

- ADR: [`../adr/0005-entity-type-revisions-and-entity-binding.md`](../adr/0005-entity-type-revisions-and-entity-binding.md)
- Карточка виджета: [`../widgets/profile/entity-types-widget.md`](../widgets/profile/entity-types-widget.md)
- Контракт embed §9: [`../WIDGET_CONTRACTS.md`](../WIDGET_CONTRACTS.md)
- Чеклист host: [`../WIDGET_INTEGRATION_CHECKLIST.md`](../WIDGET_INTEGRATION_CHECKLIST.md)

Реализация маршрутов и OIDC-клиента во **внешнем** репозитории AprilHub — вне scope `april-profile`; при открытии issue укажите ссылку на этот handoff и на задачу **055** в трекере `april-profile`.
