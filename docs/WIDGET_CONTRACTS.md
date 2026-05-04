# Контракты виджетов и host (v1)

> **Связанные документы:** [`FRONTEND_STRATEGY.md`](./FRONTEND_STRATEGY.md), [`adr/0004-hybrid-ui-integration-model.md`](./adr/0004-hybrid-ui-integration-model.md), [`adr/0006-mobile-chrome-layers-widget-host.md`](./adr/0006-mobile-chrome-layers-widget-host.md), [`WIDGET_DOCS_OPERATING_MODEL.md`](./WIDGET_DOCS_OPERATING_MODEL.md), [`VERSIONING_AND_COMPATIBILITY.md`](./VERSIONING_AND_COMPATIBILITY.md), [`WIDGET_OBSERVABILITY_GUIDE.md`](./WIDGET_OBSERVABILITY_GUIDE.md).  
> Опубликованная копия на сайте: `docs-site/docs/widget-contracts.md` — при правках синхронизируйте оба файла.

Статус **v1** — минимальный общий знаменатель для AprilHub и пакетов `@april/*-ui`. Расширения оформляются новой minor-версией контракта и документируются в changelog виджета.

---

## 1. Принципы владения

| Слой | Владеет |
|------|---------|
| **Host** (AprilHub) | Маршрутизация, layout страницы, глобальный UI state сценария, выбор tenant в рамках сессии, обработка intent-событий виджета (переход «следующая карточка», закрытие модалки и т.д.). |
| **Widget** (`@april/*-ui`) | Отображение доменного блока, локальный UI state формы, вызовы API/BFF в границах сценария, эмиссия событий намерений **без** прямого управления `history`/`Router` хоста. |
| **Design System** (`@april/ui`, `@april/tokens`) | Визуальные примитивы, тема, a11y; **без** доменной логики и без знания tenant/API. |

Запрещено: виджет вызывает `navigate()` / `window.location` для сценариев экосистемы без явного API события, ожидаемого host.

---

## 2. HostContext v1

Минимальный контекст, который host передаёт в виджет (React context и/или проп `hostContext`). Значения **только** из доверенного слоя (OIDC/BFF), не из полей формы.

| Поле | Тип (логический) | Назначение |
|------|------------------|------------|
| `tenant` | `{ id: string }` | Текущий tenant; источник — токен/BFF. |
| `auth` | `{ subject?: string; roles?: string[]; tokenRef?: string }` | Идентификация пользователя и роли Keycloak (см. ABAC на API). `tokenRef` — опциональная ссылка на получение access token для API-клиента, если принято в host. |
| `theme` | `'light' \| 'dark' \| 'system'` | Согласование с Mantine/host. |
| `locale` | `string` (BCP 47) | Локаль UI. |
| `telemetry` | `{ requestId: string; correlationId?: string; traceId?: string; spanId?: string }` | Корреляция логов и трасс; `requestId` обязателен для цепочки host → BFF → сервис; `correlationId` — опционально для сквозного id (см. [`WIDGET_OBSERVABILITY_GUIDE.md`](./WIDGET_OBSERVABILITY_GUIDE.md) §3.1). |

Расширения (например `featureFlags`) — только через явную новую версию контракта или optional-поля, не ломающие потребителей.

---

## 3. Widget Props Contract v1

Базовый набор пропсов для экспортируемого корневого компонента виджета (имена могут уточняться пакетом, семантика сохраняется).

| Проп | Обязательность | Описание |
|------|----------------|----------|
| `hostContext` | обязателен | См. §2. |
| `entityId` / идентификаторы сущности | по сценарию | Стабильные ID сущности в домене профиля. |
| `entityType` / `schemaRef` | по сценарию | Ссылка на тип/версию схемы в метамодели. |
| `apiBaseUrl` или клиент API | по договорённости | Либо инжектированный клиент из host, либо базовый URL BFF. |
| `onEvent` / именованные колбэки | рекомендуется | См. §4. |
| `onObservability?` | рекомендуется для прод-сценариев | Унифицированные события `view_loaded` / `save_*` с `request_id` / `correlation_id` (см. [`WIDGET_OBSERVABILITY_GUIDE.md`](./WIDGET_OBSERVABILITY_GUIDE.md) §3.1). |

