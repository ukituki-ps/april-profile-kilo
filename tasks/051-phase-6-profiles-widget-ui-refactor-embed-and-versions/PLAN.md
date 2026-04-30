# План: UI `ProfilesWidget` — embed, версии, имя, Select типов

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-29
- **Статус плана:** выполнен (2026-04-29)

## Исходные допущения
- Список версий получаем параллельными `GET …/versions/{n}` для `n = 1..currentVersion` (как `InstanceHistoryWidget`), без нового aggregate-endpoint.
- Уникальность имени профиля (`document.name`): клиентская проверка по уже загруженному списку; серверный unique constraint — follow-up при появлении API.
- Иконки: `@tabler/icons-react` (совместимо с Mantine 7), если пакет добавлен в `@april/profile-ui`.

## Порядок работ (шаги)
1. Расширить `ProfilesDataProvider`: `getByVersion`, `listEntityTypes`; реализовать в `openapiProfilesProvider`.
2. Утилиты отображаемого имени из `document` / preview JSON.
3. Переработать layout `ProfilesWidgetCore`: `height/flex`, колонки без фиксированных 25/75%, `minWidth: 0`.
4. Убрать отладочный заголовок; список: имя + версия; карточка: версии Select, историческая версия read-only + кнопка новой версии.
5. Иконки `ActionIcon`; модалка создания: Select типа + имя + JSON.
6. Тесты, документация виджета, страница docs-site, `REPORT.md`.

## Затрагиваемые области
| Область | Изменения |
|--------|-----------|
| Frontend `@april/profile-ui` | `ProfilesWidgetCore`, провайдер, тесты, `package.json` (icons) |
| Docs | `docs/widgets/profile/profiles-widget.md`, `docs-site` story |
| Backend | Нет (контракт OpenAPI уже есть) |

## Риски и откат
- **Много запросов версий** при большом `version` → митигация: тот же риск, что у history widget; при проблемах — отдельный list endpoint.
- **Откат:** revert PR по ветке feature.

## Проверка
- Команды из `TASK.md`; ручно: демо `/profiles-widget-demo` при наличии маршрута.
