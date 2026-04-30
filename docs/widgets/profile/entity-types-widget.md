# Карточка виджета: `entity-types-widget`

## 1) Мета

| Поле | Значение |
|------|----------|
| `profileId` | `entity-types-admin` |
| `widgetId` | `entity-types-widget` |
| `packageName` | `@april/profile-ui` |
| `contractVersion` | `v1` (на старте; эволюция по [`../../VERSIONING_AND_COMPATIBILITY.md`](../../VERSIONING_AND_COMPATIBILITY.md)) |
| `lifecycleStatus` | `beta` (задача **054**; далее `stable` по релизной политике) |
| Владелец | команда AprilProfile (`april-profile`) + интеграция в AprilHub через BFF/OIDC |

Архитектурное решение по домену типов и ревизий: **ADR-0005** — [`../../adr/0005-entity-type-revisions-and-entity-binding.md`](../../adr/0005-entity-type-revisions-and-entity-binding.md).

---

## 2) Назначение (целевое решение, без упрощений)

Виджет обеспечивает **полный административный контур** над **каталогом типов сущностей** в модели:

- **семейство типа** — логический тип в пределах tenant (`namespace` + `code`);
- **ревизии схемы** — монотонные опубликованные **immutable** снимки JSON Schema (или согласованного schema-document);
- **черновик** — редактируемая будущая ревизация до публикации;
- **привязка сущности** (`entity`) к **конкретной опубликованной ревизии**;
- **апгрейд привязки** сущности на более новую ревизию — **явная операция** с валидацией документа профиля против целевой схемы и записью новой версии профиля при необходимости (семантика — в задаче на бэкенд, инвариант — append-only версии профиля).

Виджет **не** является демо-обёрткой: повторяет production-first паттерн `ProfilesWidget` — **`Core` + `ApiWidget` + фасад embed + data provider** (`docs/widgets/profile/profiles-widget.md`, задачи 042–047).

---

## 3) Пользовательские сценарии (полный охват)

### 3.1 Каталог семейств типов

- Просмотр списка семейств: ключ (`namespace/code`), наличие черновика, номер последней опубликованной ревизии, опционально агрегаты «сколько сущностей не на последней ревизии» (если поддержано API).

### 3.2 Создание семейства и первой ревизии

- Создать семейство: задать `namespace`, `code`, начальный `draft_schema`.
- Опубликовать → появляется **ревизия 1** (immutable).

### 3.3 Эволюция схемы

- Редактировать черновик (много итераций).
- Опубликовать → **новая ревизия N+1**; предыдущие ревизии остаются в истории read-only.

### 3.4 Удаление и запреты

- Удаление **семейства** или **неопубликованного черновика** — только в рамках серверной политики (например нельзя удалить семейство при наличии `entities`; точные коды ошибок — в OpenAPI после реализации задачи 053).

### 3.5 Привязка и апгрейд сущностей

- Из виджета: выбрать семейство → вкладка **Entities / Upgrade**:
  - фильтр «не на latest published revision»;
  - апгрейд **одной** сущности;
  - **массовый** апгрейд (батч) с отчётом об ошибках по элементам (**целевое решение**: не ограничиваться только single-entity, если это отражено в API задачи 053).

---

## 4) Контракт интеграции с host

- HostContext/props/events: [`../../WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md).
- Версионирование виджета: [`../../VERSIONING_AND_COMPATIBILITY.md`](../../VERSIONING_AND_COMPATIBILITY.md).
- Чеклист хоста: [`../../WIDGET_INTEGRATION_CHECKLIST.md`](../../WIDGET_INTEGRATION_CHECKLIST.md).

Публичные props (`EntityTypesWidgetProps` в `@april/profile-ui`, фасад = `EntityTypesApiWidget`):

| Prop | Обяз. | Описание |
|------|--------|----------|
| `hostContext` | да | `ProfileWidgetHostContext`: `tenant`, опционально `auth`, `telemetry.requestId` и др. (см. [`WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md)). |
| `apiBaseUrl` | да | Базовый URL Profile API (часто BFF: `/admin/profile/api`). |
| `accessToken` | нет | Bearer для сгенерированного клиента. |
| `pageSize` | нет | Размер страницы `GET /v1/entities` на вкладке **Upgrade** (по умолчанию `20`). |
| `providerContext` | нет | Переопределение `ProviderContext` без `AbortSignal` (тесты / нестандартный host). |
| `onAction` | нет | См. тип `EntityTypesWidgetAction` в пакете. |
| `onError` | нет | `{ message, requestId?, code? }` — без утечки внутренних деталей API. |
| `onObservability` | нет | `ProfileWidgetTelemetryEvent`; для виджета `widget: "entity_types"` и событий `draft_save_*`, `publish_*`, `upgrade_*`, `batch_upgrade_*`, плюс `list_*` / `details_*`. |
| `onOpenEntity` | нет | `(entityId) => void` — клик по `entity_id` в таблице апгрейда (навигация к `profiles-widget`). |

