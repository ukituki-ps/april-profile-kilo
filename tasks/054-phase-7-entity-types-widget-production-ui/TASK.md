# Задача 054 (фаза 7): `@april/profile-ui` — виджет `entity-types-widget` (production-first, DS-first)

## Мета

- **ID / ветка (рекомендуется):** `feature/task-054-phase-7-entity-types-widget-production-ui`
- **Приоритет:** срочный
- **Связанные документы:**
  - Карточка виджета [`docs/widgets/profile/entity-types-widget.md`](../../docs/widgets/profile/entity-types-widget.md)
  - Базовый паттерн [`docs/widgets/profile/profiles-widget.md`](../../docs/widgets/profile/profiles-widget.md); архитектурный baseline задачи [`tasks/042-phase-6-profiles-widget-production-architecture/TASK.md`](../042-phase-6-profiles-widget-production-architecture/TASK.md)
  - OpenAPI/SDK после задачи [`053-phase-7-entity-type-revisions-backend-api-profile-integration`](../053-phase-7-entity-type-revisions-backend-api-profile-integration/TASK.md)
  - ADR [`docs/adr/0005-entity-type-revisions-and-entity-binding.md`](../../docs/adr/0005-entity-type-revisions-and-entity-binding.md)
  - Индекс [`task_list.md`](../../task_list.md)

## Цель

Доставить **целевой** переиспользуемый embed-виджет администрирования каталога типов (**`widgetId`: `entity-types-widget`**, `profileId`: `entity-types-admin`) в пакете `frontend/packages/profile-ui`, архитектурно эквивалентный продакшен-базлайну Profiles: **`EntityTypesWidgetCore` + `EntityTypesApiWidget` + публичный фасад + `EntityTypesDataProvider`**, без demo-first источников данных, с **полным** клиентским потоком: список семейств типов → детальная карточка (draft, история ревизий, upgrade сущностей при наличии API), обработкой ошибок, telemetry и **отменой in-flight запросов** через `AbortController`.

## Контекст для агента

- Изучите реализации: `ProfilesWidgetCore`, `ProfilesApiWidget`, `openapiProfilesProvider`, контракт `ProviderContext` — как эталон.
- Компоненты списков: **`CardListColumn`** из `@april/ui`.

## Жёсткие запреты (нарушение = провал задачи)

1. **Запрещено** игнорировать дизайн-систему: самописный layout списков/модалок/форм там, где **есть эквивалент в `@april/ui`/Mantine** (перечень проверенных компонентов указать в REPORT).
2. **Запрещены временные решения**: хардкод типов сущностей, `localStorage` как истина, «простую HTML-форму без DS», упрощённый роутинг внутри виджета, подмену API моками **в основном коде виджета** (мок допустим **только** в unit/integration тестах пакета, изолированно).
3. **Запрещено** копировать демо-страницу как прод-виджет: фасад embed должен соответствовать контракту [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md).
4. **Запрещено** отказываться от optimistic concurrency там, где API задачи 053 его предоставляет (обязательно отображение конфликта и восстановление).
5. **Запрещено** пропускать обработку `401/403/409/422` с понятными сообщениями без утечек внутренних деталей.
6. **Запрещено** смешивать tenant из пользовательского ввода.

## Входит в объём

### 1. Структура файлов и публичный API пакета

- Экспорт фасада (`EntityTypesWidget` или согласованное имя) из entry пакета, не ломая semver правил монорепо (согласовать bump при необходимости).
- `EntityTypesWidgetCore`: state machine; **нет** импортов транспортного runtime кроме абстрактного provider-контракта и `AbortSignal`.

### 2. Данные и провайдер

- Реализовать `openapiEntityTypesProvider` (имя можно уточнить): использует только сгенерённый SDK из OpenAPI задачи **053**.
- Поддержать полный поток методов провайдера (минимальный набор):
  - list families / get family detail;
  - get/save draft (с etag/expected revision);
  - publish draft;
  - list revisions;
  - upgrade entity single + batch (если в API есть);
  - вспомогательные методы для «entities behind revision» если предусмотрено API.

### 3. UI поведение (целевое)

- Master–detail: список семейств (**DS**); детали: вкладки **Draft** / **Revisions** / **Upgrade** (если API поддерживает; иначе — блокировать вкладку с явным текстом недоступности **нельзя** — довести API в 053, не выкидывая вкладку «временно»).
- JSON редактор схемы — **моноширинный**, растягивание по высоте embed как у profiles-widget (flex, `minHeight: 0`).
- Действия публикации/сохранения — понятные состояния loading/disabled/toasts notifications через DS (`notifications` Mantine только если уже принят паттерном пакета — свериться с Profiles).

### 4. Telemetry

- Набор событий как минимум: `list_*`, `draft_save_*`, `publish_*`, `upgrade_*`; корреляция `request_id` если доступна из ошибок envelope.

### 5. Тесты

- Аналог уровню задачи 047 для Profiles: Core unit/integration с мок-провайдером; провайдер — маппинг ошибок/`requestId`; smoke на фасад (если уже принято в пакете).
- **Не понижать** release gate качество ниже задачи 047.

## Не входит в объём

- Изменения в april-worker Hub репозитории (делаются внешне; см. задачу 055 для handoff-доков).
- Крупная i18n-инициатива для всех строк (допускается единый язык строк как в Profiles до отдельной задачи).

## Технические ограничения

- React/TS/Vite stack пакета; строго следовать установленным линтам workspace.
- Иконки: согласованный набор; a11y обязательна.

## Требования к дизайн-системе

- [ ] Явный чеклист в REPORT: какие компоненты `@april/ui` и Mantine использованы; что проверено в DS Storybook/README (если доступно организации).
- [ ] Любой отход от DS **запрещён** без письменного обоснования в REPORT и согласования в TASK (в рамках этой постановки обоснования **не ожидаются** — значит отходов быть не должно).

## Критерии готовности (acceptance)

- [ ] Виджет реализует **целевой** UX из [`entity-types-widget.md`](../../docs/widgets/profile/entity-types-widget.md) без сокращений scope.
- [ ] Нет временных обходных путей; нет нарушений запретов выше.
- [ ] `npm run lint -w @april/profile-ui`, `npm run test -w @april/profile-ui`, `npm run build -w @april/profile-ui` — зелёные.
- [ ] Документация карточки виджета обновлена, если фактический контракт props/events отличается от черновика (синхронизация обязательна).

## Проверка (команды)

```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
go test ./...
```

## Человекопонятная история в docs-site

- Создаётся в задаче **055**; агент **054** добавляет в REPORT сценарии «как пользоваться» для копирования в story.
