# Задача 043: API-ready контур для `ProfilesWidget` (server-side list/search/filter/pagination + SDK)

## Мета
- **ID / ветка:** `feature/task-043-profiles-widget-api-list-contract-and-sdk`
- **Приоритет:** высокий
- **Связанные документы:** [`task_list.md`](../../task_list.md), [`tasks/042-phase-6-profiles-widget-production-architecture/TASK.md`](../042-phase-6-profiles-widget-production-architecture/TASK.md), [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md), [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md)

## Цель
Подготовить backend/OpenAPI/SDK основу для production `ProfilesWidget`: добавить/зафиксировать контракт server-side списка профилей (search/filter/pagination/sort), унифицировать формат ошибок и request-id, чтобы фронтенд-реализация 044 не использовала входной `entityIds` и локальную псевдо-пагинацию.

## Контекст для агента
- Задача 042 определяет архитектурные инварианты и provider-контракт.
- Текущий frontend SDK не содержит list endpoint для `ProfilesService`.
- Реализация 044 запрещена до появления API-контракта, который покрывает list/search/filter/pagination на сервере.
- Приоритет на согласованный контракт и предсказуемость интеграции, а не на минимальный «рабочий» обходной путь.

## Входит в объём
- Backend API (или OpenAPI-спека, если backend ведётся в другом репозитории):
  - endpoint списка профилей с query-параметрами:
    - `search` (по `entity_id` и релевантным полям preview),
    - `entity_type_id`,
    - `limit`,
    - `cursor`,
    - `sort`.
  - ответ с `items[]`, `next_cursor`, `total_count` (если поддерживается).
- Контрактная нормализация ошибок:
  - минимум: `401/403/409/422/429/5xx`;
  - машинный `code`, безопасный `message`, `request_id`.
- Генерация/обновление frontend OpenAPI SDK (`@april/profile-ui/src/generated`) с новым list методом.
- Документация контракта и примеров запросов/ответов.
- Тесты уровня API/контракта на server-side list semantics (search/filter/pagination).

## Не входит в объём
- Рефакторинг `ProfilesWidget` UI в Core/Adapter модель (задача 044).
- Полный Hub e2e встраивания (отдельная интеграционная задача после 044).
- Изменение IAM-модели (роль/tenant enforcement остаётся по текущей архитектуре).

## Технические ограничения
- Server-side пагинация обязательна; локальный `slice` как primary стратегия запрещён.
- Cursor pagination обязательна; offset-only режим не использовать как единственный.
- Поиск/фильтрация должны выполняться на сервере; frontend не должен имитировать это только клиентской фильтрацией полной выборки.
- Контракт OpenAPI и generated SDK должны быть синхронизированы в одном изменении.
- Ошибки должны возвращать `request_id`; отсутствие request-id считается невыполнением задачи.

## Критерии готовности (acceptance)
- [x] В OpenAPI/контракте определён list endpoint для профилей с search/filter/sort/cursor.
- [x] Generated SDK в `frontend/packages/profile-ui/src/generated` содержит соответствующий метод и типы.
- [x] Контракт ошибок для list/create/update/delete согласован по code/message/request_id.
- [x] API/контрактные тесты подтверждают корректную пагинацию и фильтрацию.
- [x] Документация обновлена так, чтобы задача 044 могла реализовываться без догадок.
- [x] Нет временных fallback-решений вида «если list нет — используем entityIds».

## Проверка (команды)
```bash
# backend (уточнить под фактический модуль/репозиторий)
go test ./...

# frontend SDK и сборка
cd frontend && npm run lint && npm run test && npm run build
```

## Результат в отчёте
Кратко: какой endpoint/контракт добавлен, как заданы search/filter/pagination semantics, какие ошибки и request_id стандартизированы, какие тесты и проверки подтверждают готовность к 044.

## Человекопонятная история в docs-site (обязательно)
- [x] Создана/обновлена страница `docs-site/docs/task-story-043-phase-6-profiles-widget-api-list-contract-and-sdk.md`.
- [x] В [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) добавлена ссылка и статус.
- [x] Простым языком объяснено, почему без server-side list нельзя сделать production `ProfilesWidget`.
- [x] В конце страницы даны ссылки на `tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/TASK.md`, `PLAN.md`, `REPORT.md`.
