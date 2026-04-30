# Отчёт: 056-micro-profiles-two-widgets-only

## Что изменено

### Пакет `@april/profile-ui`

- **Удалены** компоненты и тесты: `EntityProfileWidget`, `ProfileInstancesWidget`, `InstanceHistoryWidget`, `ConflictQueueWidget`, legacy-алиас `ProfilesListWidget`.
- **Переименован** интеграционный тест списка профилей: `ProfilesListWidget.test.tsx` → `ProfilesWidget.test.tsx` (содержимое уже тестировало `ProfilesWidget`).
- **`src/index.ts`**: экспорты только для `ProfilesWidget` / `ProfilesApiWidget` / `ProfilesWidgetCore`, `EntityTypesWidget` / `EntityTypesApiWidget` / `EntityTypesWidgetCore`, общих типов, observability, провайдеров и OpenAPI.
- **`src/types.ts`**: удалены `ProfileInstanceListItem`, `ProfileInstancesAction`.
- **`src/observability.ts`**: `ProfileWidgetTelemetryKind` сужен до `profiles_list` | `entity_types`.
- **`README.md`**: описание только двух продуктовых виджетов и актуального примера импорта.

### Shell `frontend/`

- **`src/App.tsx`**: главная страница и маршруты только для `/profiles-widget-demo`, `/entity-types-widget-demo`, showcase; добавлено демо `EntityTypesWidget`.

### Документация

- **`docs/widgets/README.md`**: в профиле `entity-profile` остался только `profiles-widget`.
- **Удалены** карточки: `docs/widgets/profile/entity-profile-editor.md`, `instance-history-widget.md`, `conflict-queue-widget.md`.
- **`docs/WIDGET_OBSERVABILITY_GUIDE.md`**, **`docs-site/docs/widget-observability-guide.md`**: актуальный список `widget` в telemetry.
- **`docs/FRONTEND_STRATEGY.md`**, **`docs-site/docs/frontend-strategy.md`**: пример встраивания заменён на `ProfilesWidget` / `EntityTypesWidget`.
- **`docs-site/docs/widget-catalog.md`**: каталог синхронизирован с двумя виджетами и путями к оставшимся карточкам.

Исторические постановки в `tasks/*` и task-stories в `docs-site` **не** переписывались (вне scope).

## Проверки

| Команда | Результат |
|---------|-----------|
| `cd frontend && npm run lint -w @april/profile-ui` | OK |
| `cd frontend && npm run test -w @april/profile-ui` | OK (22 теста) |
| `cd frontend && npm run build -w @april/profile-ui` | OK |
| `cd frontend && npm run lint:app && npm run build:app` | OK |
| `cd frontend && npm test` (shell + `@april/profile-ui`) | OK (23 теста) |

## Риски / ограничения

- **Breaking change** для потребителей npm-пакета: удалены публичные экспорты и типы перечисленных виджетов; хосты AprilHub, импортировавшие удалённые компоненты, должны перейти на `ProfilesWidget` / `EntityTypesWidget` или зафиксировать предыдущую версию пакета.
- Демо-маршруты `/profile-widget-demo`, `/profile-instances-widget-demo`, `/instance-history-widget-demo`, `/conflict-queue-widget-demo`, `/profiles-list-widget-demo` **убраны**; внешние ссылки на них перестанут работать.

## Follow-up

- При необходимости: мажорный semver релиз `@april/profile-ui` и changelog для потребителей.
- Обновление внешних репозиториев (например `april-worker`), если там ещё есть lazy-import удалённых виджетов (в этом репозитории импортов не осталось).
