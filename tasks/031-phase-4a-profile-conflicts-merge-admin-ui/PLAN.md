# План: UI очереди конфликтов и merge-дубликатов (`ConflictQueueWidget`)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-24
- **Статус плана:** согласован

## Исходные допущения

- Админ-эндпоинты уже описаны в `openapi/openapi.yaml` и попадают в `AdminService` при `npm run generate:api` в `@april/profile-ui`.
- Права (`april-profile-admin` и т.д.) выдаются в Keycloak; UI только отображает `401/403` и не подменяет политику.
- Локальная проверка — через demo-маршрут во `frontend/` и MSW в unit-тестах.

## Порядок работ (шаги)

1. Реализовать `ConflictQueueWidget` в `frontend/packages/profile-ui` на базе `AdminService` + Mantine (список, фильтры, детали, модалки подтверждения resolve/merge).
2. Добавить Vitest/RTL + MSW: успешная загрузка, фильтр, `403` на списке, успешный resolve, `409` на merge.
3. Экспорт из `src/index.ts`, demo-страница в `frontend/src/App.tsx`, обновить README пакета и каталог `docs/widgets`.
4. Человекопонятная страница в `docs-site` + `task-stories-overview.md`, чекбоксы в `TASK.md`, строка в `task_list.md`.
5. Прогон `make openapi-lint`, `make docs-build`, `cd frontend && npm ci && npm run lint && npm run test && npm run build`.
6. Оформить [`REPORT.md`](./REPORT.md) по шаблону.

## Затрагиваемые области

| Область | Что меняется (кратко) |
|--------|------------------------|
| Frontend | Новый виджет, тесты, demo-маршрут |
| OpenAPI | Без правок (используем существующий контракт) |
| Документация | docs-site, `docs/widgets`, README пакета, task artifacts |

## Риски и откат

- **Риск:** на стенде нет прав админ-роли → **Митигация:** явный UX для `403`, зафиксировать в REPORT.
- Откат: revert ветки `feature/phase-4a-conflict-queue-widget`.

## Проверка после выполнения

- Команды из `TASK.md` (см. раздел «Проверка»).
- Ручно: `npm run dev`, `/conflict-queue-widget-demo` с токеном и базой API.

## Примечания

- Связанные задачи: [`012`](../012-phase-2-authority-merge-conflicts/), Hub-хостинг — [`032`](../032-phase-4a-hub-conflicts-merge-host-rbac/).
