# Контракты виджетов и host (v1)

> **Связанные документы:** [`FRONTEND_STRATEGY.md`](./FRONTEND_STRATEGY.md), [`adr/0004-hybrid-ui-integration-model.md`](./adr/0004-hybrid-ui-integration-model.md), [`VERSIONING_AND_COMPATIBILITY.md`](./VERSIONING_AND_COMPATIBILITY.md), [`WIDGET_OBSERVABILITY_GUIDE.md`](./WIDGET_OBSERVABILITY_GUIDE.md).  
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
| `telemetry` | `{ requestId: string; traceId?: string; spanId?: string }` | Корреляция логов и трасс; `requestId` обязателен для цепочки host → BFF → сервис. |

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
