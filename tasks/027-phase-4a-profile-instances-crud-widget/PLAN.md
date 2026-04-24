# План: Фаза 4a.2 — `ProfileInstancesWidget` и CRUD экземпляров

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-24
- **Статус плана:** согласован и выполнен

## Исходные допущения
- Работа ограничена AprilProfile (`@april/profile-ui`, demo shell, тесты и документация) без встраивания в AprilHub.
- API фазы 2 не содержит отдельный list endpoint по `profileId`, поэтому список экземпляров строится по входному `instanceIds` с клиентской фильтрацией по `entity_type_id === profileId`.
- Источник прав остаётся в Keycloak/backend; виджет не обходит RBAC/ABAC и только показывает предсказуемое UX-поведение (`hidden/readonly/denied`).

## Порядок работ (шаги)
1. Добавить в `@april/profile-ui` компонент `ProfileInstancesWidget` и типы `props/events`.
2. Реализовать загрузку экземпляров в контексте `profileId`, клиентские поиск/пагинацию и навигационное событие `onOpenInstance`.
3. Реализовать CRUD экземпляра через OpenAPI-клиент (`createEntityProfile`, `updateEntityProfile`, `deleteEntityProfile`).
4. Добавить ABAC UX-ветки: `hidden` (пропуск несуществующих/скрытых), `readonly` (блок write после `403`), `denied` (баннер при `401/403` на чтении).
5. Добавить unit/RTL + MSW тесты happy-path и негативных сценариев.
6. Обновить README пакета, demo shell, docs-site story, overview и отчёт `REPORT.md`.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Frontend / packages | Новый `ProfileInstancesWidget`, типы событий и тесты в `@april/profile-ui` |
| Frontend / shell | Новый demo-route `/profile-instances-widget-demo` |
| OpenAPI | Используется текущий контракт без расширений |
| Документация | README пакета, story задачи в `docs-site`, `REPORT.md`, `task_list.md` |

## Риски и откат
- **Риск:** отсутствие серверного list/search по `profileId` ограничивает масштабируемость на больших наборах. **Митигация:** явно зафиксировать ограничение в отчёте.
- **Риск:** пользователь может ожидать granular ABAC-модель по операциям до первого `403`. **Митигация:** fallback в `readonly` после запрета записи и явный текст в UI.
- **Откат:** удалить новый виджет/route/документацию и вернуть пакет к состоянию после `025`.

## Проверка после выполнения
- `cd frontend && npm run lint -w @april/profile-ui`
- `cd frontend && npm run test -w @april/profile-ui`
- `cd frontend && npm run build -w @april/profile-ui`

## Примечания
- Связанные задачи: `025` (база списка/CRUD), `028` (host/e2e для экземпляров), `035` (UI shell AprilHub).
