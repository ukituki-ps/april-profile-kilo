# Карточка виджета: `conflict-queue-widget`

## 1) Мета

| Поле | Значение |
|------|----------|
| `profileId` | `entity-profile` |
| `widgetId` | `conflict-queue-widget` |
| `packageName` | `@april/profile-ui` |
| `contractVersion` | `v1` |
| `lifecycleStatus` | `beta` |
| Владелец | команда AprilProfile (`april-profile`) + интеграция в AprilHub (`april-worker`) |

## 2) Назначение

Операторский UI для админ-API: очередь открытых конфликтов authority по полям профиля, ручное разрешение с фиксацией выбранного значения и явный merge дубликатов сущностей (source → target) с отображением краткого результата операции.

## 3) Контракт интеграции

- HostContext/props/events: [`../../WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md).
- Версионирование: [`../../VERSIONING_AND_COMPATIBILITY.md`](../../VERSIONING_AND_COMPATIBILITY.md).
- Интеграционный чеклист host: [`../../WIDGET_INTEGRATION_CHECKLIST.md`](../../WIDGET_INTEGRATION_CHECKLIST.md).

Ключевые контрактные элементы:

- Вход: `hostContext`, `apiBaseUrl`, опционально `accessToken`.
- Выход: `onError` с безопасным сообщением и опциональным `requestId` из ответа API.
- Поведение: вызовы `AdminService` (`listProfileFieldConflicts`, `resolveProfileFieldConflict`, `mergeEntityProfiles`).

## 4) Права доступа и безопасность

- Источник прав: Keycloak (realm-роль админа и tenant claim в JWT); виджет не реализует собственную RBAC-модель.
- Операции изменяют данные только через задокументированные admin-маршруты; при `403` показывается объяснение без утечки внутренних деталей политики.

## 5) Зависимости

- `@april/profile-ui` (workspace/npm пакет, semver).
- OpenAPI `AdminService` из `openapi/openapi.yaml`.
- Host proxy и OIDC-контур Hub: `tasks/021-phase-4-aprilhub-bff-proxy-admin-routes-oidc`; полноценный host — `tasks/032-phase-4a-hub-conflicts-merge-host-rbac`.

## 6) Observability

- Корреляция: при ошибках сервер может вернуть `request_id` в JSON — виджет показывает его рядом с текстом ошибки.
- Успешные операции: сводка по `entity_id`/`version` (resolve) или `target_entity_id`/`target_version` (merge).

## 7) Ограничения и known issues

- Список конфликтов фильтруется на клиенте (API списка без query-параметров); при очень больших очередях потребуется серверная пагинация отдельной задачей.
- Отдельный «business operation id» в UI не показывается сверх полей ответа API и `request_id` в ошибках.

## 8) Артефакты (TASK/PLAN/REPORT + smoke/e2e)

- Реализация: [`../../../tasks/031-phase-4a-profile-conflicts-merge-admin-ui/TASK.md`](../../../tasks/031-phase-4a-profile-conflicts-merge-admin-ui/TASK.md), [`../../../tasks/031-phase-4a-profile-conflicts-merge-admin-ui/PLAN.md`](../../../tasks/031-phase-4a-profile-conflicts-merge-admin-ui/PLAN.md), [`../../../tasks/031-phase-4a-profile-conflicts-merge-admin-ui/REPORT.md`](../../../tasks/031-phase-4a-profile-conflicts-merge-admin-ui/REPORT.md).
- Host/e2e: [`../../../tasks/032-phase-4a-hub-conflicts-merge-host-rbac/TASK.md`](../../../tasks/032-phase-4a-hub-conflicts-merge-host-rbac/TASK.md).
