## 1) Итого
- Статус: ✅ выполнено
- Задача: 063-docs-entity-types-widget-spec-surfaces-assembly — разнесение карточки `entity-types-widget` на поверхности + индекс-сборка
- Ветка: `feature/063-entity-types-widget-docs-surfaces`
- Коммит: один коммит с сообщением `docs(entity-types-widget): split spec into catalog, schema-admin, upgrade, integration (063)` — см. `git log -1` на этой ветке
- PR: не создавался (push не выполнялся)

## 2) Что сделано
- [docs] Добавлены четыре под-дока в `docs/widgets/profile/`: `entity-types-widget-catalog-list.md`, `entity-types-widget-schema-admin.md`, `entity-types-widget-entities-upgrade.md`, `entity-types-widget-integration.md` (таблица props / `onAction` / ошибки — вынесены в integration по выбору исполнителя, чтобы индекс оставался короче).
- [docs] `entity-types-widget.md` переписан как **сборка**: мета, таблица ссылок на поверхности, mermaid Core/Api/Provider, сводки контракта/DS/API/безопасности/качества, таблица задач + ссылка на **063**.
- [docs] `docs/integration/entity-types-widget-hub-handoff.md` — в блоке «Ссылки» перечислены под-спеки.
- [docs] `docs/widgets/README.md`, `docs-site/docs/widget-catalog.md` — главная ссылка на индекс + перечень под-файлов.
- [frontend] `EntityTypesWidget.tsx` — комментарий к фасаду; `frontend/packages/profile-ui/README.md` — ссылки на спеки.
- [process] `task_list.md`: задача **063** отмечена выполненной; чеклисты в `tasks/063-.../TASK.md` закрыты.

## 3) Изменённые файлы
- `docs/widgets/profile/entity-types-widget-catalog-list.md` (новый)
- `docs/widgets/profile/entity-types-widget-schema-admin.md` (новый)
- `docs/widgets/profile/entity-types-widget-entities-upgrade.md` (новый)
- `docs/widgets/profile/entity-types-widget-integration.md` (новый)
- `docs/widgets/profile/entity-types-widget.md`
- `docs/integration/entity-types-widget-hub-handoff.md`
- `docs/widgets/README.md`
- `docs-site/docs/widget-catalog.md`
- `frontend/packages/profile-ui/README.md`
- `frontend/packages/profile-ui/src/components/EntityTypesWidget.tsx`
- `task_list.md`
- `tasks/063-docs-entity-types-widget-spec-surfaces-assembly/TASK.md`
- `tasks/063-docs-entity-types-widget-spec-surfaces-assembly/REPORT.md`

## 4) Миграции и данные
- Нет.

## 5) Проверка качества
- Линтер: ok (`npm run lint -w @april/profile-ui` → `tsc --noEmit`)
- Сборка / тесты: не запускались (документация + комментарий)

Команды (фактически выполненные):
```bash
cd frontend && npm run lint -w @april/profile-ui
```

## 6) Деплой
- Не применялся.

## 7) Риски и ограничения
- Внешние ссылки на `entity-types-widget.md` остаются валидными; нумерация § в индексе изменилась — старые якоря к монолиту могут не совпадать.
- Добавлен **четвёртый** файл (`…-integration.md`) сверх минимума «три + индекс» — для таблицы props без раздувания индекса; альтернатива — вложить ту же таблицу в `entity-types-widget.md`.

## 8) Что осталось
- [ ] При желании: обновить docs-site task-story страницы, где указан только один путь к карточке (вне scope 063).