Виджет **не** принимает «сырой» `tenantId` из пользовательского ввода без сверки с `hostContext.tenant`.

---

## 4. Widget Events Contract v1

События от виджета к host — **явные** колбэки или дискриминированный union в `onEvent`. Host решает, вызывать ли `navigate`, закрыть панель, показать toast.

| Событие | Полезная нагрузка (пример) | Ожидаемое поведение host |
|---------|---------------------------|---------------------------|
| `onSaveSuccess` | `{ entityId }` | Например «следующий» в очереди, обновление списка, soft navigation. |
| `onAction` | `{ type: string; payload?: unknown }` | Унифицированные intent: `openRelated`, `requestNext`, `custom`. |
| `onError` | `{ code?: string; message: string; requestId?: string }` | Отображение ошибки на уровне host, логирование с корреляцией. |
| Навигационные intent | `{ intent: 'navigate'; to: string }` **не использовать напрямую** | Предпочтительно семантические события (`requestExit`, `requestDetail`) — host мапит на маршруты. |

Анти-паттерн: глобальный event bus без типизации и без `requestId` в логах.

---

## 5. State и навигация

- **Host** хранит сценарный state (очередь ID, шаг мастера, query-параметры маршрута).
- **Widget** хранит локальный state формы; после успешного сохранения эмитит `onSaveSuccess` и сбрасывает dirty-state локально.
- Синхронизация с URL: приоритет у host; виджет может запрашивать смену через intent-событие.

---

## 6. Связь с IAM и ABAC

Роли и права — из **Keycloak** и политик API (ADR-0003). Виджет не реализует «свою» модель прав; он получает уже отфильтрованные данные и маскирует поля согласно ответу API.

---

## 7. Версионирование контракта

Изменения несовместимые с предыдущим props/events → **major** версии пакета `@april/*-ui` и запись в [`VERSIONING_AND_COMPATIBILITY.md`](./VERSIONING_AND_COMPATIBILITY.md). Добавление optional полей в `HostContext` → обычно **minor** при сохранении поведения по умолчанию.

---

## 8. ProfilesWidget production-first baseline (Phase 6 / task 042)

Этот раздел фиксирует обязательный baseline для перехода `ProfilesWidget` на архитектуру `Core + Api adapter + Facade`. Раздел используется как hard gate для задач 043/044.

### 8.1 Целевое разбиение ответственности

| Слой | Обязанности | Явно запрещено |
|------|-------------|----------------|
| `ProfilesWidgetCore` | UI + локальная state machine, lifecycle list/detail/mutations, рендер DS-first, callbacks (`onAction`, `onError`, `onObservability`) | Прямые вызовы OpenAPI/REST, знание `apiBaseUrl`/`accessToken`, чтение `VITE_*` |
| `ProfilesApiWidget` | Создание API provider, wiring `hostContext` -> provider context, маппинг transport errors в normalized ошибки | Дублировать UI-логику `Core`, прокидывать demo-only входы |
| `ProfilesWidget` (public facade) | Публичная точка встраивания, стабильный экспорт пакета | Отдельная логика поверх `ProfilesApiWidget` |

### 8.2 Контракт данных (обязательный минимум)

`ProfilesWidgetCore` работает только через provider-контракт (логическое имя: `ProfilesDataProvider`):

- `list(query, ctx) -> { items, nextCursor?, totalCount? }`
- `get(entityId, ctx) -> details`
- `create(input, ctx) -> details`
- `update(entityId, input, ctx) -> details`
- `remove(entityId, ctx) -> void`

Где:

