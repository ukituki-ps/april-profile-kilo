# План: Фаза 4a.3 — `InstanceHistoryWidget` (таймлайн версий + diff)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-24
- **Статус плана:** согласован и выполнен

## Исходные допущения
- Работа ограничена репозиторием AprilProfile и пакетом `@april/profile-ui`, без Hub-host маршрутизации и e2e.
- В текущем OpenAPI контракте нет endpoint-а restore версии, поэтому история реализуется в read-only режиме.
- Append-only модель соблюдается: UI только читает версии и визуализирует изменения.

## Порядок работ (шаги)
1. Добавить `InstanceHistoryWidget` в `@april/profile-ui` с загрузкой версий экземпляра и таймлайном метаданных.
2. Реализовать просмотр выбранной версии и diff документа относительно текущей или предыдущей версии.
3. Зафиксировать read-only ограничение (без restore) в UI и документации.
4. Добавить unit/RTL + MSW тесты для таймлайна, выбора версии и diff.
5. Обновить публичные экспорты/README пакета и demo route в `frontend/src/App.tsx`.
6. Обновить документацию задачи: docs-site story, overview, `task_list.md`, `REPORT.md`.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Frontend / packages | Новый `InstanceHistoryWidget`, тесты, экспорты, README |
| Frontend / shell | Новый demo-route `/instance-history-widget-demo` |
| OpenAPI | Используется существующий контракт (`current` + `by version`) без расширений |
| Документация | `PLAN.md`, `REPORT.md`, docs-site story, overview, `task_list.md` |

## Риски и откат
- **Риск:** на сущностях с большим количеством версий чтение всех версий может быть дорогим. **Митигация:** зафиксировать ограничение и вынести server-side pagination/list versions в follow-up.
- **Риск:** отсутствие restore может восприниматься как неполный сценарий. **Митигация:** явный read-only баннер и фиксация ограничения в отчёте/истории.
- **Откат:** удалить `InstanceHistoryWidget`, route и docs-изменения; вернуть пакет к состоянию после задачи `027`.

## Проверка после выполнения
- `cd frontend && npm run lint -w @april/profile-ui`
- `cd frontend && npm run test -w @april/profile-ui`
- `cd frontend && npm run build -w @april/profile-ui`

## Примечания
- Связанные задачи: `027` (instances CRUD), `030` (Hub host/e2e), `033` (widget observability readiness).
