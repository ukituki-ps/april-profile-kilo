## 1) Итого
- Статус: ✅ выполнено
- Задача: рефактор `ProfilesWidget` в модель `Core + ApiWidget` и удаление demo-first поведения
- Ветка: `develop`
- Коммиты: `не создавались`
- PR: не создавался

## 2) Что сделано
- [backend] Не менялся (использован контракт и SDK из задачи 043).
- [frontend] Выполнен рефактор `ProfilesWidget`:
  - добавлен `ProfilesWidgetCore` (UI/state machine без OpenAPI/env зависимостей);
  - добавлен `ProfilesApiWidget` (adapter/wiring слой);
  - добавлен provider-контракт `ProfilesDataProvider` и OpenAPI-реализация `createOpenApiProfilesProvider`;
  - `ProfilesWidget` стал фасадом над `ProfilesApiWidget`;
  - `entityIds` удалён из публичного props-контракта.
- [frontend] Демонстрационный маршрут обновлён: удалён demo-only sourcing списка через `VITE_PROFILE_LIST_DEMO_ENTITY_IDS`.
- [frontend] Тесты мигрированы:
  - добавлен unit `ProfilesWidgetCore.test.tsx` (через mock provider);
  - обновлён `ProfilesListWidget.test.tsx` на server-side list контракт.
- [docs] Обновлены README/карточка виджета/docs-site story + overview, а также статус в `task_list.md` и чекбоксы в `TASK.md`.

## 3) Изменённые файлы
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.test.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesApiWidget.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidget.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesListWidget.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesListWidget.test.tsx`
- `frontend/packages/profile-ui/src/providers/profilesDataProvider.ts`
- `frontend/packages/profile-ui/src/providers/openapiProfilesProvider.ts`
- `frontend/packages/profile-ui/src/index.ts`
- `frontend/src/App.tsx`
- `frontend/packages/profile-ui/README.md`
- `docs/widgets/profile/profiles-widget.md`
- `docs-site/docs/task-story-044-phase-6-profiles-widget-core-api-refactor.md`
- `docs-site/docs/task-stories-overview.md`
- `tasks/044-phase-6-profiles-widget-core-api-refactor/TASK.md`
- `tasks/044-phase-6-profiles-widget-core-api-refactor/REPORT.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да; откат возможен revert frontend/docs изменения

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: ok (в рамках frontend/MSW)
- E2E / smoke: не запускались

Команды (фактически выполненные):
```bash
npm run lint -w @april/profile-ui
npm run test -w @april/profile-ui
cd frontend && npm run lint && npm run test && npm run build
```

## 6) Деплой
- Среда: нет
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: нет

## 7) Риски и ограничения
- `ProfilesListWidget` оставлен как alias для импорт-совместимости; его использование считается legacy и не должно применяться в новых интеграциях.
- Типы фильтров (список `entity_type_id`) строятся из загруженных страниц; для полного каталога типов нужен отдельный endpoint/flow.

## 8) Что осталось
- [ ] Отдельная задача на Hub e2e/release-gate проверки обновлённого `ProfilesWidget` в host-контуре.
