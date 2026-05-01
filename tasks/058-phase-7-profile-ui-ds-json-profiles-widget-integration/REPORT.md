## 1) Итого

- Статус: ✅ выполнено
- Задача: 058 — JSON-редакторы `@april/ui` в `profiles-widget` (документ профиля)
- Ветка: `feature/task-058-phase-7-profile-ui-ds-json-profiles-widget-integration`
- Коммиты: `3ecc8ca`
- PR: не создавался из среды агента

## 2) Что сделано

- [frontend] `ProfilesWidgetCore`: создание и редактирование **`document`** через **`EntityTypesDraftJsonEditor`** (Tree / Source, `AprilJsonCollectionTextEditor`, `AprilJsonValidationSummary`); просмотр (в т.ч. историческая версия без режима Edit) — read-only **`AprilJsonTreeEditor`**; корень виджета обёрнут в **`DensityProvider`**.
- [frontend] Состояние документа на **`Record<string, unknown>`** + source-текст и режим; при **422** с **`schemaIssues`** — отображение в summary редактора (`createApiIssues` / `editApiIssues`); кнопки Save/Create учитывают валидность source-режима.
- [frontend] Тесты: расширен мок **`@april/ui`**, сценарии create/update используют **`data-testid`** `profiles-widget-create-document` / `profiles-widget-edit-document`.
- [docs] **`docs/widgets/profile/profiles-widget.md`** §5 — перечень DS-компонентов и политика JSON.
- [docs-site] Страница **`task-story-058-phase-7-profile-ui-ds-json-profiles-widget.md`**, строка в **`task-stories-overview.md`**; **`task_list.md`** — задача 058 отмечена выполненной.
- [tasks] Обновлён **`PLAN.md`** (режим Form отложен: нет схемы в `EntityTypeOption` / провайдере).

## 3) Изменённые файлы

- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.test.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidget.test.tsx`
- `docs/widgets/profile/profiles-widget.md`
- `tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/PLAN.md`
- `tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/REPORT.md`
- `docs-site/docs/task-story-058-phase-7-profile-ui-ds-json-profiles-widget.md`
- `docs-site/docs/task-stories-overview.md`
- `task_list.md`

## 4) Миграции и данные

- Нет.

## 5) Проверка качества

- Линтер `@april/profile-ui`: ok (`tsc --noEmit`)
- Сборка `@april/profile-ui`: ok
- Unit tests `@april/profile-ui`: ok (23 теста)
- Go: ok (`go test ./...`)

Команды:

```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
go test ./...
```

## 6) Деплой

- Не применялся (изменения в UI-пакете и документации).

## 7) Риски и ограничения

| Риск / ограничение | Комментарий |
|--------------------|-------------|
| Переиспользование `EntityTypesDraftJsonEditor` по имени | Общая логика Tree/Source идентична 057; при росте числа потребителей имеет смысл вынести нейтральный `DsJsonObjectEditor` в отдельный модуль. |
| Режим Form (`AprilJsonSchemaForm`) | Не внедрён: в `listEntityTypes` нет JSON Schema для документа профиля без расширения API/SDK. |
| Двойной Ajv / клиент vs сервер | Как в 057: минимальная проверка корня объекта на клиенте. |

## 8) Компоненты `@april/ui` по экранам

| Компонент | Где |
|-----------|-----|
| `DensityProvider` | Корень `ProfilesWidgetCore` |
| `CardListColumn` | Список профилей (без изменений по роли) |
| `EntityTypesDraftJsonEditor` | Модалка Create; правая колонка в режиме Edit (`AprilJsonTreeEditor` / `AprilJsonCollectionTextEditor` + summary) |
| `AprilJsonTreeEditor` | Просмотр документа (read-only), в т.ч. при выборе исторической версии без Edit |

## 9) Что осталось

- [ ] Опционально: **`AprilJsonSchemaForm`** при появлении схемы типа для документа в провайдере / OpenAPI.
