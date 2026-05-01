# Задача 057 (фаза 7): `@april/profile-ui` — JSON-редакторы дизайн-системы в `entity-types-widget`

## Мета

- **ID / ветка (рекомендуется):** `feature/task-057-phase-7-profile-ui-ds-json-entity-types-integration`
- **Приоритет:** обычный (после стабилизации 054/055; не блокирует merge 053)
- **Связанные документы:**
  - Карточка виджета [`docs/widgets/profile/entity-types-widget.md`](../../docs/widgets/profile/entity-types-widget.md) (§5 — требования к UI и DS)
  - Задача-база виджета [`tasks/054-phase-7-entity-types-widget-production-ui/TASK.md`](../054-phase-7-entity-types-widget-production-ui/TASK.md)
  - Контракт embed [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md)
  - Руководство по DS в репозитории [`docs/guides/DESIGN_SYSTEM.md`](../../docs/guides/DESIGN_SYSTEM.md) (версия `@april/ui` ≥ **0.1.5**)
  - Индекс [`task_list.md`](../../task_list.md)

## Цель

Заменить в **`EntityTypesWidgetCore`** редактирование и просмотр JSON Schema (черновик, начальный черновик при создании семейства, просмотр опубликованных ревизий) с сырого **`Mantine Textarea`** на **публичные компоненты `@april/ui` 0.1.5+** (`AprilJsonTreeEditor`, `AprilJsonValidationSummary`, при режиме «исходный текст» — **`AprilJsonCollectionTextEditor`**, тема/иконки — `createAprilJsonEditTheme`, `createAprilJsonEditIcons`, при необходимости `aprilJsonTreeRootLayout`), с клиентской валидацией через утилиты DS (`createAprilJsonSchemaValidator` / `validateWithSchema`) и формализацией зависимостей пакета на `@april/ui`. Решение **целевое**, без промежуточного «оставим textarea до лучших времён».

## Контекст для агента

- Текущая реализация: `frontend/packages/profile-ui/src/components/EntityTypesWidgetCore.tsx` — строковое состояние `draftText` / `createDraft` и `Textarea`.
- Эталон архитектуры виджета: `EntityTypesApiWidget`, `EntityTypesDataProvider`, OpenAPI-провайдер (не менять контракт API без задачи на бэкенд).
- Публичный API JSON в DS: экспорты пакета `@april/ui` из ветки/релиза **DisignApril 0.1.5** (дерево, валидация, summary).

## Жёсткие запреты (нарушение = провал задачи)

1. **Запрещено** использовать для полей **draft schema** / **initial draft** / **snapshot схемы ревизии** обычный `Textarea` или произвольный сторонний JSON-редактор вне `@april/ui`.
2. **Запрещено** считать **`AprilJsonSchemaForm` (RJSF)** основным редактором **документа JSON Schema** (RJSF редактирует *данные по схеме*, а не произвольный AST схемы). Для черновика схемы основной режим — **`AprilJsonTreeEditor`**; RJSF допускается только как отдельно обоснованный вспомогательный сценарий в **058** или follow-up, не в этой задаче.
3. **Запрещены** регрессии по задаче **054**: optimistic concurrency, UI конфликта 409, telemetry, `AbortSignal`, обработка `401/403/409/422`.
4. **Запрещено** подставлять `tenant` из недоверенного ввода (без изменений относительно текущих правил виджета).

## Входит в объём

### 1. Зависимости пакета `@april/profile-ui`

- Явные **`peerDependencies`** (и при необходимости **`devDependencies`**) на **`@april/ui`** с минимальной версией **≥ 0.1.5**, согласованной с `frontend/package.json` / vendored tarball или registry-потоком из [`tasks/048-phase-7-ds-npm-registry-deps-lock-npmrc`](../048-phase-7-ds-npm-registry-deps-lock-npmrc/).
- Обновить **`frontend/packages/profile-ui/README.md`**: host обязан предоставить совместимые `@april/ui`, `@mantine/core`, React.

### 2. Внутренний переиспользуемый слой (рекомендуется)

- Вынести в `frontend/packages/profile-ui/src/…` (имя модуля на усмотрение исполнителя) общую обёртку: связка Mantine theme/color scheme → `createAprilJsonEditTheme` / `createAprilJsonEditIcons`, единые пропсы `value: Record<string, unknown>`, `onChange`, `readOnly`, `validationSchema`, отображение ошибок через **`AprilJsonValidationSummary`**.
- Зафиксировать политику **`$ref`**: по умолчанию без внешнего dereference в браузере (как предупреждает DS при CORS); при необходимости — только после явного решения в `PLAN.md`.

### 3. Вкладка Draft (`EntityTypesWidgetCore`)

- Источник истины для сохранения — **объект** `Record<string, unknown>`, синхронизированный с редактором; сериализация только на границе вызова провайдера.
- Основной UX: **`AprilJsonTreeEditor`** + валидация по согласованной **meta JSON Schema** (одна версия dialect — зафиксировать в `PLAN.md` / комментарии к константе схемы).
- Второй режим (**не опциональный «MVP»**): переключатель **Tree / Source**, где Source — только **`AprilJsonCollectionTextEditor`** из `@april/ui`; правила синхронизации при смене режима (без молчаливой потери правок — явное поведение в `PLAN.md` и тестах).

