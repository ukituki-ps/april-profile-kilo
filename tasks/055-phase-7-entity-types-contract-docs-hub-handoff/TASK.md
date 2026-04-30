# Задача 055 (фаза 7): контракты embed, docs-site, handoff AprilHub/BFF

## Мета

- **ID / ветка (рекомендуется):** `feature/task-055-phase-7-entity-types-contract-docs-hub-handoff`
- **Приоритет:** обычный (после 054)
- **Связанные документы:**
  - [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md)
  - [`docs/WIDGET_INTEGRATION_CHECKLIST.md`](../../docs/WIDGET_INTEGRATION_CHECKLIST.md)
  - Карточка [`docs/widgets/profile/entity-types-widget.md`](../../docs/widgets/profile/entity-types-widget.md)
  - [`docs/widgets/README.md`](../../docs/widgets/README.md)
  - [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md)
  - Задачи [`052`](../052-phase-7-entity-type-revisions-data-model-and-migrations/TASK.md), [`053`](../053-phase-7-entity-type-revisions-backend-api-profile-integration/TASK.md), [`054`](../054-phase-7-entity-types-widget-production-ui/TASK.md)

## Цель

Закрепить **целевое решение** на границе репозитория и экосистемы: обновить формальные контракты embed (при необходимости), дополнить человекопонятные материалы **docs-site** (отдельные страницы историй для эпика и/или подзадач), обеспечить **handoff** для AprilHub/BFF (чеклист маршрутов, OIDC, RBAC, пример host props) **без временных «интегрируйте как получится» инструкций**.

## Жёсткие запреты

1. **Запрещено** описывать интеграцию через обход контрактов (`WIDGET_CONTRACTS`, versioning guide) или предлагать host «прокинуть любой URL» без tenant/OIDC паттернов April.
2. **Запрещены** временные секретные значения или реальные URL стендов в git.
3. **Запрещено** оставлять docs-site без ссылки в `task-stories-overview` при добавлении новых страниц историй.
4. **Запрещено** смешивать `profileId`/`widgetId`: использовать **`entity-types-admin`** / **`entity-types-widget`** как в каталоге [`docs/widgets/README.md`](../../docs/widgets/README.md).

## Входит в объём

### 1. Документы контрактов репозитория

- Проверить, требует ли `entity-types-widget` расширения [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md) (новые props/events telemetry). Если да — добавить версионированную секцию **без ломания** существующих потребителей (deprecation паттерном из [`docs/VERSIONING_AND_COMPATIBILITY.md`](../../docs/VERSIONING_AND_COMPATIBILITY.md)).
- При необходимости обновить [`docs/WIDGET_INTEGRATION_CHECKLIST.md`](../../docs/WIDGET_INTEGRATION_CHECKLIST.md) пунктами специфичными для каталога типов (RBAC админа).

### 2. Каталог виджетов

- Убедиться, что [`docs/widgets/README.md`](../../docs/widgets/README.md) и картожка виджета согласованы с финальными props/export пакета после 054.

### 3. docs-site — человекопонятные истории

Минимум:

- Новая страница `docs-site/docs/task-story-052-phase-7-entity-type-revisions-data-model.md` — зачем миграции, что изменилось в БД простым языком, ссылки на ADR и TASK 052–053.
- Новая страница `docs-site/docs/task-story-053-phase-7-entity-type-revisions-api.md` — что умеет API (operations list), без дублирования OpenAPI.
- Новая страница `docs-site/docs/task-story-054-phase-7-entity-types-widget.md` — пользовательские сценарии виджета и как проверить на стенде.
- Обновить [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) — строки со статусом и ссылками.
- В конце каждой страницы: ссылки на `tasks/*/TASK.md`, `PLAN.md`, `REPORT.md`.

### 4. Handoff AprilHub / BFF (документирование)

Файл уже заведён: [`docs/integration/entity-types-widget-hub-handoff.md`](../../docs/integration/entity-types-widget-hub-handoff.md) — при выполнении задачи **довести его до финального состояния** после фактических путей OpenAPI (`053`) и export виджета (`054`):

- необходимый маршрут BFF префикса (как у других профильных виджетов),
- OIDC scopes/roles для админ-потока,
- список API endpoints, которые host обязан проксировать,
- минимальный пример `hostContext`,
- особенность: операции могут быть тяжёлыми → рекомендации по timeouts и UX блокировки (без изменения виджета — только guidance).

Этот файл **не заменяет** работу во внешнем репозитории Hub, но обязан быть достаточным для исполнения без догадок.

## Не входит в объём

- Реальный код april-worker / april-hub (**вне этого репозитория**) — допускается только ссылкой на задачи/issue во внешнем трекере, если есть.

## Технические ограничения

- Markdown/docs only + синхронизация индексов; не ломать сборку docs-site (`npm run build` в каталоге docs-site, если есть в CI).

## Требования к дизайн-системе

- В доках **не предлагать** обход DS; любые упоминания UI — только в терминах `@april/ui`/Mantine как в коде виджета.

## Критерии готовности (acceptance)

- [ ] `WIDGET_CONTRACTS`/`CHECKLIST`/каталог виджетов согласованы с финальной реализацией embed.
- [ ] docs-site: новые story-страницы + строки в overview.
- [ ] Handoff markdown добавлен и ссылка на него есть из карточки виджета или раздела integration docs.
- [ ] docs-site build проходит локально при наличии команды в проекте (указать в REPORT фактической командой).

## Проверка (команды)

```bash
# при наличии npm scripts docs-site — выполнить build
cd docs-site && npm ci && npm run build
```

## Результат в отчёте

Ссылочная матрица: какой документ для какой аудитории; что остаётся внешнему исполнителю Hub.
