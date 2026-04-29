# Задача 042: production-архитектура `ProfilesWidget` (Core + API adapter, без legacy-режимов)

## Мета
- **ID / ветка:** `feature/task-042-profiles-widget-production-architecture`
- **Приоритет:** высокий
- **Связанные документы:** [`task_list.md`](../../task_list.md), [`tasks/041-phase-5-widget-card-to-profiles-widget/TASK.md`](../041-phase-5-widget-card-to-profiles-widget/TASK.md), [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md), [`docs/WIDGET_RELEASE_CHECKLIST.md`](../../docs/WIDGET_RELEASE_CHECKLIST.md), [`docs/WIDGET_OBSERVABILITY_GUIDE.md`](../../docs/WIDGET_OBSERVABILITY_GUIDE.md)

## Цель
Зафиксировать целевую архитектуру `ProfilesWidget` как production-first решения без демо-ориентированного data flow: выделить `ProfilesWidgetCore` (UI/state machine), `ProfilesApiWidget` (OpenAPI data adapter), новый контракт data-provider и обязательные архитектурные инварианты, которые запрещают «ускоренные»/временные реализации в последующих задачах.

## Контекст для агента
- Опора на [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md), [`README.md`](../../README.md), [`docs/AGENT_MASTER_PROMPT.md`](../../docs/AGENT_MASTER_PROMPT.md).
- В задаче 041 виджет `Profiles` выделен из `widget-card`, но контракт всё ещё основан на входном списке `entityIds`.
- Требуется новый baseline-контракт: источник данных находится внутри виджета через provider/API, а не через прокидывание подготовленного списка id из демо/хоста.
- После закрытия задачи 042 любые реализации задач 043+ должны проверяться на соответствие инвариантам из этой постановки.

## Входит в объём
- Архитектурная декомпозиция компонента:
  - `ProfilesWidgetCore` (чистый UI + state machine + callbacks + observability calls);
  - `ProfilesApiWidget` (создание OpenAPI provider и wiring с hostContext);
  - `ProfilesWidget` как публичный фасад (alias на API-реализацию).
- Формализация и документирование доменных контрактов:
  - `ProfilesDataProvider`;
  - доменные типы (`list item`, `details`, `query`, `page`, `mutation inputs`, `normalized provider error`);
  - контракт ошибок и безопасных сообщений UI.
- Формализация жизненного цикла данных:
  - initial load;
  - server-side search/filter/pagination;
  - selection/details loading;
  - create/update/delete с консистентным обновлением list/detail.
- Формализация observability-контракта для нового потока (минимальный обязательный набор telemetry event/meta).
- Формализация критериев архитектурной готовности для реализации задач 043+.
- Обновление проектной документации (контракты виджетов, README пакета, docs/widgets карточка) под новую модель.

## Не входит в объём
- Реализация backend endpoint-ов, если они отсутствуют (это отдельная задача 043).
- Фактический рефакторинг UI-компонента в коде (это задача 044).
- Hub-host интеграция/e2e в `april-worker` (выносится в follow-up после 044).

## Технические ограничения
- Стек и границы платформы: только в рамках текущей архитектуры проекта.
- **Строгий запрет** на новый публичный контракт с `entityIds` как основным источником списка.
- **Строгий запрет** смешивать транспортный слой (OpenAPI/baseUrl/token) в `ProfilesWidgetCore`.
- **Строгий запрет** переносить demo-env (`VITE_*_DEMO_*`) в runtime-контракт production виджета.
- DS-first обязателен: использовать `@april/ui`/Mantine-паттерны без локального редизайна.
- Ошибки API показываются только через безопасный message mapping (без утечки backend/raw body).

## Требования к дизайн-системе (для frontend-задачи)
- [x] Проверены покрывающие паттерны `@april/ui` для list/master-detail и action toolbar.
- [x] Зафиксировано, какие DS-компоненты являются обязательными для новой реализации.
- [x] Для любого кастомного UI заранее описано техническое обоснование и критерии допустимости.
- [x] Обновлены docs и тест-план в соответствии с DS-first правилами.

## Критерии готовности (acceptance)
- [x] В документации зафиксирована целевая архитектура `Core + Api adapter + Facade` с диаграммой ответственности.
- [x] Описан и согласован полный `ProfilesDataProvider` контракт (методы, входы/выходы, ошибки, отмена запросов).
- [x] Зафиксирован запретный список решений (anti-patterns), который исключает возврат к demo-first модели.
- [x] Зафиксирован детальный execution plan для задач 043/044 с порядком шагов и точками контроля.
- [x] Обновлены документы контракта виджетов/README так, чтобы реализация могла вестись без трактовок.
- [x] Явно определены зависимости и preconditions для старта 043/044.

## Проверка (команды)
```bash
# Проверка на этой задаче документарная:
# - архитектурный review по TASK/PLAN и обновленным docs
# - формальные критерии готовности для следующей реализации
```

## Результат в отчёте
Кратко: какие архитектурные решения утверждены, какие контракты зафиксированы, какие анти-паттерны запрещены, какие именно входные критерии даны для старта реализации.

## Человекопонятная история в docs-site (обязательно)
- [x] Создана/обновлена страница `docs-site/docs/task-story-042-phase-6-profiles-widget-production-architecture.md`.
- [x] В [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) добавлена ссылка и статус.
- [x] Простым языком объяснено, почему прошлый подход считался demo-first и как новый baseline устраняет риск «самодеятельности».
- [x] В конце страницы даны ссылки на `tasks/042-phase-6-profiles-widget-production-architecture/TASK.md`, `PLAN.md`, `REPORT.md`.
