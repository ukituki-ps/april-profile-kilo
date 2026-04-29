---
sidebar_position: 6
---

# Контракты виджетов и host (v1)

> Каноническая копия для правок в корне репозитория: `docs/WIDGET_CONTRACTS.md` (при изменениях синхронизируйте оба файла).

**Связанные документы:** [Стратегия фронтенда](/docs/frontend-strategy), [ADR-0004](/adr/hybrid-ui-integration-model), [Версионирование](/docs/versioning-and-compatibility), [Наблюдаемость](/docs/widget-observability-guide).

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
| `telemetry` | `{ requestId: string; correlationId?: string; traceId?: string; spanId?: string }` | Корреляция логов и трасс; `requestId` обязателен для цепочки host → BFF → сервис; см. [Observability](/docs/widget-observability-guide) §3.1. |

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
| `onObservability?` | рекомендуется для прод-сценариев | События `view_loaded` / `save_*` с корреляцией; см. [Observability](/docs/widget-observability-guide) §3.1. |

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

Изменения несовместимые с предыдущим props/events → **major** версии пакета `@april/*-ui` и запись в [Версионирование и совместимость](/docs/versioning-and-compatibility). Добавление optional полей в `HostContext` → обычно **minor** при сохранении поведения по умолчанию.

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
