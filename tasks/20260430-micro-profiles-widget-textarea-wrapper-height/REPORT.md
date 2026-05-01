## 1) Итого

- Статус: ✅ выполнено
- Задача: Micro-task — `height: 100%` для обёрток JSON-`Textarea` в правой панели `ProfilesWidgetCore` (`Profile document` / `Updated document`).
- Ветка: `feature/20260430-micro-profiles-widget-textarea-wrapper-height` (рекомендуется PR в `develop`).
- Коммиты: единственный коммит на ветке задачи с сообщением `fix(profile-ui): full-height Textarea wrappers in ProfilesWidget detail panel` (хэш: `git log -1 --format=%H`).
- PR: не создавался из среды исполнителя.

## 2) Что сделано

- [frontend] В `ProfilesWidgetCore.tsx` введена общая константа **`profileDetailsDocumentTextareaStyles`** (`satisfies TextareaProps["styles"]`): для **`root`** (внешний `Input.Wrapper`) и **`wrapper`** (оболочка поля Mantine `Input`) задано **`height: "100%"`**, плюс сохранены **`flex: 1`**, **`minHeight: 0`** и стили **`input`** (`resize: "none"`, полная высота).
- [frontend] Оба режима правой панели (`Updated document` при редактировании и read-only `Profile document`) используют одни и те же стили — без дублирования объектов.

## 3) Изменённые файлы

- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`
- `tasks/20260430-micro-profiles-widget-textarea-wrapper-height/REPORT.md`

## 4) Миграции и данные

- Нет.

## 5) Проверка качества

- Линтер `@april/profile-ui`: ok (`tsc --noEmit -p tsconfig.json`).
- Сборка: ok (`npm run build -w @april/profile-ui`).
- Unit tests: ok (`npm run test -w @april/profile-ui`, 23 теста).

Команды (фактически выполненные):

```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
```

## 6) Деплой

- Не требовался.

## 7) Риски и ограничения

- Визуальная проверка в браузере в рамках micro-task не автоматизировалась; при регрессии flex-цепочки справа возможна потребность скорректировать родительские `Stack`/`Box`.

## 8) Что осталось

- [ ] Задача **058**: перевод документа профиля на JSON-компоненты `@april/ui` (замена `Textarea` целиком).
