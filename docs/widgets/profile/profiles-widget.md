# Карточка виджета: `profiles-widget`

## 1) Мета

| Поле | Значение |
|------|----------|
| `profileId` | `entity-profile` |
| `widgetId` | `profiles-widget` |
| `packageName` | `@april/profile-ui` |
| `contractVersion` | `v1` |
| `lifecycleStatus` | `beta` |
| Владелец | команда AprilProfile (`april-profile`) + интеграция в AprilHub (`april-worker`) |

## 2) Назначение

Виджет `Profiles` предоставляет основной master-detail UX для управления профилями сущностей: слева список профилей с поиском/фильтрацией/дозагрузкой, справа карточка выбранного профиля с просмотром и редактированием, плюс создание нового профиля через модальное окно.

## 3) Контракт интеграции

- HostContext/props/events: [`../../WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md).
- Версионирование: [`../../VERSIONING_AND_COMPATIBILITY.md`](../../VERSIONING_AND_COMPATIBILITY.md).
- Интеграционный чеклист host: [`../../WIDGET_INTEGRATION_CHECKLIST.md`](../../WIDGET_INTEGRATION_CHECKLIST.md).

Ключевые контрактные элементы:

- Вход: `hostContext`, `apiBaseUrl`, `entityIds`, опционально `accessToken`, `pageSize`.
- Выход: `onAction` (`created`/`updated`/`deleted`), `onError` с безопасным сообщением и `requestId`.
- Поведение: DS-first layout 25/75 (`CardListColumn` + профильная карточка).

## 4) Права доступа и безопасность

- Источник прав: Keycloak (роли и claims в доверенном контуре host/BFF).
- ABAC/tenant-политики применяются backend-ом; виджет не дублирует IAM-логику.
- API-ошибки (`401/403/409`) отображаются через безопасные сообщения без утечки внутренних деталей.

## 5) Зависимости

- `@april/profile-ui` (workspace/npm пакет, semver).
- `@april/ui` (`CardListColumn`) как основной DS-компонент списка.
- OpenAPI методы `getEntityCurrentProfile`, `createEntityProfile`, `updateEntityProfile`, `deleteEntityProfile`.

## 6) Observability

- Корреляция по `requestId`/`X-Request-Id`: [`../../WIDGET_OBSERVABILITY_GUIDE.md`](../../WIDGET_OBSERVABILITY_GUIDE.md).
- События: `view_loaded`, `save_submitted`, `save_succeeded`, `save_failed` для `widget = profiles_list` (backward-compatible telemetry key).
- Минимальный smoke: загрузка списка, create/update/delete, обработка API-ошибок.

## 7) Ограничения и known issues

- Источник списка остаётся входным набором `entityIds`; серверный list endpoint пока не используется.
- `ProfilesListWidget` оставлен как alias для обратной совместимости существующих embed-сценариев.

## 8) Артефакты (TASK/PLAN/REPORT + smoke/e2e)

- Выделение `Profiles` из `widget-card`: [`../../../tasks/041-phase-5-widget-card-to-profiles-widget/TASK.md`](../../../tasks/041-phase-5-widget-card-to-profiles-widget/TASK.md), [`../../../tasks/041-phase-5-widget-card-to-profiles-widget/PLAN.md`](../../../tasks/041-phase-5-widget-card-to-profiles-widget/PLAN.md), [`../../../tasks/041-phase-5-widget-card-to-profiles-widget/REPORT.md`](../../../tasks/041-phase-5-widget-card-to-profiles-widget/REPORT.md).
- Базовый CRUD-виджет (историческая база): [`../../../tasks/025-phase-4a-profile-profiles-list-crud-widget/TASK.md`](../../../tasks/025-phase-4a-profile-profiles-list-crud-widget/TASK.md).
- UX-модернизация `widget-card`: [`../../../tasks/040-phase-5-widget-card-layout-modernization/TASK.md`](../../../tasks/040-phase-5-widget-card-layout-modernization/TASK.md).