- `query` включает server-side параметры `search`, `entityTypeId`, `limit`, `cursor`, `sort`;
- `ctx` включает `tenant`, опциональный auth/token ref, telemetry ids и `AbortSignal`.

### 8.3 Обязательные UX/flow инварианты

- Источник списка — только server-side list API; локальный `slice/filter` не может быть source of truth.
- Для list/details запросов обязателен контроль гонок (`AbortController`/эквивалент).
- После create/update/delete список и detail остаются консистентными в том же UI цикле.
- Ошибки UI показываются только через безопасный mapping (`401/403/409/...`) без raw backend message.
- Публичный и внутренний props-контракты `ProfilesWidget` включают:
  - `initialSort?: "updated_desc" | "updated_asc"`;
  - `autoSelectFirst?: boolean`;
  - `onOpenEntity?: (entityId: string) => void`;
  - `onError?: ({ message, requestId, code }) => void`.
- При update-потоке `Core` передаёт `expectedVersion` в provider-контракт как optimistic concurrency hint.
- `ProfilesApiWidget` формирует `ProviderContext` из `hostContext` (`tenantId`, auth, telemetry), а `Core` добавляет `signal` для request cancellation.
- `Core` эмитит transport-события наблюдаемости: `list_requested/list_succeeded/list_failed`, `details_requested/details_failed` (в дополнение к `view_loaded` и `save_*`).

### 8.4 Запрещённые паттерны (anti-patterns)

- Публичный контракт `ProfilesWidget`, где список подаётся как `entityIds`.
- Смешивание transport config (`OpenAPI.BASE`, `OpenAPI.TOKEN`, fetch client) с UI-компонентом `Core`.
- Использование demo env (`VITE_*_DEMO_*`) как runtime источника данных production-виджета.
- Имитация server-side pagination полной предзагрузкой данных в клиент.

### 8.5 Preconditions для старта следующих задач

- **Task 043** стартует только после фиксации list/search/filter/pagination API контракта и error envelope (`code`, `message`, `request_id`).
- **Task 044** стартует только после готовности generated SDK с list endpoint и подтверждённого baseline из этого раздела.

### 8.6 Mobile chrome: стратегия A, `AprilMobileShellBar`, AprilHub

**Источник норм:** `design-system/DisignApril/DESIGN_SYSTEM.md` — §8 Mobile (встраивание, стек владельца), §11 **«Нормативный контракт `AprilMobileShellBar`»** (таблицы MUST/MUST NOT и пропсы). Отклонения в продуктовом UI без обновления DS и ADR — **не допускаются** для публичных shell AprilHub.

**Стратегия A (по умолчанию):** в каждой ветке UI **одна видимая** нижняя капсула у контента, отражающая **вершину стека** сценария. Вложенные виджеты и листы **не** накапливают конкурирующие `AprilMobileShellBar`; родитель скрывает свою панель (`CardListColumn.hideMobileShellBar`, условный рендер и т.д.). Глобальный dock AprilHub — **отдельный** слой; согласование с виджетом — [`WIDGET_INTEGRATION_CHECKLIST.md`](./WIDGET_INTEGRATION_CHECKLIST.md).

**«Назад»:** сначала закрывается модальность / sheet виджета (`leading` панели вершины, `onClose` листа), затем host обрабатывает навигацию по intent; не перехватывать системный back раньше листа.

**Поставка:** версия **`@april/ui`** в lockfile shell **обязана** содержать контрактные пропы (`hideMobileShellBar` и др.); иначе стратегия A неработоспособна в runtime.

Решение и альтернатива B: [`adr/0006-mobile-chrome-layers-widget-host.md`](./adr/0006-mobile-chrome-layers-widget-host.md). Пример виджета: [`widgets/profile/profiles-widget.md`](./widgets/profile/profiles-widget.md). Стратегия сборки фронта в Hub: [`FRONTEND_STRATEGY.md`](./FRONTEND_STRATEGY.md) §5.1.

---

## 9. EntityTypesWidget production-first baseline (Phase 7 / tasks 052–054)