### 4. Модалка создания семейства

- Поле начального черновика схемы — тот же стек DS, что и на вкладке Draft (компактная высота, те же тема/валидация).

### 5. Вкладка Revisions

- Просмотр **immutable** `schema` выбранной ревизии: **`AprilJsonTreeEditor`** с `readOnly` (контейнер списка/детали — Mantine `Table` / `Drawer` / `Stack` — допустимо; **содержимое JSON** — только DS).
- Если в ответе списка ревизий нет полного `schema`, использовать существующий метод провайдера/SDK из задачи **053** (не выдумывать endpoint — сверка с `openapi/openapi.yaml`).

### 6. Ошибки API (в т.ч. 422 / `schema_validation_failed`)

- Маппинг структурированных деталей из generated-моделей ошибок в элементы **`AprilJsonValidationSummary`** или эквивалентный DS-first блок рядом с редактором, без «сырого» JSON в пользовательском `Alert`, если тело ошибки пригодно для списка путей/сообщений.

### 7. Документация (canonical `docs/`)

- Обновить [`docs/widgets/profile/entity-types-widget.md`](../../docs/widgets/profile/entity-types-widget.md) §5: перечислить фактически используемые компоненты `@april/ui` и режимы (Tree / Source / read-only revisions).
- При необходимости — ссылка в [`docs/guides/DESIGN_SYSTEM.md`](../../docs/guides/DESIGN_SYSTEM.md) на минимальную версию DS для виджетов профиля.

### 8. Тесты

- Обновить `EntityTypesWidgetCore.test.tsx`: провайдер Mantine + сценарии сохранения/конфликта с новым UI; не опираться на `getByLabelText` для старого «Draft JSON Schema» как на единственный способ ввода, если UX изменился.
- Добавить проверки: блокировка Save при ошибках клиентской валидации; переключение Tree/Source без потери согласованности (по правилам из `PLAN.md`).

## Не входит в объём

- Изменения OpenAPI / Go (только чтение фактического контракта **053**).
- Реализация **`ProfilesWidget`** JSON на DS — отдельная задача [**058**](../058-phase-7-profile-ui-ds-json-profiles-widget-integration/TASK.md).
- Страница **docs-site** «на пальцах» — по согласованию с [**055**](../055-phase-7-entity-types-contract-docs-hub-handoff/TASK.md): либо расширение существующей истории, либо отдельный `task-story-057-*.md` в рамках этой же задачи (см. критерии ниже).

## Технические ограничения

- Стек пакета: React 18, TypeScript, Vitest, Testing Library — как в workspace `frontend`.
- Соблюдать линты и [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md).

## Требования к дизайн-системе

- [ ] В `REPORT.md` — таблица: какие компоненты `@april/ui` использованы и в каких экранах.
- [ ] Нет отхода от DS для редактирования JSON без записи в `TASK.md` «исключений» (в рамках 057 исключений нет).

## Критерии готовности (acceptance)

- [ ] В прод-коде `EntityTypesWidgetCore` нет `Textarea` для draft / create draft / просмотра схемы ревизии (допускается `Textarea` для других текстовых полей, не для JSON-схемы).
- [ ] Реализованы режимы Tree и Source на DS; ревизии — read-only дерево.
- [ ] `peerDependencies` на `@april/ui` зафиксированы; README обновлён.
- [ ] `cd frontend && npm run lint -w @april/profile-ui`, `npm run test -w @april/profile-ui`, `npm run build -w @april/profile-ui` — зелёные; при принятом gate — `go test ./...` без регрессий.
- [ ] Обновлена карточка [`entity-types-widget.md`](../../docs/widgets/profile/entity-types-widget.md).
- [ ] **Человекопонятная история:** создана или обновлена страница в `docs-site/docs/` (формат как у соседних задач) и при необходимости строка в [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md).

## Проверка (команды)

```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
go test ./...
```

## Результат в отчёте

По [`docs/AGENT_REPORT_TEMPLATE.md`](../../docs/AGENT_REPORT_TEMPLATE.md): список файлов, таблица DS-компонентов, риски (двойной Ajv, bundle), follow-up для **058**.

## Зависимости

- **Зависит от:** завершённая [`054-phase-7-entity-types-widget-production-ui`](../054-phase-7-entity-types-widget-production-ui/) (базовый виджет и провайдер); стабильный контракт SDK после [`053-phase-7-entity-type-revisions-backend-api-profile-integration`](../053-phase-7-entity-type-revisions-backend-api-profile-integration/).
- **Блокирует:** [`058-phase-7-profile-ui-ds-json-profiles-widget-integration`](../058-phase-7-profile-ui-ds-json-profiles-widget-integration/) (общая обёртка и паттерны лучше переиспользовать из 057).
