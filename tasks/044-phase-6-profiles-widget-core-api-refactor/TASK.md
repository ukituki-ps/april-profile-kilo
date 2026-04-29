# Задача 044: рефактор `ProfilesWidget` в модель `Core + ApiWidget` и удаление demo-first поведения

## Мета
- **ID / ветка:** `feature/task-044-profiles-widget-core-api-refactor`
- **Приоритет:** высокий
- **Связанные документы:** [`task_list.md`](../../task_list.md), [`tasks/042-phase-6-profiles-widget-production-architecture/TASK.md`](../042-phase-6-profiles-widget-production-architecture/TASK.md), [`tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/TASK.md`](../043-phase-6-profiles-widget-api-list-contract-and-sdk/TASK.md), [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md), [`docs/WIDGET_OBSERVABILITY_GUIDE.md`](../../docs/WIDGET_OBSERVABILITY_GUIDE.md), [`frontend/packages/profile-ui/README.md`](../../frontend/packages/profile-ui/README.md)

## Цель
Реализовать `ProfilesWidget` в production-архитектуре: вынести UI/state machine в `ProfilesWidgetCore`, подключить `ProfilesApiWidget` через OpenAPI provider, удалить из публичного контракта `entityIds`, перевести data flow на server-side list/search/filter/pagination, и сделать демо-страницу только thin-host слоем без логики источника данных.

## Контекст для агента
- 042 уже определяет архитектуру и запреты.
- 043 уже обеспечивает API/SDK list endpoint.
- Текущая реализация имеет demo-first признаки (входные `entityIds`, локальная фильтрация/псевдо-пагинация).
- Требуется однозначный переход без fallback-веток на старый режим.

## Входит в объём
- Реализация `ProfilesWidgetCore`:
  - загрузка list через provider;
  - server-side search/filter/pagination;
  - loading/empty/error states;
  - details loading и отмена устаревших запросов;
  - create/update/delete flows;
  - консистентность list/detail после мутаций.
- Реализация `ProfilesApiWidget`:
  - OpenAPI adapter к `ProfilesDataProvider`;
  - mapping API DTO <-> domain types;
  - mapping API errors -> normalized provider error.
- Публичный API:
  - `ProfilesWidget` как фасад на `ProfilesApiWidget`;
  - удаление/запрет `entityIds` в публичном контракте;
  - обновление export surface (`index.ts`).
- Демо/хост:
  - в `frontend/src/App.tsx` убрать demo-only sourcing списка;
  - оставить только host setup (`apiBaseUrl`, `accessToken`, hostContext, callbacks).
- Тесты:
  - unit/RTL для `Core` через mock provider;
  - integration tests для API adapter (ошибки/маппинг/события);
  - регрессии на create/update/delete/search/filter/pagination.
- Документация:
  - package README;
  - `docs/widgets/profile/profiles-widget.md`;
  - docs-site story и overview.

## Не входит в объём
- Добавление новых бизнес-фич за пределами текущего UX (массовые операции, новые формы редактирования и т.д.).
- Hub e2e за пределами локального smoke этого репозитория.
- Изменение IAM-политик и backend бизнес-логики вне потребностей контракта 043.

## Технические ограничения
- `ProfilesWidgetCore` не должен импортировать OpenAPI/generated services/env.
- Все сетевые вызовы идут только через `ProfilesDataProvider`.
- Локальная фильтрация/пагинация допустима только как вторичный UX-слой поверх текущей страницы, но не как источник истины.
- Обязательна поддержка отмены in-flight list/details запросов при смене фильтров/selection.
- Error UI только безопасный; raw backend messages запрещены.
- В observability обязательны события минимум: `view_loaded`, `save_submitted`, `save_succeeded`, `save_failed` + metadata по операции.

## Требования к дизайн-системе (для frontend-задачи)
- [x] Реализация list/master-detail базируется на `@april/ui` и текущем DS подходе.
- [x] UI-состояния `loading/empty/error/busy` реализованы через консистентные DS-компоненты.
- [x] Нет незадокументированного кастомного UI в обход DS.
- [x] Тесты и docs отражают итоговую DS-реализацию.

## Критерии готовности (acceptance)
- [x] Публичный контракт `ProfilesWidget` не содержит `entityIds`.
- [x] Виджет получает список через provider/API list endpoint (из 043), а не через внешний набор ID.
- [x] Реализованы и покрыты тестами server-side search/filter/pagination.
- [x] CRUD-операции корректно обновляют list/detail без рассинхронизации.
- [x] Ошибки `401/403/409` и network/unknown корректно маппятся в secure UX сообщения.
- [x] Демо-маршрут не содержит demo-first логики источника списка.
- [x] Обновлены docs (`README`, widgets docs, docs-site overview/story).
- [x] Команды lint/test/build проходят.

## Проверка (команды)
```bash
cd frontend && npm run lint && npm run test && npm run build
```

## Результат в отчёте
Кратко: как реализована декомпозиция `Core + ApiWidget`, какие файлы/контракты изменены, какие legacy-паттерны удалены, какие тесты подтвердили отсутствие regressions.

## Человекопонятная история в docs-site (обязательно)
- [x] Создана/обновлена страница `docs-site/docs/task-story-044-phase-6-profiles-widget-core-api-refactor.md`.
- [x] В [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) добавлена ссылка и статус.
- [x] Простым языком объяснено, как виджет перестал быть demo-first и стал production-ready.
- [x] В конце страницы даны ссылки на `tasks/044-phase-6-profiles-widget-core-api-refactor/TASK.md`, `PLAN.md`, `REPORT.md`.
