# Задача 058 (фаза 7): `@april/profile-ui` — JSON-редакторы дизайн-системы в `profiles-widget`

## Мета

- **ID / ветка (рекомендуется):** `feature/task-058-phase-7-profile-ui-ds-json-profiles-widget-integration`
- **Приоритет:** обычный
- **Связанные документы:**
  - Карточка виджета [`docs/widgets/profile/profiles-widget.md`](../../docs/widgets/profile/profiles-widget.md)
  - Базовый baseline виджета: задачи [`042`](../042-phase-6-profiles-widget-production-architecture/)–[`047`](../047-phase-6-profiles-widget-test-matrix-and-release-gate/), [`051`](../051-phase-6-profiles-widget-ui-refactor-embed-and-versions/)
  - Контракт embed [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md)
  - Индекс [`task_list.md`](../../task_list.md)

## Цель

Заменить в **`ProfilesWidgetCore`** редактирование **документа профиля** (создание профиля, правка текущей версии / новая версия), сейчас реализованное через **`Mantine Textarea`** и строковый JSON, на **те же публичные примитивы `@april/ui`**, что и в задаче **057** (`AprilJsonTreeEditor`, `AprilJsonCollectionTextEditor` для режима Source, `AprilJsonValidationSummary`, тема/иконки из DS). Поведение **047/051** (embed layout, версии, optimistic concurrency, telemetry, abort) **не регрессировать**.

## Контекст для агента

- Код: `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`.
- Переиспользование: общий модуль-обёртка из **057** (импорт из того же пакета; при дублировании — вынести в `src/ds/` или `src/components/json/` до выполнения 058).

## Жёсткие запреты

1. **Запрещено** оставлять для **document JSON** основной путь через обычный `Textarea`.
2. **Запрещено** внедрять Monaco или иной тяжёлый редактор вне `@april/ui` без отдельной задачи и согласования с DS.
3. Ввод **`AprilJsonSchemaForm`** как **второй режим** («форма по схеме типа») допускается **только** если из API/провайдера доступна JSON Schema выбранной сущности/ревизии и зафиксировано правило согласованности с деревом (см. объём ниже). Нельзя публиковать противоречивые два источника правды без описанного merge-правила в `PLAN.md`.

## Входит в объём

### 1. Редактор документа

- Create profile: JSON документ — DS Tree + Source (как в 057), валидация минимум «валидный JSON-объект»; при наличии схемы от `listEntityTypes` / деталей типа — опционально расширить клиентской Ajv из DS (та же политика `$ref`, что в 057).
- Edit / new version: заменить поля «Document (JSON object)» / «Updated document» на тот же компонентный стек.

### 2. Опциональный режим «Form» (целевое расширение, не MVP-заглушка)

- Если данные схемы для выбранного типа доступны из существующего провайдера без нового бэкенда: таб или `SegmentedControl` **JSON / Form**, где Form — **`AprilJsonSchemaForm`** с `hideDefaultSubmit`, кнопки сохранения остаются снаружи как сейчас.
- Зафиксировать в `PLAN.md`: что происходит при переключении JSON↔Form (ре-синхронизация, валидация, кто побеждает при расхождении).

### 3. Тесты

- Обновить `ProfilesWidgetCore.test.tsx`, `ProfilesWidget.test.tsx` — селекторы и сценарии под DS (см. [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md)).

### 4. Документация

- Обновить [`docs/widgets/profile/profiles-widget.md`](../../docs/widgets/profile/profiles-widget.md): способ редактирования JSON и перечень компонентов DS.

## Не входит в объём

- Изменения Go/OpenAPI (кроме использования уже сгенерированных типов).
- Задача **057** (выполняется первой; общий код выносится туда или дублируется временно не дольше одного PR — предпочтительно завершить 057 до 058).

## Технические ограничения

- Как в **057**: peer `@april/ui` уже должен быть зафиксирован; не понижать версию Mantine относительно workspace.

## Критерии готовности (acceptance)

- [ ] Нет основного пути редактирования document через `Textarea` для JSON.
- [ ] Режимы Tree и (при необходимости) Source на компонентах DS; поведение create/update/versioned save сохранено.
- [ ] `npm run lint|test|build -w @april/profile-ui` зелёные; при принятом gate — `go test ./...`.
- [ ] Обновлён [`profiles-widget.md`](../../docs/widgets/profile/profiles-widget.md).
- [ ] Страница **docs-site** (новая или дополнение к истории профилей) + при необходимости [`task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md).

## Проверка (команды)

```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
go test ./...
```

## Зависимости

- **Зависит от:** [`057-phase-7-profile-ui-ds-json-entity-types-integration`](../057-phase-7-profile-ui-ds-json-entity-types-integration/) (общая обёртка и согласованные паттерны DS JSON).
