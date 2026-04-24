# Карточка виджета: `instance-history-widget`

## 1) Мета

| Поле | Значение |
|------|----------|
| `profileId` | `entity-profile` |
| `widgetId` | `instance-history-widget` |
| `packageName` | `@april/profile-ui` |
| `contractVersion` | `v1` |
| `lifecycleStatus` | `beta` |
| Владелец | команда AprilProfile (`april-profile`) + интеграция в AprilHub (`april-worker`) |

## 2) Назначение

Виджет показывает append-only историю версий конкретного экземпляра профиля: таймлайн версий, снапшот выбранной версии и diff с текущей или предыдущей версией для прозрачного аудита изменений.

## 3) Контракт интеграции

- HostContext/props/events: [`../../WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md).
- Версионирование: [`../../VERSIONING_AND_COMPATIBILITY.md`](../../VERSIONING_AND_COMPATIBILITY.md).
- Интеграционный чеклист host: [`../../WIDGET_INTEGRATION_CHECKLIST.md`](../../WIDGET_INTEGRATION_CHECKLIST.md).

Ключевые контрактные элементы:

- Вход: `hostContext`, `entityId`, `apiBaseUrl`, опционально `accessToken`.
- Выход: `onError` с безопасным сообщением и `requestId` для корреляции.
- Поведение: read-only история без mutate-операций.

## 4) Права доступа и безопасность

- Источник прав: Keycloak (роли и claims в доверенном контуре host/BFF).
- ABAC/tenant-политики исполняются backend-ом; виджет не дублирует собственную IAM-модель.
- Данные для версий читаются через API, без хранения секретов и без обхода BFF-контракта.

## 5) Зависимости

- `@april/profile-ui` (workspace/npm пакет, semver).
- OpenAPI методы `getEntityCurrentProfile` и `getEntityProfileByVersion`.
- Host proxy и OIDC-контур Hub: `tasks/021-phase-4-aprilhub-bff-proxy-admin-routes-oidc`.

## 6) Observability

- Корреляция по `requestId`/`X-Request-Id`: [`../../WIDGET_OBSERVABILITY_GUIDE.md`](../../WIDGET_OBSERVABILITY_GUIDE.md).
- Ошибки загрузки истории эмитятся через `onError` с `requestId`.
- Минимальный smoke: загрузка timeline, выбор версии, сравнение diff.

## 7) Ограничения и known issues

- В текущем API нет endpoint-а restore версии, поэтому виджет работает только в read-only режиме.
- При большом количестве версий клиент загружает историю последовательно по версиям через `GET by version`; server-side pagination остаётся follow-up.

## 8) Артефакты (TASK/PLAN/REPORT + smoke/e2e)

- Реализация виджета: [`../../../tasks/029-phase-4a-profile-instance-history-widget/TASK.md`](../../../tasks/029-phase-4a-profile-instance-history-widget/TASK.md), [`../../../tasks/029-phase-4a-profile-instance-history-widget/PLAN.md`](../../../tasks/029-phase-4a-profile-instance-history-widget/PLAN.md), [`../../../tasks/029-phase-4a-profile-instance-history-widget/REPORT.md`](../../../tasks/029-phase-4a-profile-instance-history-widget/REPORT.md).
- Host/e2e трек: [`../../../tasks/030-phase-4a-hub-instance-history-host-e2e/TASK.md`](../../../tasks/030-phase-4a-hub-instance-history-host-e2e/TASK.md).
