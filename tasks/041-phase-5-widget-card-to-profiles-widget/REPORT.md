## 1) Итого
- Статус: ✅ выполнено
- Задача: 041 — выделить из `widget-card` отдельный виджет `Profiles`
- Ветка: `develop`
- Коммиты: не создавались
- PR: не создавался

## 2) Что сделано
- [backend] Изменений нет (задача полностью frontend/docs).
- [frontend] Добавлен самостоятельный публичный компонент `ProfilesWidget` в `@april/profile-ui` (`src/components/ProfilesWidget.tsx`) как основной продуктовый интерфейс.
- [frontend] Сохранена обратная совместимость: `ProfilesListWidget` и его типы оставлены в экспортах пакета как alias к той же реализации.
- [frontend] Demo-shell обновлён: основной маршрут теперь `/profiles-widget-demo`; старый `/profiles-list-widget-demo` сохранён как alias и ведёт в тот же экран.
- [frontend] RTL-тесты сценария списка/CRUD переведены на `ProfilesWidget` как основной вход.
- [docs] Обновлены:
  - `frontend/packages/profile-ui/README.md` (новое публичное имя `ProfilesWidget` + примечание про alias),
  - `docs/widgets/README.md` и новая карточка `docs/widgets/profile/profiles-widget.md`,
  - `docs-site/docs/task-story-041-phase-5-widget-card-to-profiles-widget.md`,
  - `docs-site/docs/task-stories-overview.md`,
  - `tasks/041.../TASK.md`, `PLAN.md`, `REPORT.md`,
  - `task_list.md` (задача 041 отмечена как выполненная).

## 3) Изменённые файлы
- `frontend/packages/profile-ui/src/components/ProfilesWidget.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesListWidget.test.tsx`
- `frontend/packages/profile-ui/src/index.ts`
- `frontend/packages/profile-ui/README.md`
- `frontend/src/App.tsx`
- `docs/widgets/README.md`
- `docs/widgets/profile/profiles-widget.md`
- `docs-site/docs/task-story-041-phase-5-widget-card-to-profiles-widget.md`
- `docs-site/docs/task-stories-overview.md`
- `tasks/041-phase-5-widget-card-to-profiles-widget/TASK.md`
- `tasks/041-phase-5-widget-card-to-profiles-widget/PLAN.md`
- `tasks/041-phase-5-widget-card-to-profiles-widget/REPORT.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да (revert frontend/docs изменений)

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: не применялось
- E2E / smoke: не применялось

Команды (фактически выполненные):
```bash
cd frontend && npm run lint && npm run test && npm run build
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: нет

## 7) Риски и ограничения
- `ProfilesWidget` реализован как тонкая обёртка над `ProfilesListWidget` для безопасного перехода без дублирования логики; технический долг по неймингу базовой реализации остаётся допустимым follow-up.
- Для телеметрии сохранён ключ `widget = profiles_list` ради обратной совместимости существующих обработчиков событий.

## 8) Что осталось
- [ ] При следующем major-окне синхронизировать внутренние имена/файлы (`ProfilesListWidget` → `ProfilesWidget`) и при необходимости оформить deprecation-политику для alias.
- [ ] Добавить host-level e2e для `profiles-widget-demo` в контуре AprilHub.
