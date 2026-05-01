## 1) Итого
- Статус: ✅ выполнено
- Задача: 062-docs-profiles-widget-spec-list-content-assembly — разнесение спецификации `profiles-widget` на list / profile-detail / индекс-сборка
- Ветка: `feature/062-profiles-widget-docs-list-detail-split`
- Коммиты: один коммит на ветке (сообщение: `docs(profiles-widget): split spec into list, detail, and assembly index`); полный hash — `git log -1` на `feature/062-profiles-widget-docs-list-detail-split`
- PR: не создавался (push не выполнялся)

## 2) Что сделано
- [docs] Добавлены `docs/widgets/profile/profiles-widget-list.md` и `docs/widgets/profile/profiles-widget-profile-detail.md` с переносом нормативного содержания из монолитной карточки без ослабления DS-first и anti-patterns.
- [docs] `docs/widgets/profile/profiles-widget.md` преобразован в короткую **сборку**: мета, таблица ссылок на под-спеки, mermaid, обзор контракта, абзац **расширяемости** (перспектива registry/host без обязательств API v1), release gate, ограничения, артефакты задач + ссылка на задачу 062.
- [docs] Обновлены `docs/widgets/README.md`, `docs-site/docs/widget-catalog.md`; в `frontend/packages/profile-ui/README.md` добавлены ссылки на три markdown-файла.
- [process] `task_list.md`: задача 062 отмечена выполненной; чеклисты в `tasks/062-.../TASK.md` закрыты.

## 3) Изменённые файлы
- `docs/widgets/profile/profiles-widget-list.md` (новый)
- `docs/widgets/profile/profiles-widget-profile-detail.md` (новый)
- `docs/widgets/profile/profiles-widget.md`
- `docs/widgets/README.md`
- `docs-site/docs/widget-catalog.md`
- `frontend/packages/profile-ui/README.md`
- `task_list.md`
- `tasks/062-docs-profiles-widget-spec-list-content-assembly/TASK.md`
- `tasks/062-docs-profiles-widget-spec-list-content-assembly/REPORT.md`

## 4) Миграции и данные
- Нет.

## 5) Проверка качества
- Линтер: ok (`tsc --noEmit` для `@april/profile-ui`)
- Сборка: не запускалась (изменения документации и README)
- Unit tests: не запускались
- Integration / E2E: не применялись

Команды (фактически выполненные):
```bash
cd frontend && npm run lint -w @april/profile-ui
```

## 6) Деплой
- Не применялся (только документация и README пакета).

## 7) Риски и ограничения
- Внешние ссылки на `docs/widgets/profile/profiles-widget.md` остаются валидными; глубина § изменилась — якоря `#...` из старых закладок могут не совпадать.
- Дублирование: мета-таблица виджета остаётся только в индексе `profiles-widget.md`.

## 8) Что осталось
- [ ] Задача **063** — аналогичное разнесение для `entity-types-widget`.
- [ ] При желании: короткие правки в docs-site task-story страницах, где в тексте указан только один путь к карточке (не входило в scope 062).
