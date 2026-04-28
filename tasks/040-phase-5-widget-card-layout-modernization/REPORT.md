## 1) Итого
- Статус: ✅ выполнено
- Задача: 040 — переделка `widget-card` под master-detail 25/75
- Ветка: `feature/task-040-widget-card-layout-modernization`
- Коммиты: `не создавались`
- PR: не создавался

## 2) Что сделано
- [frontend] Перестроен `ProfilesListWidget` в layout `25% / 75%`:
  - левая колонка `Card List Column` (поиск, фильтр, пагинация, выбор активного профиля);
  - правая карточка выбранного профиля (просмотр и редактирование).
- [frontend] Создание нового профиля вынесено в модальное окно, открываемое кнопкой `+`.
- [frontend] Добавлена синхронизация списка и карточки при create/update/delete.
- [frontend] Сохранена безопасная обработка API-ошибок `401/403/409`.
- [tests] Обновлены RTL/MSW тесты `ProfilesListWidget` под новый UX-поток.
- [docs] Обновлены `frontend/packages/profile-ui/README.md`, docs-site story и overview задачи.

## 3) Изменённые файлы
- `frontend/packages/profile-ui/src/components/ProfilesListWidget.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesListWidget.test.tsx`
- `frontend/packages/profile-ui/README.md`
- `docs-site/docs/task-story-040-phase-5-widget-card-layout-modernization.md`
- `docs-site/docs/task-stories-overview.md`
- `tasks/040-phase-5-widget-card-layout-modernization/TASK.md`
- `tasks/040-phase-5-widget-card-layout-modernization/PLAN.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да (откат через git revert/rollback изменений фронтенда и документации)

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: не применялось
- E2E / smoke: не применялось

Команды (фактически выполненные):
```bash
cd frontend && npm run test -w @april/profile-ui && npm run lint && npm run build
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: нет

## 7) Риски и ограничения
- Виджет по-прежнему строит список из входного `entityIds` (без отдельного list endpoint).
- Для очень больших наборов `entityIds` может понадобиться серверная пагинация как follow-up.

## 8) Что осталось
- [ ] При необходимости вынести `Card List Column` в общий reusable слой между виджетами профилей.
- [ ] Добавить e2e-сценарий для master-detail UX в контуре AprilHub.