Дополнение к **контракту v1** (обратно совместимо: новые виды событий telemetry — **minor** для `@april/profile-ui`, см. [`VERSIONING_AND_COMPATIBILITY.md`](./VERSIONING_AND_COMPATIBILITY.md)). Идентификаторы embed: **`profileId` = `entity-types-admin`**, **`widgetId` = `entity-types-widget`** (каталог [`docs/widgets/README.md`](./widgets/README.md)).

### 9.1 Целевое разбиение ответственности

| Слой | Обязанности | Явно запрещено |
|------|-------------|----------------|
| `EntityTypesWidgetCore` | UI + state machine (список семейств, вкладки Draft / Revisions / Upgrade), DS-first рендер, `onAction` / `onError` / `onObservability`, отмена in-flight через `AbortSignal` в `ProviderContext` | Прямые вызовы OpenAPI, `apiBaseUrl`/`accessToken` внутри Core, `VITE_*` как источник данных |
| `EntityTypesApiWidget` | Создание `createOpenApiEntityTypesProvider`, сборка `ProviderContext` из `hostContext` + `accessToken`, маппинг transport → нормализованные ошибки | Дублирование UI-логики Core |
| `EntityTypesWidget` (фасад) | Стабильная точка встраивания для host | Отдельная бизнес-логика поверх `EntityTypesApiWidget` |

### 9.2 Контракт данных (логическое имя: `EntityTypesDataProvider`)

Минимальный набор операций (детали типов — экспорт пакета `@april/profile-ui`):

- `listFamilies(ctx)` — каталог семейств типов;
- `getFamily`, `createFamily`, `patchFamily`, `deleteFamily`;
- `saveDraft` (optimistic concurrency: `if_draft_schema_version`), `publishDraft`;
- `listRevisions`;
- `listProfilesForType` — для вкладки Upgrade (`GET /v1/entities` с `entity_type_id`);
- `upgradeEntityProfileBinding`, `batchUpgradeEntityBindings`.

`ctx` включает `tenantId`, auth (в т.ч. `accessToken`), telemetry ids и **`AbortSignal`** на read-путях, которые Core отменяет при смене выбора / размонтировании.

### 9.3 Публичные props (фасад `EntityTypesWidget` / `EntityTypesApiWidget`)

Обязательные: `hostContext`, `apiBaseUrl`. Рекомендуемые: `accessToken`, `onError`, `onObservability`. Опционально: `pageSize` (список сущностей на Upgrade), `providerContext` (переопределение без `signal`), `onAction` (`EntityTypesWidgetAction`), `onOpenEntity` (клик по `entity_id` в таблице апгрейда — навигация к `profiles-widget`).

Семантика **`HostContext` v1** (§2) не меняется: `tenant` и telemetry только из доверенного OIDC/BFF.

### 9.4 Telemetry (расширение union событий)

Для `ProfileWidgetTelemetryEvent` допускается `widget: "entity_types"` и события (наряду с базовыми из §3 / Profiles):

- стадии каталога: `list_requested` / `list_succeeded` / `list_failed` (список семейств), `details_requested` / `details_failed` (детальная карточка семейства + ревизии);
- черновик / публикация: `draft_save_submitted` | `draft_save_succeeded` | `draft_save_failed`, `publish_submitted` | `publish_succeeded` | `publish_failed`;
- апгрейд: `upgrade_submitted` | `upgrade_succeeded` | `upgrade_failed`, `batch_upgrade_submitted`, `batch_upgrade_completed`.

Корреляция: `request_id` из `hostContext.telemetry`, при наличии — `request_id` из JSON envelope ошибки API в поле `api_request_id` / `requestId` в `onError` (как у профильных виджетов).

### 9.5 Handoff Hub/BFF

Исполняемый чеклист маршрутов, таймаутов и примера `hostContext`: [`docs/integration/entity-types-widget-hub-handoff.md`](./integration/entity-types-widget-hub-handoff.md).
