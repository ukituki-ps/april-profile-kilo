# Карточка виджета: `entity-profile-editor`

## 1) Мета

| Поле | Значение |
|------|----------|
| `profileId` | `entity-profile` |
| `widgetId` | `entity-profile-editor` |
| `packageName` | `@april/profile-ui` |
| `contractVersion` | `v1` |
| `lifecycleStatus` | `beta` |
| Владелец | команда AprilProfile (`april-profile`) + интеграция в AprilHub (`april-worker`) |

## 2) Назначение

Виджет редактирует документ профиля сущности и отправляет событие об успешном сохранении (`onSaveSuccess`) для host-оркестрации.

## 3) Контракт интеграции

- HostContext/props/events: [`../../WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md).
- Версионирование: [`../../VERSIONING_AND_COMPATIBILITY.md`](../../VERSIONING_AND_COMPATIBILITY.md).
- Интеграционный чеклист host: [`../../WIDGET_INTEGRATION_CHECKLIST.md`](../../WIDGET_INTEGRATION_CHECKLIST.md).

Ключевые контрактные элементы:

- Вход: `hostContext`, `entityId`, `entityType`/`schemaRef`, API-клиент или `apiBaseUrl`.
- Выход: `onSaveSuccess`, `onError`, intent-события (`onAction`/`onEvent`).

## 4) Права доступа и безопасность

- Источник прав: Keycloak (роли и claims в доверенном контуре host/BFF).
- `tenant` не передаётся из пользовательского ввода; используется trusted context.
- ABAC-фильтрация остаётся в API/BFF слое и не дублируется в UI.

## 5) Зависимости

- `@april/profile-ui` (workspace/npm пакет, semver).
- API/BFF контракт профиля за Hub: `tasks/020-phase-4-profile-contract-behind-hub-bff`.
- Host proxy и OIDC-контур Hub: `tasks/021-phase-4-aprilhub-bff-proxy-admin-routes-oidc`.

## 6) Observability

- Корреляция по `requestId`/`X-Request-Id`: [`../../WIDGET_OBSERVABILITY_GUIDE.md`](../../WIDGET_OBSERVABILITY_GUIDE.md).
- На ошибках виджет должен эмитить `onError` c `requestId`.
- Минимальный smoke: рендер, успешное сохранение, ошибка API, реакция host на событие.

## 7) Ограничения и known issues

- Сквозной host-driven e2e находится в контуре AprilHub и трекается отдельной задачей.
- До полной стабилизации BFF-роутинга статус остаётся `beta`.

## 8) Артефакты (TASK/PLAN/REPORT + smoke/e2e)

- UI пакет и embed-demo: [`../../../tasks/022-phase-4-profile-ui-package-openapi-embed/TASK.md`](../../../tasks/022-phase-4-profile-ui-package-openapi-embed/TASK.md), [`../../../tasks/022-phase-4-profile-ui-package-openapi-embed/PLAN.md`](../../../tasks/022-phase-4-profile-ui-package-openapi-embed/PLAN.md), [`../../../tasks/022-phase-4-profile-ui-package-openapi-embed/REPORT.md`](../../../tasks/022-phase-4-profile-ui-package-openapi-embed/REPORT.md).
- Host proxy (AprilHub): [`../../../tasks/021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/TASK.md`](../../../tasks/021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/TASK.md), [`../../../tasks/021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/REPORT.md`](../../../tasks/021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/REPORT.md).
- Host/e2e трек: [`../../../tasks/023-phase-4-aprilhub-widget-host-e2e-smoke/TASK.md`](../../../tasks/023-phase-4-aprilhub-widget-host-e2e-smoke/TASK.md).