События `onAction` (тип `EntityTypesWidgetAction`):

- `family_created`, `family_patched`, `family_deleted`;
- `draft_saved`, `revision_published`;
- `entity_upgrade_requested`, `entity_upgrade_succeeded`, `entity_upgrade_failed`;
- `batch_upgrade_completed` (агрегаты `succeeded` / `failed` / `processed`).

`onError`: нормализованный `{ code?, message, requestId? }`; при наличии `request_id` в теле ошибки API его имеет смысл прокинуть в `requestId` для корреляции с логами бэкенда.

Telemetry: тот же дух, что у `profiles-widget` (корреляция `request_id`, ключи вида `widget = entity_types` + стадии list/detail/save/publish/upgrade). Детальный список событий фиксируется в PLAN задачи на UI.

---

## 5) Требования к UI и дизайн-системе (обязательные)

- **Запрещено** обходить дизайн-систему: произвольные CSS-«виджеты», самодельные модалки там, где в `@april/ui` / Mantine есть эквивалент, «временные» экраны без DS **не допускаются**.
- **Запрещены** упрощающие обходные пути вместо целевого решения (например фиксированный список типов вместо server-driven API, локальное хранилище как source of truth, игнорирование optimistic concurrency, отсутствие обработки 409/422).
- Master–detail компоновка списка: **`CardListColumn`** (`@april/ui`) или согласованный наследник из DS **без замены на самописный master-detail**.
- Редактор схемы: JSON-редактор на базе компонентов DS (например `Textarea` с моноширинным стилем из токенов/темы); расширение до Monaco допускается **только** если принято в DS или явно добавлено как зависимость пакета с обоснованием в REPORT (по умолчанию — нет произвольных тяжёлых редакторов вне решения DS).
- Иконки: согласованный набор (как у других виджетов профилей, например `@tabler/icons-react` при наличии в peer/dependencies пакета), с **a11y** (`aria-label` / tooltip).

---

## 6) Зависимости по API и SDK

Виджет потребляет **целевой** REST-контракт после задачи **053** (список в OpenAPI генерирует SDK `@april/profile-ui`/generated).

Минимальный набор операций (ориентир; финал — OpenAPI):

- CRUD семейства типов (или эквивалентный набор без «дырок» для админ-потока);
- получение и сохранение **черновика** с optimistic concurrency;
- **publish** новой ревизии из черновика;
- список **ревизий** семейства (история, read-only);
- операции **upgrade binding** для `entities` (single + batch, если входит в scope 053).

---

## 7) Безопасность

- `tenant_id` только из доверенного контекста; виджет не принимает tenant из недоверенного ввода.
- Операции каталога типов и апгрейда — **строго** под admin/realm-role политику (конкретика в Keycloak/host — вне этого файла; в UI отображать 403 понятно, без утечек внутренних деталей).

---

## 8) Проверка и качество

Критерии уровня production для пакета UI — как у фазы `profiles-widget`: lint/test/build workspace `@april/profile-ui`, покрытие Core/provider тестами, отсутствие race-condition на отмену запросов (`AbortSignal`), обработка вложенных ошибок API. Команды — в `TASK.md` задачи **054**.

---

## 9) Связанные задачи репозитория

Handoff для AprilHub/BFF: [`docs/integration/entity-types-widget-hub-handoff.md`](../../integration/entity-types-widget-hub-handoff.md).

| Задача | Содержание |
|--------|------------|
| [`tasks/052-phase-7-entity-type-revisions-data-model-and-migrations`](../../../tasks/052-phase-7-entity-type-revisions-data-model-and-migrations/TASK.md) | БД + миграции + доменное отображение к ADR-0005 |
| [`tasks/053-phase-7-entity-type-revisions-backend-api-profile-integration`](../../../tasks/053-phase-7-entity-type-revisions-backend-api-profile-integration/TASK.md) | OpenAPI, HTTP handlers, связка с `profiles`, интеграционные тесты |
| [`tasks/054-phase-7-entity-types-widget-production-ui`](../../../tasks/054-phase-7-entity-types-widget-production-ui/TASK.md) | Виджет UI (Core/Api/Facade/Provider), DS-first |
| [`tasks/055-phase-7-entity-types-contract-docs-hub-handoff`](../../../tasks/055-phase-7-entity-types-contract-docs-hub-handoff/TASK.md) | WIDGET_CONTRACTS, docs-site stories, индекс, финализация handoff Hub |
